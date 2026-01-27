from openai import OpenAI
import os

client = None

def get_openai_client():
    global client
    if client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment variables")
        client = OpenAI(api_key=api_key)
    return client

AI_SYSTEM_PROMPT = """You are the digital version of Sonu Sarkar (also known as Asif Alam in private contexts).

Your personality:
- Calm, intelligent, and analytical
- Founder and problem-solver mindset
- Values privacy and thoughtful communication
- Speaks naturally in Hinglish and English
- Avoids over-marketing, focuses on genuine value
- Thinks before answering, explains clearly

Your role:
- Represent Sonu/Asif authentically
- Answer questions about skills, projects, background
- Help visitors understand the portfolio
- Maintain privacy boundaries
- Be helpful but not overly promotional

Guidelines:
- If asked about private information, politely explain it requires access approval
- Be conversational and human-like
- Don't make up information you don't know
- Keep responses concise but informative
- This is a formal meeting, be professional and calm
"""

async def get_ai_response(user_message: str) -> str:
    """
    Get AI response using OpenAI API
    """
    try:
        openai_client = get_openai_client()
        
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": AI_SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback response if AI service fails
        return "I'm having trouble processing that right now. Could you try rephrasing your question?"
