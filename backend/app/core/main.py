import uuid
import structlog
from fastapi import FastAPI, Request
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time

from app.core.ai_agents.orchestrator import KYRONMultiAgentSystem
from app.core.logger import setup_logging

# Configure logging at app startup (False for Dev, True for Prod)
setup_logging(is_production=True)
logger = structlog.get_logger("api")

app = FastAPI(title="SAARKAAR AI 2.0 API")

# Setup MongoDB - support both MONGODB_URI and MONGO_URI env var names
MONGO_URL = (
    os.getenv("MONGODB_URI") or 
    os.getenv("MONGO_URI") or 
    os.getenv("MONGO_URL") or 
    "mongodb://localhost:27017"
)
client = AsyncIOMotorClient(MONGO_URL)
db = client.saarkaar_db

@app.on_event("startup")
async def startup_db_client():
    from app.core.rag.retriever import initialize_rag
    # await initialize_rag()
    pass

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# -----------------------------------------------------------------
# MIDDLEWARE: Global Request Tracking & Logging
# -----------------------------------------------------------------
@app.middleware("http")
async def structlog_request_middleware(request: Request, call_next):
    # Generates a universal tracking ID for every API hit
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Binds it to the context. Every logger.info() during this request will automatically print this UUID.
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else "unknown"
    )

    start_time = time.perf_counter()
    
    # Process the request
    try:
        response = await call_next(request)
        process_time_ms = (time.perf_counter() - start_time) * 1000
        
        # Log success
        logger.info("request_completed", 
                    status_code=response.status_code, 
                    duration_ms=round(process_time_ms, 2))
        
        response.headers["X-Request-ID"] = request_id
        return response
        
    except Exception as e:
        process_time_ms = (time.perf_counter() - start_time) * 1000
        # Log unhandled 500 crashes
        logger.exception("request_failed_500", 
                         error=str(e), 
                         duration_ms=round(process_time_ms, 2))
        raise e

# Temporary endpoint to demonstrate layer execution
@app.post("/api/v2/chat")
async def chat_multillayer(request: dict):
    msg = request.get("message", "")
    sid = request.get("session_id", "default")
    char = request.get("character", "Assistant")
    
    structlog.contextvars.bind_contextvars(session_id=sid, intent_character=char)
    logger.info("chat_request_started", message_len=len(msg))
    
    agent_system = KYRONMultiAgentSystem(session_id=sid, character=char)
    reply = await agent_system.process_message(msg)
    
    logger.info("chat_request_completed", reply_len=len(reply))
    
    return {
        "reply": reply,
        "session": sid
    }

@app.get("/health")
async def health_check():
    """Kubernetes/Kuberns readiness and liveness probe endpoint."""
    import time
    return {"status": "healthy", "service": "SAARKAAR AI 2.0", "timestamp": time.time()}

@app.get("/")
async def root():
    return {"message": "SAARKAAR AI 2.0 API Running", "status": "online"}
