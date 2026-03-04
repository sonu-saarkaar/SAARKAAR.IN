# =========================================================
# MONOLITHIC DEPLOYMENT - OPTIMIZED FOR KUBERNS/RENDER/RAILWAY
# =========================================================

# ---------------------------------------------------------
# STAGE 1: React Frontend Builder
# ---------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend/ .

# Connect Vite automatically to the monolithic /api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------------------------------------------------------
# STAGE 2: Python Backend (FastAPI + React SPA)
# ---------------------------------------------------------
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FRONTEND_DIST=/app/frontend/dist

WORKDIR /app

# Install OS dependencies required for deployment features
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev curl && rm -rf /var/lib/apt/lists/*

# Install python packages globally for simplicity in the exact same container state
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend files into the current python runtime
COPY backend/ ./backend/

# Retrieve the fully compiled React app from the first stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Set a non-root user for security (and /tmp fallback for uploads)
RUN useradd -m appuser && chown -R appuser /app
USER appuser

EXPOSE 8000

WORKDIR /app/backend

# We evaluate standard Cloud platform assigned $PORT explicitly (falls back to 8000 safely)
CMD gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --timeout 120 --graceful-timeout 30
