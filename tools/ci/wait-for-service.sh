#!/bin/bash
set -e

usage() {
    echo "Usage: $0 <host> <port> [service_name] [max_attempts]"
    echo "  host: Host to check (e.g., localhost)"
    echo "  port: Port to check (e.g., 8002)"
    echo "  service_name: Optional name for logging (default: Service)"
    echo "  max_attempts: Optional max attempts (default: 60)"
    echo ""
    echo "Examples:"
    echo "  $0 localhost 8002"
    echo "  $0 localhost 8002 'Backend API'"
    echo "  $0 localhost 8002 'Backend API' 120"
    exit 1
}

if [ $# -lt 2 ]; then
    echo "ERROR: Missing required parameters"
    usage
fi

HOST=$1
PORT=$2
SERVICE_NAME=${3:-"Service"}
MAX_ATTEMPTS=${4:-60}

echo "Waiting for $SERVICE_NAME at $HOST:$PORT..."

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
    if curl -f -s "http://$HOST:$PORT" >/dev/null 2>&1 || \
       nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
        echo "$SERVICE_NAME is ready!"
        exit 0
    fi
    
    echo "Attempt $attempt/$MAX_ATTEMPTS: $SERVICE_NAME not ready yet..."
    sleep 5
    attempt=$((attempt + 1))
done

echo "ERROR: $SERVICE_NAME failed to become ready after $((MAX_ATTEMPTS * 5)) seconds"
exit 1