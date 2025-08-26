#!/usr/bin/env bash
set -euo pipefail

TEST_FILE="${1:-""}"

if [ -n "$TEST_FILE" ]; then
  echo "🧪 Running E2E test: $TEST_FILE"
  echo "Running integration tests with verbose turbo output..."
  set +e
  TURBO_LOG_VERBOSITY=2 bunx turbo test:e2e --verbosity=2 -- "$TEST_FILE"
  TEST_EXIT_CODE=$?
  set -e
else
  echo "🧪 Running all E2E tests..."
  echo "Running integration tests with verbose turbo output..."
  set +e
  TURBO_LOG_VERBOSITY=2 bunx turbo test:e2e --verbosity=2
  TEST_EXIT_CODE=$?
  set -e
fi

cleanup() {
  echo "🧹 Cleaning up processes..."

  if [ -f .dev-server.pid ]; then
    DEV_PID=$(cat .dev-server.pid)
    kill "$DEV_PID" 2>/dev/null || true
    rm -f .dev-server.pid
    echo "Stopped dev server (PID: $DEV_PID)"
  fi

  if [ -f .tail.pid ]; then
    TAIL_PID=$(cat .tail.pid)
    kill "$TAIL_PID" 2>/dev/null || true
    rm -f .tail.pid
    echo "Stopped log tail (PID: $TAIL_PID)"
  fi

  echo "=== CI RUN COMPLETED AT $(date) ===" >> server-logs.txt
  echo "Test exit code: ${TEST_EXIT_CODE:-'unknown'}" >> server-logs.txt
}

trap cleanup EXIT

echo "Tests completed with exit code: $TEST_EXIT_CODE"
exit $TEST_EXIT_CODE
