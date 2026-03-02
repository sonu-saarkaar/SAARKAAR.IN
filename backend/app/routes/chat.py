from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.ai_service import get_ai_response
import re
from datetime import datetime, timezone

from app.database import chat_logs_collection

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: Optional[List[ChatMessage]] = None
    message: Optional[str] = None
    language: str = "en"
    tenant_id: str = "default_tenant"
    session_id: Optional[str] = None
    current_partner: Optional[str] = None


def make_concise_receptionist_reply(text: str, max_sentences: int = 2, max_chars: int = 220) -> str:
    content = (text or "").strip()
    if not content:
        return ""

    normalized = re.sub(r'\s+', ' ', content)
    parts = [p.strip() for p in re.split(r'(?<=[.!?।])\s+', normalized) if p.strip()]

    if parts:
        concise = " ".join(parts[:max_sentences]).strip()
    else:
        concise = normalized

    if len(concise) > max_chars:
        concise = concise[:max_chars].rstrip()
        if ' ' in concise:
            concise = concise.rsplit(' ', 1)[0]
        concise = f"{concise}..."

    return concise

@router.post("/chat")
async def chat_with_receptionist(request: ChatRequest):
    """
    Intelligent AI Receptionist (Powered by GPT-4o / Fallback Demo Mode)
    
    Replaces the old rule-based logic with a direct call to the centralized AI Service.
    This ensures the Receptionist has the same "brain" as the Portfolio AI.
    """
    try:
        print(f"\n=== Receptionist Chat Request ===")
        
        user_message = ""
        # Extract the last user message safely
        if request.messages:
            reversed_msgs = list(reversed(request.messages))
            for msg in reversed_msgs:
                if msg.role == "user":
                    user_message = msg.content
                    break

        if not user_message and request.message:
            user_message = request.message
        
        print(f"User: {user_message}")
        
        if not user_message:
            # Fallback if no user message found in history
            return {
                "response": "I didn't catch that. Could you say it again?",
                "language": request.language
            }
        
        # Call the centralized AI Service (which handles GPT-4o and Fallbacks)
        ai_response = await get_ai_response(user_message, session_id=request.session_id, tenant_id=request.tenant_id)
        ai_response = make_concise_receptionist_reply(ai_response)

        created_at = datetime.now(timezone.utc)
        try:
            await chat_logs_collection.insert_one({
                "tenant_id": request.tenant_id,
                "session_id": request.session_id or "web-session-anonymous",
                "current_partner": request.current_partner or "receptionist",
                "language": request.language,
                "user_message": user_message,
                "assistant_response": ai_response,
                "created_at": created_at,
                "created_at_ts": created_at.timestamp(),
            })
        except Exception:
            pass
        
        print(f"AI: {ai_response}")
        print("===================\n")
        
        return {
            "response": ai_response,
            "language": request.language,
            "session_id": request.session_id
        }
    
    except Exception as e:
        print(f"\n!!! RECEPTIONIST ERROR !!!")
        print(f"{type(e).__name__}: {str(e)}")
        
        # Friendly fallback that encourages trying again
        fallback = "I'm connecting to the main server. Please ask again in a moment."
        return {
            "response": fallback,
            "language": request.language
        }
