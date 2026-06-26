#!/bin/bash

# Ensure Brew binaries are in PATH (common for Apple Silicon Mac)
export PATH="/opt/homebrew/bin:$PATH"

# Terminate background processes on script exit
cleanup() {
  echo ""
  echo "Shutting down servers..."
  if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null
  fi
  if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID 2>/dev/null
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo "=== Starting backend FastAPI server ==="
cd "$(dirname "$0")/backend"

# Ensure Java 17 is used if available (to prevent PySpark Java 24 incompatibilities)
if [ -d "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" ]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
fi

if [ -d "venv" ]; then
  echo "Activating virtual environment..."
  source venv/bin/activate
else
  echo "Creating virtual environment..."
  python3 -m venv venv
  source venv/bin/activate
fi

echo "Installing/checking backend dependencies..."
pip install -r requirements.txt

echo "Running uvicorn server on port 8000..."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "=== Starting frontend Vite server ==="
cd "../frontend"
if [ ! -d "node_modules" ]; then
  echo "Installing Node dependencies..."
  npm install
fi

echo "Running Vite dev server on port 5173..."
npm run dev &
FRONTEND_PID=$!

# Keep script running to monitor processes
echo "=== Both servers are running! ==="
echo "Backend: http://127.0.0.1:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."

wait
