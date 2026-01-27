from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models import AIChatRequest, AIChatResponse
from app.ai_service import get_ai_response

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/chat", response_model=AIChatResponse)
@limiter.limit("10/minute")
async def chat(request: Request, chat_data: AIChatRequest):
    """
    Chat with the AI assistant (rate limited to 10 requests per minute)
    """
    try:
        response = await get_ai_response(chat_data.message)
        return AIChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

