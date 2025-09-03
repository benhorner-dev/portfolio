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

# Keep tailing the logs in background without killing it
tail -f "$LOG_FILE" &
TAIL_PID=$!
echo "$TAIL_PID" > .tail.pid

echo "Waiting for http://localhost:3000 to be available..."
bunx wait-on http://localhost:3000 --timeout 120000
echo "✅ Server is ready at http://localhost:3000"
# Don't kill the tail process here
echo "✅ Development server started successfully!"
