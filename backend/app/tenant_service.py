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

BOSS / FOUNDER:
Name: Sonu Saarkaar
Also referred to as: Sonu, Boss, Sir
Role: Founder and CEO of Saarkaar
Expertise: AI systems, full-stack development, immersive 3D web, automation platforms, and digital product innovation.
Vision: Building AI-powered systems that replace traditional corporate workflows with intelligent, interactive digital environments.
Personality: Strategic, visionary, direct, highly technical, and innovation-driven.

ABOUT AALISHA:
Aalisha is the official AI virtual receptionist of Saarkaar Virtual Office.
She is intelligent, professional, emotionally aware, and adaptive.
She speaks in a calm, soft, confident female corporate tone.
She is powered by advanced AI and custom language models.
She is NOT a chatbot — she thinks and responds like a real receptionist.

PROJECTS:
1. KYRON — An advanced AI automation platform. Designed to automate complex enterprise workflows using intelligent agents and decision trees.
2. KORA — A next-gen knowledge retrieval and organizational intelligence system. Helps companies retrieve, organize, and act on internal knowledge.
3. BookMyGadi — A real-world vehicle booking and fleet management platform. Focused on solving logistics and transportation challenges in India.

SERVICES:
- AI Automation Systems: Building custom AI agents and automation pipelines for businesses.
- Virtual Corporate Environments: Creating immersive 3D virtual offices with AI-powered assistants.
- Backend Development: Scalable APIs, databases, microservices, and cloud deployment.
- Digital Product Innovation: Full lifecycle product development from ideation to deployment.
- AI Chatbots and Assistants: Custom AI receptionists, support bots, and intelligent agents.

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
