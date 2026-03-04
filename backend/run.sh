#!/bin/bash
export PORT=${PORT:-8000}
echo "Starting SAARKAAR Virtual Office on PORT: $PORT"
gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120
