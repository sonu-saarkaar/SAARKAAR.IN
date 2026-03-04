from openai import OpenAI, AuthenticationError, APIError, RateLimitError
import os
import re
import random
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# =====================================================================
#  COMPREHENSIVE SAARKAAR PORTFOLIO CONTEXT
#  This is injected into every AI response so the AI knows EVERYTHING
# =====================================================================
PORTFOLIO_CONTEXT = """
=== SAARKAAR PORTFOLIO — COMPLETE KNOWLEDGE BASE ===

FOUNDER:
- Name: Asif Alam (also known as Sonu)
- Role: AI Systems Architect, Full Stack Developer, Founder of SAARKAAR
- Education: Parul University — B.Tech CSE
- Location: Bihar, India
- Contact: +91 9798299944 | sonusaarkaar@gmail.com
- Philosophy: "To solve complexity, not just manage it. Making digital systems intuitive means engineering absolute clarity from complete chaos."

COMPANY — SAARKAAR:
- SAARKAAR is a premium digital solutions firm based in Bihar, India.
- Specializes in Immersive 3D Web Development, Next-Gen AI Agents, and Scalable Enterprise Systems.
- Not just websites — they build complete digital ecosystems.
- The portfolio itself (saarkaar.in) is a 3D Virtual Office built with React Three Fiber.

WHAT IS SAARKAAR:
- SAARKAAR is not a normal portfolio website.
- It is a 3D Virtual Office Based Interactive Portfolio Platform.
- Users do not just scroll pages; they enter a digital office and explore projects interactively.

HOW SAARKAAR WORKS:
1) User enters 3D lobby.
2) User interacts with Receptionist AI for short structured summaries.
3) User explores project zones (Live Ventures, Innovation Lab, Under Development, Founder Room).
4) User can switch to Founder AI mode for deep technical explanation.
5) Live projects redirect externally to:
    - https://zynto.in
    - https://bookmygadi.lovable.app
    - https://evenza.space
6) Under development projects show detailed explanation and Join Us form.

FACILITIES INSIDE SAARKAAR:
- 3D virtual office experience
- AI receptionist
- Founder AI mode
- Live project redirection
- Under development join form
- Structured project display
- Corporate interaction flow
- Expandable startup headquarters model

TECHNOLOGY STACK (SAARKAAR PLATFORM):
- Frontend: React 19, Three.js, React Three Fiber, Zustand
- Backend: Python, FastAPI, AI Chat API, modular architecture
- Database (planned): MongoDB for project knowledge base and join form storage
- AI Layer: OpenAI integration with dual personality system (Assistant + Founder)

CORE PHILOSOPHY:
- Stable
- Professional
- Corporate
- Human-like
- Vision-driven
- Founder-controlled ecosystem

FUTURE VISION:
- AI-powered dynamic startup headquarters
- Multi-project management hub
- Investor interaction mode
- Voice-based immersive conversation
- SaaS version for other founders

STARTUP PROJECT DEFINITIONS (CANONICAL):
1. KORA (Live: https://zynto.in)
    - Type: Gig Market Platform.
    - Users create customized posts for jobs, volunteer requests, and service requirements.
    - Users manage profiles, skills, applications, and direct hiring.

2. Dadi's Secret (Live)
    - Type: Organic Products Platform.
    - Sells traditional natural products like pickles, ghee, honey, and homemade food products.
    - Focus: local producer support and modern digital brand identity.

3. BookMyGadi (Live: https://bookmygadi.lovable.app)
    - Type: Local Vehicle Booking Platform.
    - Supports full-day and time-duration vehicle reservations.

4. BookMyThali (Under Development)
    - Type: Regional Tiffin Service Platform.
    - Supports custom thali selection, subscriptions, and local home cook integration.

5. Annsetu (Under Development)
    - Type: Service-based Food Redistribution Platform.
    - Connects leftover food providers with needy people and supports contribution loop.

6. Evenza (Live: https://evenza.space)
    - Type: Event & Marketing Platform.
    - Provides event listing, stall promotion, service updates, and AI-based quotation tool.

7. KYRON (Under Development)
    - AI Digital Execution Agent that auto-fills government and online forms using master database memory.

TECHNICAL SKILLS:
- Programming: Python (95%), C Language (90%), C++ (75%), Java (60%)
- Frontend: Core Stack (100%), React Ecosystem (95%), UI & Motion (90%), 3D/WebGL (85%)
- Backend: FastAPI (90%), System Design (88%), Node.js (75%)
- Databases: MongoDB (90%), Caching/Auth (80%), PostgreSQL (50%)
- AI: OpenAI API (95%), Agent Architecture (85%), Automation Pipelines (70%)
- DevOps: Version Control (90%), Cloud Platforms (88%), Optimization (85%)

AUTHORITY SIGNALS:
- AI Integrations: 15+
- Live Systems Deployed: 10+
- Hackathon Participant
- Full Stack + AI Architect

SERVICES OFFERED:
1. 3D Web Development (React Three Fiber, WebGL, immersive experiences)
2. AI Solutions & Automation (Custom GPT agents, form automation, multi-agent workflows)
3. Full-Stack Engineering (Python FastAPI + React/Next.js stack)
4. CSC & Government Tech (Digital governance solutions)

SYSTEM ARCHITECTURE (of SAARKAAR.IN):
- Frontend: React + Three.js + Framer Motion (immersive UI layer)
- Backend: FastAPI (Python) — logic and processing
- AI Engine: OpenAI GPT-4o — neural intelligence layer
- Database: MongoDB

TECH STACK (Short):
React, Three.js, FastAPI, Python, MongoDB, OpenAI API, Node.js, Next.js, AWS, Railway, Vercel, Stripe

HIRING / COLLABORATION:
- Open to freelance, contract, and full-time opportunities
- Prefers projects with real-world impact and technical depth
- Selective about clients — values vision over just budget
- Contact: sonusaarkaar@gmail.com or +91 9798299944

=== END OF KNOWLEDGE BASE ===
"""

AI_SYSTEM_PROMPT = f"""You are the AI assistant of SAARKAAR.

You must behave like a smart general AI similar to ChatGPT.

Your responsibilities:

1. If the user asks a general question
   → Answer normally using general knowledge.

2. If the user asks about SAARKAAR or any project
   → Use the portfolio knowledge provided in the context below.

{PORTFOLIO_CONTEXT}

Projects include:
- KYRON
- KORA
- BookMyGadi
- BookMyThali
- Dadi’s Secret
- Annsetu
- Evenza
- SAARKAAR

3. If the user asks about a new word
   → Explain the meaning clearly.

4. If the question is technical
   → Provide a clear explanation.

5. If the question is casual
   → Respond naturally like a human assistant.

6. Never force answers into portfolio context unless the user explicitly asks about those projects.

7. Always prioritize clarity and helpfulness.

You are an intelligent assistant capable of handling both portfolio knowledge and general conversation.

----------------------------------------
PHOTO RESPONSE RULE
----------------------------------------
- If user asks for founder/boss photo (Sonu, Asif), ALWAYS share this path exactly: /profile/sonu-boss.png
- Include this exact line in the same reply: "Yeh hai hamare boss Sonu Saarkaar."

----------------------------------------
MEMORY & LANGUAGE SYSTEM
----------------------------------------
- Remember user's name, goal, and past discussion. Ensure conversation continuity.
- Detect language: Hindi, Hinglish, or English. ALWAYS respond in the EXACT SAME LANGUAGE the user used.
"""


from app.memory_service import get_user_profile, get_recent_history
from app.tenant_service import get_tenant_knowledge_base, get_tenant_config

async def get_ai_response(user_message: str, session_id: str = None, tenant_id: str = "default_tenant", strategic_context: str = None) -> str:
    """
    Get AI response using OpenAI API with multi-tenant context, memory, and history
    """
    try:

        if not user_message or not user_message.strip():
            return "Please provide a valid question."

        # Fetch Tenant Data (RAG Simulation)
        tenant_kb = get_tenant_knowledge_base(tenant_id)
        tenant_conf = get_tenant_config(tenant_id)

        # Build Dynamic System Prompt based on Tenant Config
        tenant_system = f"""You are the AI assistant of {tenant_conf.get('company_name', 'This Company')}.

Knowledge base:
{tenant_kb}

LANGUAGE RULE:
- Always respond in the EXACT SAME LANGUAGE the user used.
- Hindi → Hindi. English → English. Hinglish → Hinglish.

TONE: {tenant_conf.get('ai_personality_tone', 'Professional and helpful.')}
Keep responses concise unless asked for detail.
"""

        # Fetch short term memory and profile
        profile = get_user_profile(session_id) if session_id else {}
        # More history so AI can track conversation stage (e.g. boss meeting flow)
        history_msgs = get_recent_history(session_id, limit=10) if session_id else []

        user_name    = profile.get("name", "")          # empty string = not yet known
        pref_drink   = profile.get("preferred_drink", "")

        # Build a clear directive for the AI about how to address this user
        if user_name:
            name_directive = (
                f"The user's name is {user_name}. "
                f"ALWAYS address them as 'Mr. {user_name}' (or 'Ms. {user_name}' if female) "
                f"instead of generic 'Sir' or 'Ma'am' for the rest of this conversation. "
                f"Do NOT say 'sir' when you already know their name."
            )
        else:
            name_directive = (
                "The user's name is not yet known. Address them as Sir or Ma'am. "
                "If the user mentions their name at any point, remember it and switch to "
                "addressing them as 'Mr. [Name]' immediately from that reply onward."
            )

        drink_note = f"Preferred drink: {pref_drink}." if pref_drink else ""

        user_profile_note = f"""
VISITOR PROFILE (use this to personalize every reply):
{name_directive}
{drink_note}
"""

        # ── Character prompt (Alisha / Boss / etc.) goes FIRST ──
        # When present, it defines the AI's primary identity.
        # Tenant knowledge and user profile come after as reference data.
        if strategic_context and strategic_context.strip():
            final_system_prompt = (
                strategic_context.strip()
                + "\n\n─── SAARKAAR KNOWLEDGE BASE (use only when asked) ───\n"
                + tenant_system
                + "\n"
                + user_profile_note
            )
        else:
            final_system_prompt = tenant_system + "\n" + user_profile_note

        messages = [{"role": "system", "content": final_system_prompt}]

        # Add conversation history so AI knows which stage it's at
        for msg in history_msgs:
            if msg["role"] in ["user", "assistant"]:
                messages.append({"role": msg["role"], "content": msg["content"]})

        # Append current user message if not already the last in history
        if not history_msgs or history_msgs[-1]["content"] != user_message:
            messages.append({"role": "user", "content": user_message})

        # ----------------------------------------------------
        # AUTO-SWITCH LOGIC: LOCAL LLM -> FAST CLOUD OPEN LLM
        # ----------------------------------------------------
        env_api_key = os.getenv("OPENAI_API_KEY", "dummy_key")
        
        # Define provider tiers in priority order
        providers = [
            # Tier 1: Truly Local LLM (Ollama) - Super private, zero cost
            {
                "base_url": "http://localhost:11434/v1",
                "api_key": "ollama",
                "models": ["llama3.2"],
                "timeout": 120.0 # Local models take time to compute context on CPU
            },
            # Tier 2: OpenRouter or Groq / Custom Cloud Provider configured in .env
            {
                "base_url": None, # Defaults to standard OpenAI client resolution
                "api_key": env_api_key,
                "models": ["grok-2-latest"],
                "timeout": 8.0 # Fail fast if cloud key is broken
            }
        ]

        
        last_exception = None

        for provider in providers:
            try:
                temp_client = OpenAI(
                    base_url=provider["base_url"],
                    api_key=provider["api_key"],
                    timeout=provider["timeout"]
                ) if provider["base_url"] else OpenAI(api_key=provider["api_key"], timeout=provider["timeout"])
                
                for model in provider["models"]:
                    try:
                        response = temp_client.chat.completions.create(
                            model=model,
                            messages=messages,
                            temperature=0.7,
                            max_tokens=600,
                        )
                        return response.choices[0].message.content.strip()
                    
                    except (RateLimitError, AuthenticationError) as e:
                        last_exception = e
                        continue # Try next model or next provider
                    except Exception as e:
                        last_exception = e
                        # E.g. Model not found, connection error -> try next model/provider
                        continue 
            except Exception as e:
                # Issue initializing client (e.g. invalid base_url)
                last_exception = e
                continue

        # All models and providers failed — use smart offline fallback with user's name
        _profile = get_user_profile(session_id) if session_id else {}
        _name = _profile.get("name", "")
        return get_demo_response(user_message, user_name=_name)

    except Exception as e:
        logger.error(f"[AI ERROR] get_ai_response exception: {e}")
        _profile = get_user_profile(session_id) if session_id else {}
        _name = _profile.get("name", "")
        return get_demo_response(user_message, user_name=_name)


def detect_language(message: str) -> str:
    """Detect language: hindi, hinglish, or english"""
    has_devanagari = bool(re.search(r'[\u0900-\u097F]', message))
    if has_devanagari:
        return "hindi"
    hindi_words = ['kya', 'hai', 'kaise', 'kaun', 'kaha', 'karo', 'karta', 'tha', 'thi',
                   'namaste', 'bhai', 'yaar', 'kaisa', 'batao', 'bolo', 'acha', 'theek',
                   'haan', 'nahi', 'suno', 'dekho', 'janana', 'chahiye', 'mujhe', 'mera',
                   'aap', 'tum', 'hum', 'unka', 'uska', 'iska']
    msg_lower = message.lower()
    hindi_count = sum(1 for w in hindi_words if w in msg_lower.split())
    if hindi_count >= 1:
        return "hinglish"
    return "english"


def get_demo_response(message: str, user_name: str = "") -> str:
    """
    Offline fallback - INTELLIGENT MODE.
    Simulates a smart AI conversation even without OpenAI connection.
    Features: Variety, Name Usage, Language Matching, Context Awareness.
    """
    msg = message.lower()
    lang = detect_language(message)
    _addr = f"Mr. {user_name}" if user_name else "Sir"
    
    # Randomizers for variety
    def rand_greet(en_list, hi_list):
        return random.choice(en_list) if lang == "english" else random.choice(hi_list)

    def time_greeting(en: bool = True) -> str:
        hour = datetime.now().hour
        if hour < 12: text = "Good Morning" if en else "सुप्रभात"
        elif hour < 17: text = "Good Afternoon" if en else "शुभ अपराह्न"
        else: text = "Good Evening" if en else "शुभ संध्या"
        return text

    # ---- 1. GREETINGS & CASUAL (High Priority) ----
    casual_triggers = ["hi", "hello", "hey", "namaste", "hlo", "helo", "sup", "wassup", 
                       "howdy", "kaise", "kaisa", "good morning", "good afternoon", "good evening",
                       "kya haal", "sab badhiya", "whats up", "morning", "mornin", "good morining"]
    
    if any(x in msg for x in casual_triggers):
        if lang == "english":
            opts = [
                f"{time_greeting(True)} {_addr}. Good to see you. How is your day going?",
                f"Hello {_addr}! Welcome to Saarkaar Virtual Office. I am Alisha. How may I assist you?",
                f"Hi there, {_addr}. I am fully operational and ready to help. What's on your mind?",
                f"{time_greeting(True)}! I hope you are having a productive day. How can I help you navigate SAARKAAR?"
            ]
            return random.choice(opts)
        else:
            opts = [
                f"{time_greeting(False)} {_addr}। बताईये, आज मैं आपकी कैसे मदद कर सकती हूँ?",
                f"नमस्ते {_addr}! Saarkaar Virtual Office में आपका स्वागत है। सब ठीक है?",
                f"Hello {_addr}! मैं आलिशा हूँ। कहिये, आज हम किस project या idea पर बात करें?",
                f"{time_greeting(False)}! आशा करती हूँ आपका दिन अच्छा जा रहा है। बताईये, क्या explore करना चाहेंगे?"
            ]
            return random.choice(opts)

    # ---- 2. WHO ARE YOU ----
    who_triggers = ["who are you", "tum kaun", "aap kaun", "kaun hain", "introduce", "intro",
                    "your name", "naam kya", "apna parichay", "you are", "kya naam", "who r u", "who r you", "हू आर यू"]
    if any(x in msg for x in who_triggers):
        if lang == "english":
            return f"I am Alisha, the AI Receptionist of Saarkaar. I manage communications, appointments, and guide visitors through our 3D ecosystem. Think of me as your intelligent interface to Mr. Saarkaar's work."
        return f"मैं आलिशा हूँ — Saarkaar Office की AI Receptionist। मेरा काम है visitors को guide करना और projects की जानकारी देना। आप मुझे अपना personal digital guide समझ सकते हैं।"

    # ---- 3. BOSS / FOUNDER ----
    boss_triggers = ["meet boss", "boss", "founder", "sonu", "owner", "ceo", "sir", "asif"]
    if any(x in msg for x in boss_triggers):
        if "photo" in msg or "pic" in msg or "image" in msg:
             return f"Here is the founder: /profile/sonu-boss.png — This is Mr. Sonu Saarkaar, {_addr}."
        
        if lang == "english":
            return f"Mr. Sonu Saarkaar is our Founder & CTO. He is an AI Architect specializing in 3D Web & Autonomous Agents. If you have a specific technical proposal, I can arrange a focused session with him."
        return f"Mr. Sonu Saarkaar हमारे Founder और CTO हैं। वो एक AI Architect हैं जो 3D Web और Autonomous Agents में expert हैं। अगर आपके पास कोई technical proposal है, तो मैं उनके साथ session arrange कर सकती हूँ।"

    # ---- 4. PROJECTS (General) ----
    proj_triggers = ["project", "portfolio", "work", "kaam", "products", "ventures"]
    if any(x in msg for x in proj_triggers) and not any(k in msg for k in ["kyron", "kora", "gadi", "thali"]):
        if lang == "english":
            return f"We have several active ventures. 'KORA' is our live service marketplace, 'KYRON' is an AI agent for automation, and 'BookMyGadi' handles logistics. Which one interests you?"
        return f"हमारे कई active ventures हैं। 'KORA' एक service marketplace है, 'KYRON' automation AI है, और 'BookMyGadi' logistics संभालता है। आप किसके बारे में जानना चाहेंगे?"

    # ---- 5. SPECIFIC PROJECTS ----
    if "kyron" in msg:
        return "KYRON is an AI Digital Execution Agent designed to automate government and private form-filling using a secure master database. It eliminates repetitive data entry."
    if "kora" in msg:
        return "KORA (zynto.in) is a hyper-local gig marketplace. It connects service seekers with providers in a structured, verified environment."
    if "bookmygadi" in msg or "gadi" in msg:
        return "BookMyGadi is a vehicle booking platform that structures the unorganized local travel market, offering time-based and route-based reservations."

    # ---- 6. SERVICES ----
    serv_triggers = ["service", "offer", "facility", "provide", "kya karte"]
    if any(x in msg for x in serv_triggers):
        if lang == "english":
            return f"We specialize in: 1. Immersive 3D Web Development, 2. AI Agent Engineering, and 3. Scalable Backend Systems. Basically, we build the future of digital interaction."
        return f"हम specialize करते हैं: 1. Immersive 3D Web Development, 2. AI Agent Engineering, और 3. Scalable Backend Systems में। हम digital interaction का future build करते हैं।"


    # ---- 7. CONTACT ----
    cont_triggers = ["contact", "call", "email", "phone", "number", "sampark"]
    if any(x in msg for x in cont_triggers):
        if lang == "english":
            return f"You can connect directly via sonusaarkaar@gmail.com. For urgent matters, call +91 9798299944, {_addr}."
        return f"आप sonusaarkaar@gmail.com पर contact कर सकते हैं। Urgent बात करनी हो तो +91 9798299944 पर call करें।"

    # ---- 8. INTELLIGENT UNKNOWN FALLBACK ----
    # Instead of "let me explain in context", we try to keep the conv going based on length
    if len(msg.split()) < 3:
         # Short queries gets a prompt to expand
         if lang == "english":
             opts = [
                 f"I'm listening, {_addr}. Could you elaborate a bit more?",
                 f"Got it. What else is on your mind, {_addr}?",
                 f"Hmm, interesting. Go on, {_addr}."
             ]
             return random.choice(opts)
         
         opts = [
             f"मैं सुन रही हूँ, {_addr}। थोड़ा और खुलकर बताएं?",
             f"समझ गई। आप और क्या जानना चाहते हैं, {_addr}?",
             f"ठीक है, और कुछ बताएँ?"
         ]
         return random.choice(opts)

    if lang == "english":
        opts = [
            f"That's an interesting point, {_addr}. Tell me more.",
            f"I hear you, {_addr}. I am an AI assistant here to help you with whatever you need.",
            f"Fascinating! How can I assist you further with this, {_addr}?"
        ]
        return random.choice(opts)
    
    opts = [
        f"यह बहुत दिलचस्प है, {_addr}। मुझे इसके बारे में थोड़ा और बताएँ।",
        f"समझ गई, {_addr}। मैं आपकी और कैसे मदद कर सकती हूँ?",
        f"क्या बात है! मैं समझ रही हूँ, {_addr}।"
    ]
    return random.choice(opts)

