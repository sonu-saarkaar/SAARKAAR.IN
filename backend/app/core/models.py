# type: ignore
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class ProjectModel(BaseModel):
    name: str
    description: str
    problem: str
    solution: str
    features: List[str] = []
    tech_stack: List[str] = []
    status: str = Field(default="dev", description="live or dev")
    vision: str
    keywords: List[str] = []

class JoinRequestModel(BaseModel):
    name: str
    email: EmailStr
    role: str
    skills: List[str] = []
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationHistoryModel(BaseModel):
    user_id: str
    session_id: str
    messages: List[dict] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)
