#!/bin/bash

# Simple script to stop the StockPrice application locally

echo "Stopping StockPrice Docker containers..."

# Ensure we are in the project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

# Stop and remove containers
docker-compose down

echo "✅ Containers stopped and removed."
