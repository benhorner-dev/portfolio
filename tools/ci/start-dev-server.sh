#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting development server for E2E tests..."

LOG_FILE="server-logs.txt"

echo "Starting dev server with enhanced logging..."

TURBOPACK_LOG_LEVEL=debug \
NEXT_TELEMETRY_DISABLED=1 \
BUN_LOG_LEVEL=debug \
FORCE_COLOR=1 \
bunx turbo dev:fe > "$LOG_FILE" 2>&1 &

DEV_PID=$!
echo "Dev server PID: $DEV_PID"

echo "$DEV_PID" > .dev-server.pid

echo "Waiting for server to start..."

tail -f "$LOG_FILE" &
TAIL_PID=$!
echo "$TAIL_PID" > .tail.pid

echo "Waiting for http://localhost:3000 to be available..."
bunx wait-on http://localhost:3000 --timeout 120000

echo "✅ Server is ready at http://localhost:3000"

kill "$TAIL_PID" 2>/dev/null || true
rm -f .tail.pid

echo "✅ Development server started successfully!"
