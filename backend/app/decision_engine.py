from typing import Dict, Any, Tuple
import re

from app.memory_service import (
    get_user_profile, 
    get_past_intents, 
    get_mood, 
    get_journey_stage, 
    update_journey_stage,
    set_meeting_summary,
    get_recent_history
)

def analyze_user_journey(session_id: str, current_intent: str) -> str:
    past_intents = get_past_intents(session_id)
    stage = get_journey_stage(session_id)
    
    # Simple Stage Progression
    if stage == "NEW_VISITOR" and len(past_intents) > 1:
        stage = "EXPLORING"
    
    if stage == "EXPLORING" and current_intent in ["portfolio_query", "service_query"]:
        stage = "INTERESTED"
        
    portfolio_count = sum(1 for i in past_intents if i in ["portfolio_query", "service_query"])
    if stage == "INTERESTED" and portfolio_count >= 3:
        stage = "SERIOUS"
        
    if current_intent == "appointment_booking" and stage in ["INTERESTED", "SERIOUS"]:
        stage = "READY_TO_CONNECT"
        
    update_journey_stage(session_id, stage)
    return stage

def get_autonomous_action(session_id: str, current_intent: str, user_message: str) -> Tuple[str, Dict[str, str]]:
    """
    Decides if the boss should autonomously trigger a UI event
    Returns: (autonomous_action, ui_trigger_payload)
    """
    stage = analyze_user_journey(session_id, current_intent)
    past_intents = get_past_intents(session_id)
    msg_low = user_message.lower()
    
    # 1. Specific Project Queries
    if "kyron" in msg_low:
        return "show_portfolio_panel", {
            "type": "project_card",
            "title": "KYRON – AI Digital Execution Agent",
            "tagline": "The Future of Digital Execution",
            "tech": "React • Python • FastAPI",
            "link": "/portfolio/kyron-ai"
        }
    if "kora" in msg_low or "zynto" in msg_low:
        return "show_portfolio_panel", {
            "type": "project_card",
            "title": "KORA App & Website",
            "tagline": "Empowering Local Businesses Digitally",
            "tech": "React • Node.js • MongoDB",
            "link": "/portfolio/kora-app"
        }
    if "evenza" in msg_low:
        return "show_portfolio_panel", {
            "type": "project_card",
            "title": "Evenza.space",
            "tagline": "Crafting Memorable Experiences",
            "tech": "React • Branding System",
            "link": "/portfolio/evenza-space"
        }
    if "thali" in msg_low or "bookmythali" in msg_low:
        return "show_portfolio_panel", {
            "type": "project_card",
            "title": "BookMyThali",
            "tagline": "Smart FoodTech Platform for Students",
            "tech": "React • Mobile First",
            "link": "/portfolio/bookmythali"
        }
        
    # General Portfolio / Projects Query
    if current_intent == "portfolio_query" or any(word in msg_low for word in ["skills", "work", "projects", "show me", "portfolio"]):
        return "show_portfolio_panel", {
            "type": "projects_list",
            "title": "Our Innovations",
            "projects": [
                {"name": "KYRON AI", "desc": "Digital Execution Agent", "link": "/portfolio/kyron-ai"},
                {"name": "KORA Platform", "desc": "Business Automation App", "link": "/portfolio/kora-app"},
                {"name": "BookMyThali", "desc": "FoodTech Delivery System", "link": "/portfolio/bookmythali"}
            ],
            "main_link": "/portfolio"
        }
        
    # 2. Offer Internship/CV Upload if they ask about jobs
    if any(word in msg_low for word in ["intern", "job", "student", "hiring", "fresher", "join", "cv", "resume"]):
        return "offer_internship", {"panel": "careers", "highlight": "resume_upload", "type": "careers"}

    # 3. Boss Contact / Profile Box
    if any(word in msg_low for word in ["number", "contact", "email", "phone", "profile", "boss ke bare", "about boss", "boss detail"]):
        return "show_contact_card", {
            "type": "profile_card",
            "name": "Sonu Saarkaar",
            "role": "Founder & CEO",
            "bio": "AI Systems Architect & Full-Stack Developer",
            "phone": "+91 9798299944",
            "email": "sonusaarkaar@gmail.com",
            "linkedin": "linkedin.com/in/sonusaarkaar"
        }

    # 4. Services Box
    if current_intent == "service_query" or any(word in msg_low for word in ["service", "facility", "offer"]):
        return "show_services_card", {
            "type": "services_card",
            "services": [
                {"name": "AI Automation", "desc": "Custom agents & pipelines"},
                {"name": "3D Virtual Offices", "desc": "Immersive WebGL experiences"},
                {"name": "Backend Scaling", "desc": "FastAPI, Node, Microservices"},
                {"name": "Product Innovation", "desc": "Idea to Deployment"}
            ]
        }
        
    # 5. Location / Map Box
    if any(word in msg_low for word in ["location", "address", "map", "kahan", "where"]):
        return "show_location_card", {
            "type": "location_card",
            "address": "Bihar, India",
            "map_url": "https://maps.google.com/?q=Bihar,India"
        }

    # 6. Skills & Tech Stack Box
    if any(word in msg_low for word in ["skill", "tech", "technology", "stack", "know", "code"]):
        return "show_skills_card", {
            "type": "skills_card",
            "title": "Technical Expertise",
            "categories": [
                {"name": "Frontend", "items": "React.js, Next.js, Three.js (WebGL)"},
                {"name": "Backend", "items": "Python, FastAPI, Node.js"},
                {"name": "AI / ML", "items": "OpenAI, LLMs, Neural Networks"},
                {"name": "Database", "items": "MongoDB, Postgres, ChromaDB"}
            ]
        }

    # 7. Social Media / Connect Box
    if any(word in msg_low for word in ["social", "instagram", "linkedin", "github", "twitter", "connect", "follow", "youtube"]):
        return "show_social_card", {
            "type": "social_card",
            "title": "Connect with Sonu Saarkaar",
            "links": [
                {"name": "LinkedIn", "url": "https://linkedin.com/in/sonusaarkaar", "icon": "💼"},
                {"name": "GitHub", "url": "https://github.com/sonusaarkaar", "icon": "💻"},
                {"name": "Instagram", "url": "https://instagram.com/sonusaarkaar", "icon": "📸"}
            ]
        }

    # 6. Suggest a drink proactively if they've been here a while and haven't asked for one
    if len(past_intents) == 4 and "drink_request" not in past_intents:
        profile = get_user_profile(session_id)
        if not profile.get("preferred_drink"):
            return "offer_drink", {"panel": "drink_menu", "type": "drink"}
            
    # 7. Project Request Form Box
    if any(word in msg_low for word in ["build", "hire", "develop", "create", "project start", "new project", "request form", "kaam", "website banana", "app banana"]):
        return "show_request_form", {
            "type": "request_form",
            "title": "Start a Project",
            "subtitle": "Tell us what you need built"
        }

    # 8. End meeting
    if current_intent == "exit_office":
        return "end_meeting", {"panel": "exit_fade", "type": "exit"}
        
    return None, None

def generate_meeting_summary(session_id: str) -> dict:
    history = get_recent_history(session_id, limit=20)
    user_msgs = [m["content"] for m in history if m["role"] == "user"]
    
    user_text = " ".join(user_msgs).lower()
    
    summary = "General discussion."
    next_step = "None."
    
    if "intern" in user_text or "job" in user_text or "resume" in user_text:
        summary = "Discussion about career opportunities and internship."
        next_step = "User may send resume/CV."
    elif "portfolio" in user_text or "tech" in user_text or "architecture" in user_text:
        summary = "Technical discussion on SAARKAAR architecture and AI automation."
        next_step = "Follow up with detailed tech stack capabilities if they reach out."
    elif "appointment" in user_text or "meeting" in user_text:
        summary = "User expressed interest in scheduling a follow-up specific meeting."
        next_step = "Monitor calendar for booking."
        
    follow_up = len(user_msgs) > 3
    
    summary_data = {
        "summary": summary,
        "next_step": next_step,
        "follow_up": follow_up
    }
    
    set_meeting_summary(session_id, summary_data)
    return summary_data

def formulate_strategic_context(session_id: str, user_message: str) -> str:
    """Returns extra system prompt context to feed the strategic thinking mode of the AI."""
    profile = get_user_profile(session_id)
    journey_stage = get_journey_stage(session_id)
    msg_low = user_message.lower()
    
    context_lines = [
        f"CURRENT STAGE: {journey_stage}"
    ]
    
    # Persona detection from keywords
    if any(w in msg_low for w in ["api", "database", "backend", "scalability", "architecture", "fastapi", "react", "repo"]):
        context_lines.append("STRATEGY: The user seems technical. Use detailed technical explanations, mention architecture blocks, and be precise.")
    elif any(w in msg_low for w in ["invest", "roi", "product", "market", "scale", "users", "growth"]):
        context_lines.append("STRATEGY: The user sounds like a stakeholder or investor. Focus on product value, scalability, and robust execution.")
    elif any(w in msg_low for w in ["learn", "student", "advice", "career", "start"]):
        context_lines.append("STRATEGY: The user sounds like a student or junior. Be acting as a mentor, offer encouraging advice and focus on learning.")
    else:
        # Default strategic behavior based on journey
        if journey_stage == "INTERESTED":
            context_lines.append("STRATEGY: The user is interested. Gently steer the conversation towards showing our portfolio items.")
        elif journey_stage == "NEW_VISITOR":
            context_lines.append("STRATEGY: The user just arrived. Be welcoming, calm, and establish authority nicely.")
            
    # Check if returning visitor with previous summary
    if len(profile.get("meeting_history", [])) > 0:
        last_meeting = profile["meeting_history"][-1]
        last_summary = last_meeting.get("summary", {}).get("summary", "")
        if last_summary:
            context_lines.append(f"PAST INTERACTION: The user has visited before. Last discussion was about: '{last_summary}'. You can casually mention it if relevant.")
            
    # Check if user is repeatedly casually asking things
    mood = get_mood(session_id)
    if mood.get("patience", 1.0) < 0.8:
        context_lines.append("STRATEGY: Shift to a more professional, slightly firm tone to guide the conversation back to business efficiency.")
        
    return " | ".join(context_lines)
