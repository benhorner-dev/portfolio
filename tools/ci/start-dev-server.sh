#!/usr/bin/env bash
set -euo pipefail
echo "🚀 Starting development server for E2E tests..."
LOG_FILE="server-logs.txt"
echo "Starting dev server with enhanced logging..."

# Start the dev server with tee for dual output
TURBOPACK_LOG_LEVEL=debug \
NEXT_TELEMETRY_DISABLED=1 \
BUN_LOG_LEVEL=debug \
FORCE_COLOR=1 \
bunx turbo dev:fe --log-order=stream --output-logs=new-only 2>&1 | tee "$LOG_FILE" &

# Get the PID of the entire pipeline
DEV_PID=$!
echo "Dev server pipeline PID: $DEV_PID"
echo "$DEV_PID" > .dev-server.pid

# No need for tail -f since tee is already outputting to console
# Just save a dummy PID for compatibility with cleanup script
echo "$$" > .tail.pid

echo "Waiting for http://localhost:3000 to be available..."
bunx wait-on http://localhost:3000 --timeout 120000
echo "✅ Server is ready at http://localhost:3000"
echo "✅ Development server started successfully!"
