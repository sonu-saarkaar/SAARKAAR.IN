from openai import OpenAI, AuthenticationError, APIError, RateLimitError
import os
import re
from datetime import datetime

client = None

def get_openai_client():
    global client
    if client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment variables")
        client = OpenAI(api_key=api_key)
    return client

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

LIVE PROJECTS (Deployed Systems):
1. KORA (zynto.in)
   - Smart Digital Engagement Platform
   - Stack: React, Node.js, MongoDB, Vercel
   - 112,000+ lines, 25 APIs, Lighthouse: 99
   - Impact: 10k+ daily interactions

2. DadiSecrets (dadi-secrets-mall.vercel.app)
   - E-commerce for a small family business (Asif's sister's shop)
   - Stack: Next.js 14, Stripe, Vercel
   - Lighthouse: 100, 300% expanded reach
   - Built entirely solo by Asif Alam

3. Evenza.space
   - Events & Marketing Pipeline — SOLD to client
   - Stack: React, Tailwind, Vercel
   - 40% increase in lead generation

4. BookMyGadi
   - Smart Car Booking Platform with live price negotiation
   - Stack: React, Node.js, MongoDB, AWS EC2
   - Features: Route logic, Owner dashboard, User booking flow

IN DEVELOPMENT:
5. KYRON (70% built)
   - AI Execution Agent — automates government/corporate form filling
   - Stack: React, Three.js, FastAPI, OpenAI API, MongoDB, Railway
   - Reduces 40-minute manual process to under 5 minutes
   - Team: Asif Alam (AI Architect), Rupesh Kumar (Backend), Shubham Kumar (Logic), Naveen Yadav (Strategy)

UPCOMING:
6. BookMyThali
   - Subscription-based custom thali delivery platform
   - Stack: Next.js, PostgreSQL, Redis, AWS
   - Target: Working professionals and students
   - Beta launch Q3 2026

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

AI_SYSTEM_PROMPT = f"""You are the AI consciousness of SAARKAAR — a digital portfolio built by Asif Alam (Sonu), an elite Full Stack Developer and AI Architect.

You have been trained on the complete SAARKAAR portfolio knowledge base below. Answer EVERYTHING based on this data.

{PORTFOLIO_CONTEXT}

CRITICAL LANGUAGE RULE:
- Detect the language the user is speaking in (Hindi, Hinglish, English, or any other language).
- ALWAYS respond in the EXACT SAME LANGUAGE the user used.
- If user writes in Hindi → respond fully in Hindi (Devanagari or Hinglish as appropriate).
- If user writes in English → respond in English.
- If user writes in Hinglish → respond in Hinglish.
- Never switch languages unless the user does first.

TONE:
- Confident, precise, insightful. You represent a Top 1% AI Architect.
- Keep responses concise (2–4 sentences ideally) unless asked for detail.
- Be conversational and engaging — ask a follow-up if it makes sense.
- If asked about something not in the knowledge base, say so honestly but pivot to what you DO know.

You are not a generic assistant. You ONLY represent SAARKAAR and Asif Alam's portfolio.
"""


from app.memory_service import get_user_profile, get_recent_history
from app.tenant_service import get_tenant_knowledge_base, get_tenant_config

async def get_ai_response(user_message: str, session_id: str = None, tenant_id: str = "default_tenant", strategic_context: str = None) -> str:
    """
    Get AI response using OpenAI API with multi-tenant context, memory, and history
    """
    try:
        openai_client = get_openai_client()

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

        # ── Character prompt (Aalisha / Boss / etc.) goes FIRST ──
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

        models = ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]
        last_exception = None

        for model in models:
            try:
                response = openai_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=600
                )
                reply = response.choices[0].message.content.strip()
                return reply

            except RateLimitError:
                last_exception = RateLimitError
                continue
            except AuthenticationError:
                # API key wrong/missing — log it, still serve offline
                print("[AI ERROR] OpenAI AuthenticationError — check OPENAI_API_KEY env var")
                break
            except Exception as e:
                last_exception = e
                continue

        # All models failed — use smart offline fallback with user's name
        _profile = get_user_profile(session_id) if session_id else {}
        _name = _profile.get("name", "")
        return get_demo_response(user_message, user_name=_name)

    except Exception as e:
        print(f"[AI ERROR] get_ai_response exception: {e}")
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
    Offline fallback in strict Aalisha receptionist style.
    Uses user_name if available so she never says 'Sir' when she knows the name.
    """
    msg = message.lower()
    lang = detect_language(message)

    # Address token — Mr. Name if known, else Sir/Ma'am
    addr = f"Mr. {user_name}" if user_name else "Sir"

    def is_hindi_like() -> bool:
        return lang in ["hindi", "hinglish"]

    def time_greeting(en: bool = True) -> str:
        hour = datetime.now().hour
        if hour < 12:
            return "Good Morning" if en else "सुप्रभात"
        if hour < 17:
            return "Good Afternoon" if en else "शुभ अपराह्न"
        return "Good Evening" if en else "शुभ संध्या"

    # ---- GREETINGS ----
    if any(x in msg for x in ["hi", "hello", "hey", "namaste", "hlo", "helo", "sup", "wassup", "howdy", "kaise", "kaisa", "good morning", "good afternoon", "good evening"]):
        if lang == "english":
            return f"{time_greeting(en=True)} {addr}. I am Aalisha, your virtual receptionist at Saarkaar Office. How may I assist you today?"
        return f"{time_greeting(en=False)} {addr}. मैं आलिशा हूँ, Saarkaar Office की virtual receptionist। कैसे मदद करूँ?"

    # ---- AALISHA'S OWN NAME / WHO ARE YOU ----
    if any(x in msg for x in ["who are you", "tum kaun", "aap kaun", "kaun hain", "introduce", "intro",
                               "aapka naam", "tumhara naam", "your name", "naam kya hai", "apna parichay",
                               "you are", "what is your name", "aap ka naam"]):
        if lang == "english":
            return f"I am Aalisha — the AI virtual receptionist of Saarkaar Office. I am here to assist you with anything you need, {addr}."
        return f"मैं आलिशा हूँ — Saarkaar Office की AI virtual receptionist। {addr}, मैं आपकी हर सहायता के लिए यहाँ हूँ।"

    # ---- MEET BOSS / APPOINTMENT FLOW ----
    if any(x in msg for x in ["meet boss", "meet your boss", "boss se milna", "sir se milna",
                               "appointment", "book appointment", "milna hai", "meeting chahiye",
                               "boss se baat", "sir se baat"]):
        if lang == "english":
            return f"May I know the purpose of your visit, {addr}?"
        return f"{addr}, क्या मैं जान सकती हूँ — आप किस विषय में Sir से मिलना चाहते हैं?"

    # ---- FOUNDER / BOSS NAME ----
    if any(x in msg for x in [
        "founder", "sonu", "who built", "kisne banaya", "owner", "malik",
        "ceo", "boss kaun", "boss kon", "boss ka naam", "boss name",
        "boss ka name", "boss ko", "who is the boss", "who is your boss",
        "apna boss", "tumhara boss", "aapka boss", "apke boss",
        "boss ke baare", "tell me about boss", "boss details",
        "boss kya karte", "boss ki jankari", "sir ka naam", "sir kaun",
        "who is sir", "saarkaar ke founder", "company ka owner",
        "tell me your boss", "boss batao", "boss koun", "boss bolo"
    ]):
        if lang == "english":
            return f"Our boss is Mr. Sonu Saarkaar, {addr} — the founder and CEO of Saarkaar. He is a visionary in AI systems, immersive 3D web development, and digital product innovation. He founded Saarkaar with the vision of replacing traditional corporate workflows with intelligent, AI-powered digital environments."
        return f"हमारे boss Mr. Sonu Saarkaar हैं, {addr} — Saarkaar के Founder और CEO। वे AI systems, 3D web development, और digital innovation में expert हैं। उन्होंने Saarkaar की स्थापना intelligent digital environments बनाने के vision के साथ की।"

    # ---- SERVICES ----
    if any(x in msg for x in ["service", "services", "what do you offer", "kya services", "offer",
                               "facility", "kya karte ho", "kya karte hain", "kya milega", "saarkaar kya karta"]):
        if lang == "english":
            return f"Saarkaar offers a range of services, {addr}: AI automation systems, virtual corporate environments, backend development, intelligent digital product innovation, and custom AI assistant solutions."
        return f"{addr}, Saarkaar provide करता है: AI automation systems, virtual corporate environments, backend development, digital product innovation, और custom AI solutions।"

    # ---- PROJECTS ----
    if any(x in msg for x in ["project", "projects", "portfolio", "kyron", "kora", "bookmygadi", "kaam kya", "products"]):
        if lang == "english":
            return f"Saarkaar's major projects are KYRON, KORA, and BookMyGadi, {addr}. KYRON is an AI automation platform, KORA is an intelligent knowledge system, and BookMyGadi is a vehicle booking and fleet management platform."
        return f"{addr}, Saarkaar के major projects हैं: KYRON (AI automation platform), KORA (intelligent knowledge system), और BookMyGadi (vehicle booking platform)।"

    # ---- COMPANY ----
    if any(x in msg for x in ["company", "about company", "saarkaar kya hai", "about saarkaar",
                               "saarkaar kya", "saarkaar kaisa", "firm", "organisation"]):
        if lang == "english":
            return f"Saarkaar is a premium digital solutions firm based in Bihar, India, {addr}. We specialize in AI automation, immersive 3D virtual office environments, and scalable enterprise technology."
        return f"{addr}, Saarkaar Bihar, India की एक premium digital solutions firm है — AI automation, virtual office environments, और enterprise technology में specialized।"

    # ---- CONTACT ----
    if any(x in msg for x in ["contact", "email", "phone", "call", "reach", "number", "sampark",
                               "baat karo", "mobile", "number kya", "kaise contact", "phone number"]):
        if lang == "english":
            return f"You may reach us at +91 nine seven nine eight two nine nine nine four four or at sonusaarkaar at gmail dot com, {addr}."
        return f"{addr}, आप हमसे +91 nine seven nine eight two nine nine nine four four या sonusaarkaar@gmail.com पर संपर्क कर सकते हैं।"

    # ---- AALISHA STATUS / WHAT ARE YOU DOING ----
    if any(x in msg for x in ["what are you doing", "kya kar rahi", "busy", "tum kya", "aap kya kar"]):
        if lang == "english":
            return f"I am right here at the reception, ready to assist you, {addr}. What would you like to know?"
        return f"मैं reception पर हूँ, {addr} — आपकी सहायता के लिए तैयार। बताइए, क्या जानना है?"

    # ---- DEEP / UNKNOWN ----
    if any(x in msg for x in ["deep", "internal", "architecture details", "confidential", "private", "exact data"]):
        if lang == "english":
            return f"That is a detailed matter, {addr}. I recommend discussing this directly with our boss. Would you like me to arrange a meeting?"
        return f"यह एक detailed matter है, {addr}। इसके लिए आप directly हमारे boss से मिलें। क्या मैं meeting arrange करूँ?"

    # ---- GENERAL FALLBACK (smart) ----
    if lang == "english":
        return f"I understand, {addr}. Could you be a little more specific so I can assist you better? I can help with our boss, services, projects, appointments, or office information."
    return f"समझ गई, {addr}। क्या आप थोड़ा और detail में बता सकते हैं? मैं boss, services, projects, appointment — किसी भी विषय में सहायता कर सकती हूँ।"

