#!/usr/bin/env bash
set -euo pipefail

BRANCH_DETECTION_FAILED="false"

EVENT_NAME="${1:-}"
GITHUB_TOKEN="${2:-}"
GITHUB_REPOSITORY="${3:-}"
GITHUB_REPOSITORY_OWNER="${4:-}"

DEPLOYMENT_REF="${5:-}"
DEPLOYMENT_ENV="${6:-}"
DEPLOYMENT_PAYLOAD="${7:-}"
DEPLOYMENT_DESC="${8:-}"
PR_NUMBER_FROM_EVENT="${9:-}"
HEAD_REF="${10:-}"

if [ -z "$EVENT_NAME" ] || [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ]; then
    echo "❌ Usage: $0 <event_name> <github_token> <github_repository> <github_repository_owner> [deployment_ref] [deployment_env] [deployment_payload] [deployment_desc] [pr_number] [head_ref]"
    echo "❌ Required parameters: event_name, github_token, github_repository"
    exit 1
fi

echo "🔍 Event name: $EVENT_NAME"

if [[ "$EVENT_NAME" == "deployment_status" ]]; then
    echo "🔍 Deployment ref: $DEPLOYMENT_REF"
    echo "🔍 Deployment environment: $DEPLOYMENT_ENV"
    echo "🔍 Deployment payload: $DEPLOYMENT_PAYLOAD"
    echo "🔍 Deployment description: $DEPLOYMENT_DESC"

    COMMIT_SHA="$DEPLOYMENT_REF"
    echo "🔍 Fetching branch info for commit: $COMMIT_SHA"

    BRANCHES_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/$GITHUB_REPOSITORY/commits/$COMMIT_SHA/branches-where-head")

    echo "🔍 Branches containing this commit:"
    echo "$BRANCHES_RESPONSE" | jq -r '.[].name' || echo "No branches found or jq failed"

    BRANCH_NAME=$(echo "$BRANCHES_RESPONSE" | jq -r '.[] | select(.name != "main" and .name != "master") | .name' | head -n 1)

    if [[ -z "$BRANCH_NAME" || "$BRANCH_NAME" == "null" ]]; then
      if [[ "$DEPLOYMENT_DESC" =~ ([a-zA-Z0-9/_-]+) ]]; then
        BRANCH_NAME="${BASH_REMATCH[1]}"
        echo "🔍 Extracted branch from description: $BRANCH_NAME"
      else
        echo "⚠️ Could not determine branch name - will skip later stages"
        BRANCH_NAME="unknown"
        PR_NUMBER="unknown"
        NEON_BRANCH_NAME="unknown"
        BRANCH_DETECTION_FAILED="true"
      fi
    else
      echo "✅ Found branch name: $BRANCH_NAME"
    fi

    if [[ "$BRANCH_DETECTION_FAILED" != "true" ]]; then
      if [[ "$BRANCH_NAME" =~ pr-([0-9]+) ]] || [[ "$BRANCH_NAME" =~ ([0-9]+) ]]; then
        PR_NUMBER="${BASH_REMATCH[1]}"
        echo "✅ Extracted PR number from branch name: $PR_NUMBER"
      else
        PR_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
          "https://api.github.com/repos/$GITHUB_REPOSITORY/pulls?head=$GITHUB_REPOSITORY_OWNER:$BRANCH_NAME&state=open")

        PR_NUMBER=$(echo "$PR_RESPONSE" | jq -r '.[0].number // empty')

        if [[ -n "$PR_NUMBER" && "$PR_NUMBER" != "null" ]]; then
          echo "✅ Found PR number from API: $PR_NUMBER"
        else
          echo "⚠️ Could not find PR number, using 'unknown'"
          PR_NUMBER="unknown"
        fi
      fi

      NEON_BRANCH_NAME="preview/$BRANCH_NAME"
    fi

elif [[ "$EVENT_NAME" == "pull_request" ]]; then
    PR_NUMBER="$PR_NUMBER_FROM_EVENT"
    BRANCH_NAME="$HEAD_REF"
    NEON_BRANCH_NAME="preview/$BRANCH_NAME"
    echo "✅ Using PR event data - PR: $PR_NUMBER, Branch: $BRANCH_NAME"
else
    echo "❌ Unsupported event type: $EVENT_NAME"
    exit 1
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "pr_number=$PR_NUMBER" >> "$GITHUB_OUTPUT"
    echo "branch=$BRANCH_NAME" >> "$GITHUB_OUTPUT"
    echo "neon_branch_name=$NEON_BRANCH_NAME" >> "$GITHUB_OUTPUT"
    echo "branch_detection_failed=${BRANCH_DETECTION_FAILED:-false}" >> "$GITHUB_OUTPUT"
else
    echo "PR_NUMBER=$PR_NUMBER"
    echo "BRANCH_NAME=$BRANCH_NAME"
    echo "NEON_BRANCH_NAME=$NEON_BRANCH_NAME"
    echo "BRANCH_DETECTION_FAILED=${BRANCH_DETECTION_FAILED:-false}"
fi

echo "🔍 Final values:"
echo "  PR Number: $PR_NUMBER"
echo "  Branch: $BRANCH_NAME"
echo "  Neon Branch Name: $NEON_BRANCH_NAME"
