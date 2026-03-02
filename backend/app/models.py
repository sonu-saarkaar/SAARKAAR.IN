from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Existing Models ---
class AIChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    tenant_id: str = "default_tenant"
    current_partner: Optional[str] = None

class CharacterConfig(BaseModel):
    name: str
    role: str
    authority_level: int
    voice_type: str
    speaking_style: str
    formality_level: int
    autonomy_level: int

class TenantConfig(BaseModel):
    tenant_id: str
    company_name: str
    branding: dict
    ai_personality_tone: str
    characters: List[CharacterConfig]
    voice_enabled: bool
    subscription_plan: str

class VoiceResponse(BaseModel):
    character: str
    tone: str

class MoodSchema(BaseModel):
    confidence: float
    patience: float
    energy: float

class AIChatResponse(BaseModel):
    response: str
    intent: Optional[str] = None
    action: Optional[str] = None
    voice: Optional[VoiceResponse] = None
    character_state: Optional[str] = None
    mood: Optional[MoodSchema] = None
    animation: Optional[str] = None
    autonomous_action: Optional[str] = None
    ui_trigger: Optional[dict] = None
    active_character: Optional[str] = None
    camera_focus: Optional[str] = None

class IntentResponse(BaseModel):
    intent: str
    confidence: float

# --- Portfolio Models ---
class ProjectSchema(BaseModel):
    title: str = Field(..., min_length=1)
    tagline: str = Field(..., min_length=1)
    category: str
    description: str
    vision: Optional[str] = None
    status: str
    tech_stack: List[str]
    problem_statement: str
    solution: str
    features: List[str]
    gallery: List[str] = []
    live_link: Optional[str] = None
    client_info: Optional[str] = None
    timeline: Optional[str] = None
    badge: Optional[str] = None
    gradient: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "KYRON",
                "tagline": "AI Digital Execution Agent",
                "category": "AI Automation",
                "description": "Autonomous AI agent...",
                "status": "Flagship",
                "tech_stack": ["Python", "FastAPI"],
                "problem_statement": "...",
                "solution": "...",
                "features": ["Feature 1"],
                "gallery": [],
                "live_link": "https://...",
                "client_info": "Internal",
                "timeline": "2023-Present",
                "badge": "Flagship",
                "gradient": "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)"
            }
        }

class CreateProject(ProjectSchema):
    pass

class UpdateProject(BaseModel):
    title: Optional[str]
    tagline: Optional[str]
    description: Optional[str]
    status: Optional[str]
    tech_stack: Optional[List[str]]
    problem_statement: Optional[str]
    solution: Optional[str]
    features: Optional[List[str]]
    gallery: Optional[List[str]]
    live_link: Optional[str]
    client_info: Optional[str]
    timeline: Optional[str]
    badge: Optional[str]
    gradient: Optional[str]

    class Config:
        json_schema_extra = {
            "example": {
                "title": "KYRON V2"
            }
        }

# --- Interaction Models ---
class FeedbackSchema(BaseModel):
    name: str
    email: EmailStr
    feedback: str
    created_at: datetime = Field(default_factory=datetime.now)

class JoinRequestSchema(BaseModel):
    full_name: str
    role: str
    portfolio_link: Optional[str] = None
    resume_url: Optional[str] = None  # URL from file upload
    message: str
    created_at: datetime = Field(default_factory=datetime.now)

class AppointmentSchema(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str]
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    reason: str
    confirmed: bool = False
    created_at: datetime = Field(default_factory=datetime.now)

class ResumeRequestSchema(BaseModel):
    name: str
    email: EmailStr
    organization: Optional[str] = None
    resume_type: str
    reason: str
    status: str = "pending" # pending, approved, rejected
    token: Optional[str] = None
    expires_at: Optional[datetime] = None
    download_count: int = 0
    last_downloaded: Optional[datetime] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class AdminHealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    db_connected: bool
    checked_at: datetime
