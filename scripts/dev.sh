#!/bin/bash

# Ensure we are in the project root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

echo "========================================="
echo "   🚀 Starting Local Dev Environment     "
echo "========================================="

echo "[1/4] Checking for lingering processes..."
PIDS=$(lsof -t -i:8080 -i:3000)
if [ ! -z "$PIDS" ]; then
  echo "      Killing lingering processes on ports 8080/3000..."
  kill -9 $PIDS 2>/dev/null
  sleep 1
else
  echo "      Ports are clear."
fi

# Function to cleanly stop everything on exit
cleanup() {
  echo ""
  echo "========================================="
  echo "   🛑 Shutting down dev servers...       "
  echo "========================================="
  kill -9 $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit
}

# Trap Ctrl+C (SIGINT) and kill the background processes
trap cleanup SIGINT SIGTERM

echo "[2/4] Starting Backend Server (Port 8080)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "[3/4] Starting Frontend Server (Port 3000)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "[4/4] All systems online!"
echo "      Leave this terminal open to view live logs."
echo "      Press Ctrl+C to stop both servers."
echo "-----------------------------------------"

# Wait indefinitely so the script doesn't exit, allowing the trap to catch Ctrl+C
wait
