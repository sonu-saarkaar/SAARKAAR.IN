from typing import Dict, Any, List
from app.models import TenantConfig, CharacterConfig

# Mock Database for Tenants (In a real system, this would be MongoDB/PostgreSQL)
tenant_store: Dict[str, dict] = {
    "default_tenant": {
        "tenant_id": "default_tenant",
        "company_name": "SAARKAAR",
        "branding": {
            "logo": "saarkaar_logo.png",
            "primary_color": "#000000"
        },
        "ai_personality_tone": "Confident, precise, insightful.",
        "characters": [
            {
                "name": "Asif Alam",
                "role": "CEO",
                "authority_level": 5,
                "voice_type": "Male",
                "speaking_style": "Strategic, Direct",
                "formality_level": 4,
                "autonomy_level": 5
            }
        ],
        "voice_enabled": True,
        "subscription_plan": "Enterprise",
        # Custom Context for the Tenant (from PDF uploads/brochures)
        "knowledge_base": """
=== SAARKAAR — COMPLETE KNOWLEDGE BASE ===

COMPANY:
Saarkaar is a premium digital solutions firm based in Bihar, India.
Founded by Sonu Saarkaar (full name: Sonu Kumar, known professionally as Sonu Saarkaar).
Saarkaar specializes in AI automation, virtual corporate environments, intelligent 3D web experiences, backend development, and scalable enterprise systems.

WHAT IS SAARKAAR:
SAARKAAR is not a normal portfolio website.
It is a 3D Virtual Office Based Interactive Portfolio Platform.
Users enter a digital office, interact with AI, and explore projects like a real startup headquarters.

HOW SAARKAAR WORKS:
1. User enters a 3D lobby.
2. User interacts with Receptionist AI for short structured summaries.
3. User explores project sections: Live Ventures, Innovation Lab, Under Development, Founder Room.
4. User can switch to Founder AI for deeper technical discussions.
5. Live projects redirect to external links: https://zynto.in, https://bookmygadi.lovable.app, https://evenza.space
6. Under-development projects provide detailed explanation plus Join Us flow.

FACILITIES:
- 3D virtual office experience
- AI receptionist
- Founder AI mode
- Structured project display
- Live redirection and under-development join flow
- Expandable startup headquarters model

TECH STACK (PLATFORM):
Frontend: React 19, Three.js, React Three Fiber, Zustand
Backend: Python, FastAPI, AI Chat API, modular architecture
Database (planned): MongoDB (knowledge base + join storage)
AI: OpenAI integration, dual personality system (Assistant + Founder)

BOSS / FOUNDER:
Name: Sonu Saarkaar
Also referred to as: Sonu, Boss, Sir
Role: Founder and CEO of Saarkaar
Expertise: AI systems, full-stack development, immersive 3D web, automation platforms, and digital product innovation.
Vision: Building AI-powered systems that replace traditional corporate workflows with intelligent, interactive digital environments.
Personality: Strategic, visionary, direct, highly technical, and innovation-driven.

ABOUT AALISHA:
Alisha is the official AI virtual assistant of Saarkaar Virtual Office.
She is intelligent, professional, emotionally aware, and adaptive.
She speaks in a calm, soft, confident female corporate tone.
She is powered by advanced AI and custom language models.
She is NOT a chatbot — she thinks and responds like a real assistant.

PROJECTS:
1. KYRON — AI Digital Execution Agent that automatically fills government and online forms using master database memory. Status: Under Development.
2. KORA (Live: https://zynto.in) — Gig Market Platform where users create custom posts for jobs, volunteer requests, and service requirements. Includes profile, skills, applications, and direct hiring control.
3. Dadi's Secret (Live) — Organic Products Platform for traditional natural products like pickles, ghee, honey, and homemade food products. Supports local producers with digital branding.
4. BookMyGadi (Live: https://bookmygadi.lovable.app) — Local vehicle booking platform for full-day and time-based reservations.
5. BookMyThali (Under Development) — Regional tiffin service with thali customization, subscriptions, and local home cook integration.
6. Annsetu (Under Development) — Service-based food redistribution platform connecting leftover food providers with needy people and enabling contribution loop.
7. Evenza (Live: https://evenza.space) — Event and marketing platform for listings, stall promotion, service updates, and AI-based quotation tool.

SERVICES:
- AI Automation Systems: Building custom AI agents and automation pipelines for businesses.
- Virtual Corporate Environments: Creating immersive 3D virtual offices with AI-powered assistants.
- Backend Development: Scalable APIs, databases, microservices, and cloud deployment.
- Digital Product Innovation: Full lifecycle product development from ideation to deployment.
- AI Chatbots and Assistants: Custom AI assistants, support bots, and intelligent agents.

TECHNOLOGY STACK:
Frontend: React, Three.js, React Three Fiber, Vite
Backend: Python, FastAPI, PostgreSQL, MongoDB
AI/ML: OpenAI GPT models, custom fine-tuning, vector databases
Deployment: Vercel, Railway, cloud platforms

CONTACT:
Phone: +91 nine seven nine eight two nine nine nine four four
Email: sonusaarkaar@gmail.com
Location: Bihar, India

VALUES:
Saarkaar believes in building systems that are intelligent, human-centric, and future-ready.
The company is driven by innovation, precision, and the goal of making advanced technology accessible.

AI BEHAVIOR RULES:
- Be structured, professional, and founder-level.
- If asked "What is SAARKAAR?", explain virtual office portfolio + interactive exploration + AI office interaction.
- If asked technical details, explain architecture, AI layer, 3D rendering system, backend API flow.
- If asked simple question, keep answer short and clear.
- Never hallucinate features outside defined project meanings.
"""
    }
}

def get_tenant_config(tenant_id: str) -> dict:
    """Retrieve the configuration for a specific tenant."""
    # Fallback to default if tenant not found
    return tenant_store.get(tenant_id, tenant_store["default_tenant"])

def update_tenant_config(tenant_id: str, updates: dict):
    """Update tenant configuration (Admin Panel functionality)."""
    if tenant_id not in tenant_store:
        tenant_store[tenant_id] = {
            "tenant_id": tenant_id,
            "company_name": "New Company",
            "branding": {},
            "ai_personality_tone": "Professional",
            "characters": [],
            "voice_enabled": False,
            "subscription_plan": "Basic",
            "knowledge_base": "Default minimal knowledge base."
        }
    
    tenant_store[tenant_id].update(updates)
    return tenant_store[tenant_id]

def get_tenant_knowledge_base(tenant_id: str) -> str:
    """Get the RAG/Vector-DB equivalent knowledge base for the AI system."""
    config = get_tenant_config(tenant_id)
    return config.get("knowledge_base", "")

def get_tenant_analytics(tenant_id: str) -> dict:
    """Mock Analytics Engine."""
    # In a real system, this queries MongoDB aggregations
    return {
        "visitors_today": 42,
        "average_meeting_time": "8 min",
        "most_requested_topic": "AI Automation",
        "internship_inquiries": 12
    }
