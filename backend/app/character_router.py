from typing import Tuple

def determine_active_character(intent: str, user_message: str, current_partner: str) -> Tuple[str, str]:
    """
    Determine the appropriate character and camera focus based on intent/context.
    Strictly honors current_partner.
    """
    # Force strict mapping -> If we are talking to Boss, it's Boss. 
    # If Assistant, Assistant. Ignore intent-based switching for now to ensure separate brains.
    if current_partner and str(current_partner).lower() == "boss":
        character = "Boss"
    else:
        character = "Assistant"
        
    # Map characters to their default camera focus
    focus_map = {
        "Assistant": "reception_desk",
        "Boss": "ceo_desk",
        "HR": "hr_desk",
        "Executive_Assistant": "assistant_desk",
        "Security": "entrance"
    }
    
    camera_focus = focus_map.get(character, "lobby")
    
    return character, camera_focus
