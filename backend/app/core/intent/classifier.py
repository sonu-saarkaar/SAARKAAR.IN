import re
from typing import Dict, Any

def classify_intent(text: str) -> str:
    \"\"\"
    STEP 2: Lightweight Intent Classifier
    Uses regex and rule-based fallback for low latency before LLM call.
    In production, this can be upgraded to spaCy or a small sklearn model.
    
    Classes: greeting, basic_question, project_query, technical_query, strategic_query, unknown
    \"\"\"
    text_lower = text.lower().strip()
    
    # 1. Greetings
    greetings = [
        r"^hi\b", r"^hello\b", r"^hey\b", r"^namaste\b", r"how are you", 
        r"kya haal", r"good morning", r"good evening", r"good afternoon"
    ]
    if any(re.search(g, text_lower) for g in greetings):
        return "greeting"

    # 2. Project Query
    projects = ["kora", "zynto", "dadi", "dadis", "bookmygadi", "bookmythali", "annsetu", "evenza", "kyron"]
    if any(proj in text_lower for proj in projects):
        return "project_query"

    # 3. Technical Query
    tech_keywords = ["architecture", "backend", "frontend", "database", "mongodb", "react", "fastapi", "ai agent", "vector", "rag", "code", "system design"]
    if any(tech in text_lower for tech in tech_keywords):
        return "technical_query"

    # 4. Strategic / Business Query
    strat_keywords = ["hiring", "vision", "startup", "revenue", "business model", "invest", "collaboration", "founder", "ceo", "boss"]
    if any(strat in text_lower for strat in strat_keywords):
        return "strategic_query"

    # 5. Basic Question (Definitions, general knowledge)
    basic_keywords = ["what is", "meaning of", "explain", "how do", "define", "kaise"]
    if any(term in text_lower for term in basic_keywords):
        return "basic_question"

    # 6. Unknown / Clarification
    return "unknown"

def process_intent(message: str) -> Dict[str, Any]:
    \"\"\"
    Wrapper function to return structured intent data.
    \"\"\"
    intent = classify_intent(message)
    return {
        "intent": intent,
        "message_length": len(message),
        "is_short": len(message.split()) < 3
    }
