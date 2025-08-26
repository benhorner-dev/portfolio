#!/bin/bash

# validate-commits.sh
# Validates conventional commit format using commitlint for all commits since last tag

set -e  # Exit on any error

echo "🔍 Validating conventional commit format..."

# Get commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -n "$LAST_TAG" ]; then
  COMMIT_RANGE="$LAST_TAG..HEAD"
  echo "📋 Checking commits since tag: $LAST_TAG"
else
  COMMIT_RANGE="HEAD"
  echo "📋 No tags found, checking all commits"
fi

# Get list of commit messages
COMMITS=$(git log --format="%s" $COMMIT_RANGE)

if [ -z "$COMMITS" ]; then
  echo "ℹ️  No commits to validate"
  exit 0
fi

echo "📝 Found $(echo "$COMMITS" | wc -l) commit(s) to validate"
echo ""

# Validate each commit using commitlint
FAILED=false
while IFS= read -r commit; do
  if [ -z "$commit" ]; then
    continue
  fi
  
  echo "Validating: $commit"
  
  if ! echo "$commit" | bunx commitlint; then
    echo "❌ Commit validation failed: '$commit'"
    FAILED=true
  else
    echo "✅ Valid"
  fi
  echo ""
done <<< "$COMMITS"

if [ "$FAILED" = "true" ]; then
  echo "❌ One or more commits failed validation"
  exit 1
fi

echo "✅ All commits follow conventional format!"