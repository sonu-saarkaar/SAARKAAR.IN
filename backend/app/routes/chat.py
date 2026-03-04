from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.ai_service import get_ai_response
import re
from datetime import datetime, timezone
import asyncio
import logging

logger = logging.getLogger(__name__)

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


RECEPTIONIST_SYSTEM_PROMPT = """You are the AI assistant of SAARKAAR.

You must behave like a smart general AI similar to ChatGPT.

Your responsibilities:

1. If the user asks a general question
   → Answer normally using general knowledge.

2. If the user asks about SAARKAAR or any project
   → Use the portfolio knowledge provided in the context.

3. If the user asks about a new word
   → Explain the meaning clearly.

4. If the question is technical
   → Provide a clear explanation.

5. If the question is casual
   → Respond naturally like a human assistant.

6. Never force answers into portfolio context unless the user explicitly asks about those projects.

7. Always prioritize clarity and helpfulness.

You are an intelligent assistant capable of handling both portfolio knowledge and general conversation.
"""


PROJECT_SUMMARIES = {
    "kyron": [
        "KYRON is an AI Digital Execution Agent.",
        "It uses master data memory to auto-fill repetitive government and online forms.",
        "It reduces manual effort, time, and form-level errors.",
        "Status: Under Development.",
        "For deeper architecture, ask the Founder."
    ],
    "kora": [
        "KORA is a live AI-driven structured digital service platform.",
        "It helps users manage service workflows in a clear and organized format.",
        "It is built for reliable digital execution and user control.",
        "Visit Live: https://zynto.in",
        "For deeper architecture, ask the Founder."
    ],
    "dadi": [
        "Dadi's Secret is a modern retail rebranding concept.",
        "It transforms traditional stores into digitally structured brands.",
        "It focuses on clean product presentation and trust-led digital experience.",
        "Status: Live.",
        "For deeper strategy, ask the Founder."
    ],
    "bookmygadi": [
        "BookMyGadi is a vehicle booking platform for local ride systems.",
        "It digitizes unstructured booking flow into a clear reservation process.",
        "It improves reliability in local ride planning and execution.",
        "Visit Live: https://bookmygadi.lovable.app",
        "For deeper system logic, ask the Founder."
    ],
    "bookmythali": [
        "BookMyThali is a customizable regional tiffin ordering platform.",
        "It is designed for students and recurring meal preferences.",
        "It supports structured ordering with personalization focus.",
        "Status: Under Development.",
        "For deeper product design, ask the Founder."
    ],
    "annsetu": [
        "Annsetu is a structured service-based booking platform.",
        "It focuses on workflow automation for service coordination.",
        "It is being developed for clarity, execution speed, and system trust.",
        "Status: Under Development.",
        "For deeper roadmap, ask the Founder."
    ],
    "saarkaar": [
        "Saarkaar Portfolio is an immersive 3D virtual office platform.",
        "It enables digital interaction, guided navigation, and project presentation.",
        "It represents the SAARKAAR.IO virtual office experience.",
        "Visit Live: https://evenza.space",
        "For deeper architecture, ask the Founder."
    ],
    "evenza": [
        "Evenza is an event and marketing platform.",
        "It supports structured event, stall, and service-level updates.",
        "It is designed for organized event operations and digital visibility.",
        "Visit Live: https://evenza.space",
        "For deeper platform strategy, ask the Founder."
    ]
}


TECH_OR_CONCEPT_SUMMARIES = {
    "react": "React is the frontend UI framework used to build modular interactive interfaces in SAARKAAR.",
    "react 19": "React 19 powers SAARKAAR frontend interactions and component-based user experience.",
    "three.js": "Three.js is the 3D rendering engine used to build SAARKAAR's immersive virtual office visuals.",
    "react three fiber": "React Three Fiber connects React with Three.js to manage 3D scenes declaratively.",
    "fastapi": "FastAPI is the backend API framework handling SAARKAAR AI/chat and system endpoints.",
    "python": "Python powers SAARKAAR backend logic and AI integration layers.",
    "mongodb": "MongoDB is planned for SAARKAAR knowledge base and join form data storage.",
    "zustand": "Zustand manages lightweight frontend state for interaction flows in SAARKAAR.",
    "ai chat api": "AI Chat API is the conversation layer that routes user prompts to assistant/founder intelligence.",
    "automation": "Automation in SAARKAAR means reducing manual process work using structured AI workflows.",
    "3d virtual office": "The 3D virtual office is SAARKAAR's immersive portfolio model replacing static website scrolling.",
    "founder ai": "Founder AI is the deep-discussion mode for technical and strategic explanations.",
    "receptionist ai": "Receptionist AI gives concise, structured summaries and guides users through the platform."
}


FEATURE_SUMMARIES = {
    "join us": {
        "definition": "Join Us is a collaboration intake flow for under-development ventures.",
        "used_in": "Used on startup detail pages where projects are not yet live and require contributors.",
        "matters": "It converts portfolio interest into real execution capacity and hiring momentum."
    },
    "application tracking": {
        "definition": "Application tracking is the structured monitoring of candidate or service responses.",
        "used_in": "Used in KORA to manage opportunity applications and hiring progression.",
        "matters": "It reduces chaos and gives measurable control over selection workflows."
    },
    "custom post": {
        "definition": "Custom post creation allows users to define specific demand rather than choosing fixed templates.",
        "used_in": "Used in KORA for jobs, volunteer requests, and service requirements.",
        "matters": "It enables flexible marketplace matching for real local use-cases."
    },
    "time-based booking": {
        "definition": "Time-based booking lets users reserve services by slot and duration.",
        "used_in": "Used in BookMyGadi for day-based and time-duration vehicle reservations.",
        "matters": "It creates predictability and improves schedule efficiency in local mobility."
    }
}


BUSINESS_CONCEPT_SUMMARIES = {
    "marketplace": {
        "definition": "A marketplace is a platform where demand and supply participants interact in a structured environment.",
        "used_in": "KORA operates as a gig marketplace connecting posters and applicants.",
        "matters": "It scales opportunity discovery and execution without centralized manual mediation."
    },
    "subscription": {
        "definition": "Subscription is a recurring access or service model instead of one-time transactions.",
        "used_in": "BookMyThali uses subscription logic for regular regional meal delivery plans.",
        "matters": "It improves retention, predictability, and recurring revenue potential."
    },
    "digital branding": {
        "definition": "Digital branding is the structured online identity and trust presentation of a product or business.",
        "used_in": "Dadi's Secret applies this to transform traditional products into a modern digital retail presence.",
        "matters": "It directly improves visibility, conversion confidence, and long-term brand recall."
    },
    "workflow automation": {
        "definition": "Workflow automation means reducing manual process steps through predictable system logic.",
        "used_in": "Annsetu and KYRON both use workflow-driven execution models.",
        "matters": "It increases reliability, speed, and operational scale readiness."
    }
}


ARCHITECTURE_COMPONENT_SUMMARIES = {
    "frontend": {
        "definition": "Frontend is the user-facing interaction layer.",
        "used_in": "SAARKAAR uses React with 3D libraries to deliver immersive portfolio navigation.",
        "matters": "It defines first impression, usability quality, and interaction trust."
    },
    "backend": {
        "definition": "Backend is the system logic and API execution layer behind interfaces.",
        "used_in": "FastAPI services process chat, project logic, and orchestration requests.",
        "matters": "It ensures stability, data integrity, and scalable service behavior."
    },
    "api": {
        "definition": "API is the communication contract between system components.",
        "used_in": "SAARKAAR AI Chat API connects frontend interaction with model-powered backend responses.",
        "matters": "It enables modular growth and reliable cross-component integration."
    },
    "ai layer": {
        "definition": "AI layer is the reasoning and response intelligence module.",
        "used_in": "SAARKAAR runs dual personality behavior: Receptionist mode and Founder mode.",
        "matters": "It provides adaptive depth while preserving structured conversation quality."
    }
}


def _project_key_from_message(message: str) -> Optional[str]:
    msg = (message or "").lower()
    checks = [
        ("kyron", ["kyron"]),
        ("kora", ["kora"]),
        ("dadi", ["dadi", "dadi's", "dadi secret", "dadi’s", "dadis"]),
        ("bookmygadi", ["bookmygadi", "book my gadi"]),
        ("bookmythali", ["bookmythali", "book my thali"]),
        ("annsetu", ["annsetu", "ann setu"]),
        ("saarkaar", ["saarkaar portfolio", "virtual office", "saarkaar"]),
        ("evenza", ["evenza"]),
    ]
    for key, patterns in checks:
        if any(p in msg for p in patterns):
            return key
    return None


def _detect_portfolio_relations(message: str) -> dict:
    normalized_message = (message or "").lower()
    related_project = _project_key_from_message(normalized_message)

    detected_tech_concepts = []
    for keyword in TECH_OR_CONCEPT_SUMMARIES.keys():
        if keyword in normalized_message:
            detected_tech_concepts.append(keyword)

    detected_features = []
    for keyword in FEATURE_SUMMARIES.keys():
        if keyword in normalized_message:
            detected_features.append(keyword)

    detected_business = []
    for keyword in BUSINESS_CONCEPT_SUMMARIES.keys():
        if keyword in normalized_message:
            detected_business.append(keyword)

    detected_architecture = []
    for keyword in ARCHITECTURE_COMPONENT_SUMMARIES.keys():
        if keyword in normalized_message:
            detected_architecture.append(keyword)

    return {
        "project": related_project,
        "tech_or_concepts": detected_tech_concepts,
        "features": detected_features,
        "business": detected_business,
        "architecture": detected_architecture,
        "has_portfolio_relation": bool(
            related_project or detected_tech_concepts or detected_features or detected_business or detected_architecture
        ),
    }


def _is_small_talk(message: str) -> bool:
    msg = (message or "").lower().strip()
    greetings = [
        "hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening",
        "kaise ho", "kya haal hai", "kya haal", "sab badhiya", "whats up", "what's up",
        "how are you", "who are you", "namaste", "pranam", "sup", "yo"
    ]
    # Check if message starts with greeting or is a greeting
    for g in greetings:
        if msg == g or msg.startswith(g + " ") or msg.endswith(" " + g):
             return True
    return False


def _build_general_then_saarkaar_response(message: str) -> str:
    compact_message = re.sub(r'\s+', ' ', (message or '').strip())
    return _format_structured_lines([
        f"Definition: '{compact_message}' is interpreted as a general concept based on common usage.",
        "How it can be used in SAARKAAR: It can be mapped to project workflows, AI interaction layers, or platform operations.",
        "Why it matters: Clear concept mapping improves decision quality and keeps product communication aligned.",
        "For deeper technical mapping, would you like to speak with the Founder?"
    ])


def _build_structured_explainer(item: dict) -> str:
    return _format_structured_lines([
        f"Definition: {item['definition']}",
        f"How it is used: {item['used_in']}",
        f"Why it matters: {item['matters']}",
        "For deeper technical detail, would you like to speak with the Founder?"
    ])


def _is_deep_query(message: str) -> bool:
    msg = (message or "").lower()
    deep_markers = [
        "explain deeply", "deeply", "deep explanation", "in detail", "detailed",
        "deep dive", "architecture", "technical breakdown", "andar se samjhao", "detail me"
    ]
    return any(marker in msg for marker in deep_markers)


def _is_what_is_query(message: str) -> bool:
    msg = (message or "").lower().strip()
    triggers = ["what is", "what's", "kya hai", "about", "explain"]
    return any(t in msg for t in triggers)


def _format_structured_lines(lines: List[str], min_lines: int = 4, max_lines: int = 8) -> str:
    cleaned = [re.sub(r'\s+', ' ', line).strip() for line in lines if line and line.strip()]
    if not cleaned:
        return ""

    trimmed = cleaned[:max_lines]
    if len(trimmed) < min_lines:
        filler = "For deeper explanation, would you like to speak with the Founder?"
        while len(trimmed) < min_lines:
            trimmed.append(filler)

    return "\n".join(trimmed)


def make_concise_assistant_reply(text: str, max_sentences: int = 6, max_chars: int = 700) -> str:
    content = (text or "").strip()
    if not content:
        return ""

    normalized = re.sub(r'\s+', ' ', content)
    parts = [p.strip() for p in re.split(r'(?<=[.!?।])\s+', normalized) if p.strip()]

    if parts:
        concise = "\n".join(parts[:max_sentences]).strip()
    else:
        concise = normalized

    if len(concise) > max_chars:
        concise = concise[:max_chars].rstrip()
        if ' ' in concise:
            concise = concise.rsplit(' ', 1)[0]
        concise = f"{concise}..."

    return concise

@router.post("/chat")
async def chat_with_assistant(request: ChatRequest):
    """
    Intelligent AI Assistant (Powered by GPT-4o / Fallback Demo Mode)
    
    Replaces the old rule-based logic with a direct call to the centralized AI Service.
    This ensures the Assistant has the same "brain" as the Portfolio AI.
    """
    try:
        logger.info("=== Assistant Chat Request ===")
        
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
        
        logger.info(f"User: {user_message}")
        
        if not user_message:
            # Fallback if no user message found in history
            return {
                "response": "I didn't catch that. Could you say it again?",
                "language": request.language
            }

        photo_keywords = [
            "photo", "pic", "picture", "image", "dp", "profile photo", "profile image",
            "boss photo", "boss pic", "founder photo", "founder pic", "asif photo", "sonu photo",
            "photo bhejo", "pic bhejo", "image send", "send photo"
        ]
        user_low = user_message.lower()
        if any(key in user_low for key in photo_keywords):
            ai_response = "Yeh hai hamare boss Sonu Saarkaar: /profile/sonu-boss.png"
            return {
                "response": ai_response,
                "language": request.language,
                "session_id": request.session_id
            }

        # Send all queries directly to the LLM to leverage the intelligent prompt
        ai_response = await get_ai_response(
            user_message,
            session_id=request.session_id,
            tenant_id=request.tenant_id,
            strategic_context=RECEPTIONIST_SYSTEM_PROMPT
        )

        created_at = datetime.now(timezone.utc)
        try:
            # Wrap the insert call in asyncio.wait_for to prevent 30-second hang if MongoDB is down
            insert_task = chat_logs_collection.insert_one({
                "tenant_id": request.tenant_id,
                "session_id": request.session_id or "web-session-anonymous",
                "current_partner": request.current_partner or "assistant",
                "language": request.language,
                "user_message": user_message,
                "assistant_response": ai_response,
                "created_at": created_at,
                "created_at_ts": created_at.timestamp(),
            })
            await asyncio.wait_for(insert_task, timeout=1.0)
        except Exception as e:
            logger.warning(f"Skipping DB insert due to error/timeout: {e}")
            pass
        
        logger.info(f"AI: {ai_response[:80]}...")
        
        return {
            "response": ai_response,
            "language": request.language,
            "session_id": request.session_id
        }
    
    except Exception as e:
        logger.error(f"ASSISTANT ERROR {type(e).__name__}: {str(e)}")
        
        # Friendly fallback that encourages trying again
        fallback = "I'm connecting to the main server. Please ask again in a moment."
        return {
            "response": fallback,
            "language": request.language
        }
