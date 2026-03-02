from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models import IntentResponse
from app.ml_service import predict_intent

router = APIRouter()

class IntentRequest(BaseModel):
    message: str

@router.post("/intent", response_model=IntentResponse)
async def get_intent(request: IntentRequest):
    """
    Predict the intent of a message using the ML model.
    """
    try:
        prediction = predict_intent(request.message)
        return IntentResponse(
            intent=prediction.get("intent", "unknown"),
            confidence=prediction.get("confidence", 0.0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML service error: {str(e)}")

from app.ml_service import train_intent_model

@router.get("/train")
async def train_model_endpoint():
    success = train_intent_model()
    if success:
        return {"status": "success", "message": "Model trained successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to train model")
