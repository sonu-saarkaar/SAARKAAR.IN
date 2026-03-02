from typing import Tuple

def determine_active_character(intent: str, user_message: str, current_partner: str) -> Tuple[str, str]:
    """
    Determine the appropriate character and camera focus based on intent/context.
    Returns: (active_character, camera_focus)
    """
    msg_low = user_message.lower()
    
    # Default fallback to current or Receptionist
    character = current_partner if current_partner else "Receptionist"
    
    # Map intents/keywords to characters
    if any(w in msg_low for w in ["intern", "internship", "job", "career", "hr", "human resources", "hiring"]):
        character = "HR"
    elif any(w in msg_low for w in ["document", "file", "assistant", "slides"]):
        character = "Assistant"
    elif any(w in msg_low for w in ["security", "guard", "entry", "pass", "door"]):
        character = "Security"
    elif intent in ["portfolio_query", "service_query", "project_query", "company_query"]:
        # Reception desk should handle first-level company/services/projects guidance.
        # Keep boss only if already in boss conversation context.
        character = "Boss" if str(current_partner).lower() == "boss" else "Receptionist"
    elif intent == "appointment_booking":
        # Usually receptionist handles booking
        if character != "Boss": 
            character = "Receptionist"
    
    # Map characters to their default camera focus
    focus_map = {
        "Receptionist": "reception_desk",
        "Boss": "ceo_desk",
        "HR": "hr_desk",
        "Assistant": "assistant_desk",
        "Security": "entrance"
    }
    
    camera_focus = focus_map.get(character, "lobby")
    
    # Normalize character names
    if character.lower() == "boss":
        character = "Boss"
    
    return character, camera_focus
