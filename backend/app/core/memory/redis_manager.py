import redis
import json
from typing import List, Dict

# Setup Redis connection (assumes redis is running on localhost)
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

MEMORY_LIMIT = 10 # short term message count

# STEP 5: SHORT TERM REDIS MEMORY
def add_to_short_term_memory(session_id: str, role: str, content: str):
    \"\"\"
    Append message to Redis list (short term conversation state)
    Keep only the last MEMORY_LIMIT messages.
    \"\"\"
    key = f"session:{session_id}:messages"
    message_obj = {"role": role, "content": content}
    redis_client.rpush(key, json.dumps(message_obj))
    # trim to limit
    redis_client.ltrim(key, -MEMORY_LIMIT, -1)
    
def get_short_term_memory(session_id: str) -> List[Dict[str, str]]:
    key = f"session:{session_id}:messages"
    messages = redis_client.lrange(key, 0, -1)
    return [json.loads(m) for m in messages] if messages else []

# STEP 5 (B): LONG TERM MONGO MEMORY
async def dump_to_long_term_memory(session_id: str, db_collection):
    \"\"\"
    Move conversation from Redis to MongoDB on session end/idle timeout.
    \"\"\"
    messages = get_short_term_memory(session_id)
    if not messages:
        return
        
    await db_collection.insert_one({
        "session_id": session_id,
        "messages": messages,
        "archived_at": datetime.utcnow()
    })
    
    # clear redis
    redis_client.delete(f"session:{session_id}:messages")
    
# FACT EXTRACTION (User Name, Preferences)
def update_user_fact(session_id: str, fact_key: str, fact_value: str):
    \"\"\"
    Store user specifics like name or intent state.
    \"\"\"
    redis_client.hset(f"session:{session_id}:facts", fact_key, fact_value)

def get_user_facts(session_id: str) -> Dict[str, str]:
    return redis_client.hgetall(f"session:{session_id}:facts")
