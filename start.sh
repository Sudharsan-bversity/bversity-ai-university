#!/bin/bash
set -euo pipefail

docker-compose up --build -d

# Wait for services to initialize
sleep 3

echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "To stop: docker-compose down"