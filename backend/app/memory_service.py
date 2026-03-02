from typing import Dict, Any, List
from datetime import datetime
import threading

# Basic in-memory storage. Upgrade to Redis or MongoDB later.
memory_store: Dict[str, Dict[str, Any]] = {}

def _cleanup_expired_sessions():
    """Removes sessions older than 30 minutes."""
    now = datetime.now().timestamp()
    timeout = 30 * 60 # 30 minutes
    to_delete = []
    for session_id, data in memory_store.items():
        if now - data.get("last_active", now) > timeout:
            to_delete.append(session_id)
    for session_id in to_delete:
        del memory_store[session_id]

def _get_or_create_session(session_id: str) -> Dict[str, Any]:
    _cleanup_expired_sessions()
    
    if session_id not in memory_store:
        memory_store[session_id] = {
            "chat_history": [],
            "user_profile": {
                "name": "",
                "preferred_drink": "",
                "last_visit": datetime.now().isoformat(),
                "meeting_history": []
            },
            "mood": {
                "confidence": 0.8,
                "patience": 0.9,
                "energy": 0.7
            },
            "last_active": datetime.now().timestamp(),
            "last_intent": "unknown",
            "past_intents": [],
            "user_journey_stage": "NEW_VISITOR",
            "meeting_summary": None,
            "interaction_count": 0
        }
    else:
        memory_store[session_id]["last_active"] = datetime.now().timestamp()
        
    return memory_store[session_id]

def get_mood(session_id: str) -> Dict[str, float]:
    session = _get_or_create_session(session_id)
    return session["mood"]

def update_mood(session_id: str, updates: Dict[str, float]):
    session = _get_or_create_session(session_id)
    for k, v in updates.items():
        if k in session["mood"]:
            session["mood"][k] = max(0.0, min(1.0, session["mood"][k] + v))
            
def increment_interaction(session_id: str):
    session = _get_or_create_session(session_id)
    session["interaction_count"] += 1
    return session["interaction_count"]

def add_message(session_id: str, role: str, content: str):
    """Add a message to short term memory, keeping last 10."""
    session = _get_or_create_session(session_id)
    history = session["chat_history"]
    history.append({"role": role, "content": content})
    if len(history) > 10:
        session["chat_history"] = history[-10:]

def get_recent_history(session_id: str, limit: int = 5) -> List[Dict[str, str]]:
    """Retrieve N most recent messages."""
    session = _get_or_create_session(session_id)
    return session["chat_history"][-limit:]

def update_user_profile(session_id: str, key: str, value: str):
    """Update a profile field like name or preferred_drink."""
    session = _get_or_create_session(session_id)
    session["user_profile"][key] = value

def get_user_profile(session_id: str) -> Dict[str, Any]:
    """Retrieve the stored user profile."""
    if session_id not in memory_store:
        return {}
    session = memory_store[session_id]
    session["last_active"] = datetime.now().timestamp()
    return session["user_profile"]

def update_intent(session_id: str, intent: str):
    """Store the last detected intent and update past intents."""
    session = _get_or_create_session(session_id)
    session["last_intent"] = intent
    session["past_intents"].append(intent)
    if len(session["past_intents"]) > 5:
        session["past_intents"] = session["past_intents"][-5:]
    
def get_last_intent(session_id: str) -> str:
    """Get the last detected intent."""
    session = _get_or_create_session(session_id)
    return session.get("last_intent", "unknown")

def get_past_intents(session_id: str) -> List[str]:
    session = _get_or_create_session(session_id)
    return session.get("past_intents", [])

def get_journey_stage(session_id: str) -> str:
    session = _get_or_create_session(session_id)
    return session.get("user_journey_stage", "NEW_VISITOR")

def update_journey_stage(session_id: str, stage: str):
    session = _get_or_create_session(session_id)
    session["user_journey_stage"] = stage

def set_meeting_summary(session_id: str, summary_data: dict):
    session = _get_or_create_session(session_id)
    session["meeting_summary"] = summary_data
    # Store summary in historical meetings
    if session["user_profile"]["name"]:
        session["user_profile"]["meeting_history"].append({
            "date": datetime.now().isoformat(),
            "summary": summary_data
        })

def get_meeting_summary(session_id: str) -> dict:
    session = _get_or_create_session(session_id)
    return session.get("meeting_summary")
