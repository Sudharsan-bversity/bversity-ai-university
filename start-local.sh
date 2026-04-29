#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# Load env vars
export $(grep -v '^#' "$ROOT/.env" | xargs)
export DB_PATH="$ROOT/bversity.db"
export SUBMISSIONS_DIR="$ROOT/submissions"
mkdir -p "$SUBMISSIONS_DIR"

# Install Python deps if needed
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "Installing Python dependencies..."
  pip3 install -r "$BACKEND/requirements.txt" -q
fi

# Install Node deps if needed
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "Installing Node dependencies..."
  cd "$FRONTEND" && npm install
fi

# Kill any existing processes on our ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo ""
echo "Starting Bversity locally..."
echo ""

# Start backend
cd "$BACKEND"
ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
RESEND_API_KEY="$RESEND_API_KEY" \
RESEND_FROM_EMAIL="$RESEND_FROM_EMAIL" \
DB_PATH="$DB_PATH" \
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend (proxy to backend at 8000)
cd "$FRONTEND"
VITE_BACKEND_URL=http://localhost:8000 npm run dev -- --port 3000 &
FRONTEND_PID=$!

echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo ""
echo "  Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
