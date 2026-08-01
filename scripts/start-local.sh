#!/bin/bash

# Simple script to spin up the StockPrice application locally

echo "Starting StockPrice Docker containers..."
echo "This will run in detached mode."
echo ""

# Ensure we are in the project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

# Check if docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "⚠️  ERROR: Docker daemon is not running."
    echo "Please open Docker Desktop from your Applications folder and try again."
    exit 1
fi

# Spin up the containers
docker-compose up --build -d

echo ""
echo "======================================================"
echo "✅ Application started successfully!"
echo "🌐 Frontend available at: http://localhost:3000"
echo "🔌 Backend WebSocket running on: ws://localhost:8080"
echo "======================================================"
echo ""
echo "To view logs, run: docker-compose logs -f"
echo "To stop the application, run: ./scripts/stop-local.sh"
