from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
import os
import time
from datetime import datetime, timezone

from app.routers import ai
from app.routers import ml
from app.routes import chat
from app.routes import interactive
from app.routes import projects
from app.routes import resume
from app.routes import upload

from app.ml_service import train_intent_model
from app.database import database

from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

env_path = Path(__file__).parent / ".env"
load_status = load_dotenv(dotenv_path=env_path)
logger.info(f"DEBUG: .env file loaded from {env_path}: {load_status}")
if not load_status:
    logger.warning("WARNING: .env file not found or empty!")

app = FastAPI(
    title="SAARKAAR Virtual Office API",
    description="Premium AI-powered virtual office experience API",
    version="2.0.0"
)
APP_START_TIME = time.time()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — reads from env, falls back to localhost dev defaults
_raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS = [
    origin.strip() for origin in _raw_cors.split(",") if origin.strip()
]
# Always allow local dev origins
for _dev in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
    if _dev not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(_dev)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static uploads (resumes)
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(ml.router, prefix="/api/ml", tags=["ml"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(interactive.router, prefix="/api/interaction", tags=["interaction"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(upload.router, prefix="/api", tags=["upload"])

from app.routers import admin
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.on_event("startup")
async def startup_event():
    logger.info("Starting ML Service Context...")
    train_intent_model()

@app.get("/")
async def root():
    return {"message": "SAARKAAR Premium API Running", "status": "online"}

@app.get("/health")
async def health():
    db_connected = True
    try:
        await database.command("ping")
    except Exception:
        db_connected = False

    return {
        "status": "healthy" if db_connected else "degraded",
        "db_status": "connected" if db_connected else "disconnected",
        "uptime_seconds": round(time.time() - APP_START_TIME, 2),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }
