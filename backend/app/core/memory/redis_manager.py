import redis
import json
import os
import logging
from typing import List, Dict
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Read Redis connection from environment variables (works for Docker, K8s, Kuberns)
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=0,
        decode_responses=True,
        socket_connect_timeout=3,
        socket_timeout=3,
    )
    redis_client.ping()
    logger.info(f"Redis connected at {REDIS_HOST}:{REDIS_PORT}")
except Exception as e:
    logger.warning(f"Redis unavailable ({e}). Using in-memory fallback.")
    redis_client = None

# In-memory fallback store when Redis is not available
_memory_store: Dict[str, list] = {}
_facts_store: Dict[str, dict] = {}

MEMORY_LIMIT = 10  # short term message count


# ─── SHORT TERM MEMORY ─────────────────────────────────────────────
def add_to_short_term_memory(session_id: str, role: str, content: str):
    """Append message to Redis list. Falls back to in-memory if Redis is down."""
    message_obj = {"role": role, "content": content}

    if redis_client:
        try:
            key = f"session:{session_id}:messages"
            redis_client.rpush(key, json.dumps(message_obj))
            redis_client.ltrim(key, -MEMORY_LIMIT, -1)
            return
        except Exception as e:
            logger.warning(f"Redis write failed: {e}. Using in-memory.")

    # In-memory fallback
    if session_id not in _memory_store:
        _memory_store[session_id] = []
    _memory_store[session_id].append(message_obj)
    if len(_memory_store[session_id]) > MEMORY_LIMIT:
        _memory_store[session_id] = _memory_store[session_id][-MEMORY_LIMIT:]


def get_short_term_memory(session_id: str) -> List[Dict[str, str]]:
    """Retrieve conversation history. Falls back to in-memory if Redis is down."""
    if redis_client:
        try:
            key = f"session:{session_id}:messages"
            messages = redis_client.lrange(key, 0, -1)
            return [json.loads(m) for m in messages] if messages else []
        except Exception as e:
            logger.warning(f"Redis read failed: {e}. Using in-memory.")

    return _memory_store.get(session_id, [])


# ─── LONG TERM MEMORY ─────────────────────────────────────────────
async def dump_to_long_term_memory(session_id: str, db_collection):
    """Move conversation from Redis/memory to MongoDB on session end."""
    messages = get_short_term_memory(session_id)
    if not messages:
        return

    await db_collection.insert_one({
        "session_id": session_id,
        "messages": messages,
        "archived_at": datetime.now(timezone.utc)
    })

    # Clear from Redis/memory
    if redis_client:
        try:
            redis_client.delete(f"session:{session_id}:messages")
        except Exception:
            pass
    _memory_store.pop(session_id, None)


# ─── FACT STORAGE ──────────────────────────────────────────────────
def update_user_fact(session_id: str, fact_key: str, fact_value: str):
    """Store user specifics (name, preferences) in Redis or in-memory."""
    if redis_client:
        try:
            redis_client.hset(f"session:{session_id}:facts", fact_key, fact_value)
            return
        except Exception as e:
            logger.warning(f"Redis hset failed: {e}")

    if session_id not in _facts_store:
        _facts_store[session_id] = {}
    _facts_store[session_id][fact_key] = fact_value


def get_user_facts(session_id: str) -> Dict[str, str]:
    if redis_client:
        try:
            return redis_client.hgetall(f"session:{session_id}:facts")
        except Exception:
            pass
    return _facts_store.get(session_id, {})
