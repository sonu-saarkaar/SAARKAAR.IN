from fastapi import APIRouter, Request, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models import AIChatRequest, AIChatResponse
from app.ai_service import get_ai_response

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

from app.ml_service import predict_intent, get_action_for_intent

import re
from app.memory_service import add_message, get_recent_history, update_intent, get_user_profile, update_user_profile
from datetime import datetime, timezone
from app.database import chat_logs_collection
import asyncio

# Common words that are NOT names (to avoid false matches)
_NOT_NAMES = {
    "a", "the", "here", "there", "ok", "okay", "hello", "hi", "yes", "no",
    "not", "just", "very", "also", "sure", "right", "wrong", "fine",
    "good", "bad", "great", "nice", "sir", "ma", "mam", "boss",
    "aalisha", "alisha", "receptionist", "name", "mera", "change", 
    "update", "please", "saarkaar", "sonu", "hey", "are"
}

def extract_memory_facts(message: str, session_id: str):
    msg_low = message.lower().strip()

    # ── Name extraction (English + Hindi + Devanagari patterns) ──
    name_patterns = [
        # English Explicit Change
        r"(?:change my name to|update my name to|call me)\s+([a-zA-Z]{2,20})",
        # English Intro
        r"(?:my name is|i am|i'm|name's|they call me|this is|myself)\s+([a-zA-Z]{2,20})",
        # Hindi romanized Explicit Change
        r"(?:mera naam बदलकर|mera naam change karke|mera naam ab se)\s+([a-zA-Z]{2,20})\s*(?:rakh do|kar do)?",
        # Hindi romanized
        r"(?:mera naam|mera name|main|mujhe|hamara naam|apna naam)\s+([a-zA-Z]{2,20})\s*(?:hai|hoon|hu|he|hain|kehte|bolte)?",
        r"(?:naam hai|name hai|naam)\s+([a-zA-Z]{2,20})",
        # Devanagari
        r"(?:मेरा नाम|मैं|मुझे|हमारा नाम)\s+([^\s]{2,20})\s*(?:है|हूँ|कहते|बोलते)?",
        r"(?:नाम है|नाम)\s+([^\s]{2,20})",
    ]
    name_found = False
    for pattern in name_patterns:
        name_match = re.search(pattern, msg_low)
        if name_match:
            name = name_match.group(1).strip().title()
            if name.lower() not in _NOT_NAMES and len(name) >= 2:
                update_user_profile(session_id, "name", name)
                name_found = True
            break  # stop after first match

    # Fallback for very short 1-2 word inputs that might just be the name
    if not name_found and len(msg_low.split()) <= 2:
        parts = [p for p in msg_low.split() if p.lower() not in _NOT_NAMES]
        if len(parts) == 1 and len(parts[0]) >= 3:
            # High chance it's just their name
            update_user_profile(session_id, "name", parts[0].title())

    # ── Drink preference ──
    if "tea" in msg_low:
        update_user_profile(session_id, "preferred_drink", "tea")
    elif "coffee" in msg_low:
        update_user_profile(session_id, "preferred_drink", "coffee")

@router.post("/chat", response_model=AIChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, chat_data: AIChatRequest):
    """
    Chat with the AI assistant across Multi-Tenant virtual offices
    """
    try:
        raw_tenant_id = chat_data.tenant_id or "default_tenant"
        raw_session_id = chat_data.session_id or "default_session"
        
        # Isolate sessions by tenant to prevent data leaking
        session_id = f"{raw_tenant_id}::{raw_session_id}"
        
        # Step 0: Save user message & check memory
        add_message(session_id, "user", chat_data.message)
        extract_memory_facts(chat_data.message, session_id)
        
        # Step 1: ML Intent Detection
        prediction = predict_intent(chat_data.message)
        intent = prediction.get("intent", "unknown")
        update_intent(session_id, intent)
        
        # Determine voice character based on intent/context (boss generally talks)
        # Receptionist talks if intent is 'appointment_booking' before entering office 
        # But we'll default to Boss.
        voice_char = "boss"
        voice_tone = "calm"
        if intent in ["appointment_booking"]:
            voice_char = "receptionist"
            voice_tone = "soft"
            
        from app.memory_service import increment_interaction, get_mood, update_mood
        
        # Step 1.5: Update Mood Based on Intent & Interaction
        interaction_count = increment_interaction(session_id)
        mood_updates = {}
        
        msg_low = chat_data.message.lower()
        if any(w in msg_low for w in ["please", "thank you", "thanks"]):
            mood_updates["patience"] = 0.05
            mood_updates["confidence"] = 0.05
        if intent == "casual_talk":
            mood_updates["energy"] = -0.02
        elif intent in ["portfolio_query", "service_query"]:
            mood_updates["confidence"] = 0.1
            mood_updates["energy"] = 0.05
            
        if interaction_count > 10:
            mood_updates["patience"] = -0.05
            
        update_mood(session_id, mood_updates)
        current_mood = get_mood(session_id)
            
        from app.decision_engine import get_autonomous_action, generate_meeting_summary, formulate_strategic_context
        
        from app.character_router import determine_active_character
        from app.character_roles import get_character_prompt_context
        
        # Step 2: Route to character
        current_partner = chat_data.current_partner or "Receptionist"
        active_character, camera_focus = determine_active_character(intent, chat_data.message, current_partner)
        
        # Determine voice config mapping based on dynamic config if we wanted, but fallback for now
        voice_char = "receptionist" if active_character in ["Receptionist", "HR", "Assistant"] else "boss"
        voice_tone = "calm"
        if active_character == "Security": voice_tone = "stern"
        elif active_character == "HR": voice_tone = "friendly"
        
        # Determine autonomous action
        auto_action, ui_trigger = get_autonomous_action(session_id, intent, chat_data.message)
            
        def build_response(text: str, custom_intent: str, custom_action: str):
            add_message(session_id, "assistant", text)

            created_at = datetime.now(timezone.utc)
            try:
                asyncio.create_task(chat_logs_collection.insert_one({
                    "tenant_id": raw_tenant_id,
                    "session_id": session_id,
                    "current_partner": active_character,
                    "language": "auto",
                    "intent": custom_intent,
                    "user_message": chat_data.message,
                    "assistant_response": text,
                    "created_at": created_at,
                    "created_at_ts": created_at.timestamp(),
                }))
            except Exception:
                pass
            
            # Determine Action (Autonomous logic can override or be injected if not explicitly custom)
            final_action = custom_action or auto_action
            
            if final_action == "end_meeting":
                generate_meeting_summary(session_id)
            
            # Decide Character State
            char_state = "SPEAKING"
            if custom_intent == "casual_talk":
                char_state = "WELCOMING"
            elif custom_intent == "drink_request" or final_action == "offer_drink":
                char_state = "OFFERING_DRINK"
            elif final_action in ["exit_office", "end_meeting"]:
                char_state = "CLOSING_MEETING"
            elif custom_intent in ["portfolio_query", "service_query"] or final_action == "show_portfolio_panel":
                char_state = "DISCUSSING"
                
            # Decide Animation (now customized by character)
            char_prefix = active_character.lower()
            anim = f"{char_prefix}_formal_speaking"
            if char_state == "WELCOMING":
                anim = f"{char_prefix}_welcoming"
            elif char_state == "OFFERING_DRINK":
                anim = f"{char_prefix}_offering_drink"
            elif char_state == "CLOSING_MEETING":
                anim = f"{char_prefix}_closing"
            elif char_state == "DISCUSSING" and current_mood["confidence"] > 0.8:
                anim = f"{char_prefix}_confident_discussing"
            
            return AIChatResponse(
                response=text,
                intent=custom_intent,
                action=final_action,
                voice={"character": voice_char, "tone": voice_tone},
                character_state=char_state,
                mood=current_mood,
                animation=anim,
                autonomous_action=auto_action,
                ui_trigger=ui_trigger,
                active_character=active_character,
                camera_focus=camera_focus
            )
        
        # Check user profile for smart response integration
        profile = get_user_profile(session_id)
        user_name = profile.get("name")
        pref_drink = profile.get("preferred_drink")
        
        # Step 3: Extract Action Data
        action_data = get_action_for_intent(intent, chat_data.message)
        action = action_data.get("action")
        custom_response = action_data.get("ai_response")
        
        # Add dynamic personalization to custom responses
        if custom_response and user_name:
            custom_response = custom_response.replace("sir", f"Mr. {user_name}").replace("Sir", f"Mr. {user_name}")
            
        # Step 4: Handle Special Intent Flows (Early Return)
        if intent == "drink_request":
            if pref_drink:
                msg = f"As usual, shall I arrange {pref_drink} for you"
                if user_name:
                    msg += f", Mr. {user_name}?"
                else:
                    msg += " sir?"
                return build_response(msg, intent, action)
            elif custom_response:
                return build_response(custom_response, intent, action)
            else:
                return build_response("Sure, what would you like? Tea or Coffee?", intent, action)

        # ── MEETING / APPOINTMENT: always go to Aalisha AI — never use scripted response ──
        # Aalisha reads conversation history to determine which stage she is at
        # and responds with only ONE stage at a time (purpose → react+appointment → guide)
        elif intent in ["meeting_request", "appointment_booking"]:
            char_prompt = get_character_prompt_context(active_character)
            strat_context = formulate_strategic_context(session_id, chat_data.message)
            response_text = await get_ai_response(
                chat_data.message,
                session_id,
                tenant_id=raw_tenant_id,
                strategic_context=char_prompt + "\n" + strat_context
            )
            return build_response(response_text, intent, "trigger_appointment")

        elif action:
            if custom_response:
                return build_response(custom_response, intent, action)
            else:
                strat_context = formulate_strategic_context(session_id, chat_data.message)
                char_prompt = get_character_prompt_context(active_character)
                response_text = await get_ai_response(chat_data.message, session_id, tenant_id=raw_tenant_id, strategic_context=strat_context + "\n" + char_prompt)
                return build_response(response_text, intent, action)
                
        # Step 5: Fallback to OpenAI — character prompt leads, strategy context follows
        char_prompt = get_character_prompt_context(active_character)
        strat_context = formulate_strategic_context(session_id, chat_data.message)
        response_text = await get_ai_response(
            chat_data.message,
            session_id,
            tenant_id=raw_tenant_id,
            strategic_context=char_prompt + "\n" + strat_context
        )
        return build_response(response_text, intent, None)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

