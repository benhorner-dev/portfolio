#!/usr/bin/env bash
set -euo pipefail

NEON_BRANCH_NAME="${1:-}"
NEON_API_KEY="${2:-}"
NEON_PROJECT_ID="${3:-}"

if [ -z "$NEON_BRANCH_NAME" ] || [ -z "$NEON_API_KEY" ] || [ -z "$NEON_PROJECT_ID" ]; then
    echo "❌ Usage: $0 <neon_branch_name> <neon_api_key> <neon_project_id>"
    echo "❌ All parameters are required"
    exit 1
fi

echo "🔍 Debug info:"
echo "  Looking for Neon branch: '$NEON_BRANCH_NAME'"

echo "🔍 Fetching branches..."
RESPONSE=$(curl -s -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches")

if [ $? -ne 0 ]; then
  echo "❌ Failed to call Neon API"
  exit 1
fi

echo "🔍 Available branches:"
echo "$RESPONSE" | jq -r '.branches[] | "Name: \(.name) | ID: \(.id)"'

BRANCH_ID=$(echo "$RESPONSE" | jq -r --arg branch_name "$NEON_BRANCH_NAME" \
  '.branches[] | select(.name == $branch_name) | .id')

if [ "$BRANCH_ID" = "null" ] || [ -z "$BRANCH_ID" ]; then
  echo "❌ Branch '$NEON_BRANCH_NAME' not found in Neon"
  echo "Available branches:"
  echo "$RESPONSE" | jq -r '.branches[].name'
  exit 1
fi

echo "✅ Found branch ID: $BRANCH_ID"

echo "🔍 Fetching connection URI for branch ID: $BRANCH_ID"
URI_RESPONSE=$(curl -s -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/connection_uri?branch_id=$BRANCH_ID&database_name=neondb&role_name=neondb_owner")

if [ $? -ne 0 ]; then
  echo "❌ Failed to get connection URI from Neon API"
  exit 1
fi

DB_URL=$(echo "$URI_RESPONSE" | jq -r '.uri')

if [ "$DB_URL" = "null" ] || [ -z "$DB_URL" ]; then
  echo "❌ Failed to get connection URI"
  echo "URI Response: $URI_RESPONSE"
  exit 1
fi

if [[ ! "$DB_URL" =~ (^postgres://|^postgresql://|\*\*\*.*neon\.tech) ]]; then
  echo "❌ Invalid database URL format: '$DB_URL'"
  exit 1
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "DATABASE_URL=$DB_URL" >> "$GITHUB_OUTPUT"
else
    echo "DATABASE_URL=$DB_URL"
fi

echo "✅ Found database URL for branch: '$NEON_BRANCH_NAME'"
echo "✅ Branch ID: $BRANCH_ID"
echo "✅ Connection URL retrieved successfully (masked by GitHub Actions)"

echo "🔄 Installing dependencies..."
bun install

echo "🔄 Running migrations..."
export DATABASE_URL="$DB_URL"
bunx turbo migrate

echo "✅ Migrations completed successfully"
