import json
import os
import time
from typing import Dict, Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

# Global model state
ML_MODEL = None
IS_TRAINED = False

def train_intent_model():
    global ML_MODEL, IS_TRAINED
    
    start_time = time.time()
    
    try:
        data_path = os.path.join(os.path.dirname(__file__), 'training_data.json')
        if not os.path.exists(data_path):
            print(f"ML Service: Training data not found at {data_path}. Skipping training.")
            return False
            
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if not data:
            print("ML Service: Training data is empty. Skipping training.")
            return False
            
        texts = [item['text'] for item in data]
        labels = [item['intent'] for item in data]
        
        # Create pipeline: TF-IDF -> Logistic Regression
        pipeline = make_pipeline(
            TfidfVectorizer(lowercase=True, stop_words='english', ngram_range=(1, 2)),
            LogisticRegression(max_iter=1000, solver='lbfgs')
        )
        
        print("ML Service: Training model...")
        pipeline.fit(texts, labels)
        
        ML_MODEL = pipeline
        IS_TRAINED = True
        
        elapsed = time.time() - start_time
        print(f"ML Service: Model trained successfully in {elapsed:.3f}s on {len(data)} samples.")
        return True
        
    except Exception as e:
        print(f"ML Service: Error training model: {e}")
        return False

def predict_intent(text: str) -> dict:
    if not IS_TRAINED or ML_MODEL is None:
        return {"intent": "unknown", "confidence": 0.0}
        
    try:
        # Predict class
        prediction = ML_MODEL.predict([text])[0]
        
        # Predict probabilities
        probas = ML_MODEL.predict_proba([text])[0]
        classes = ML_MODEL.classes_
        
        # Get confidence of the predicted class
        class_index = list(classes).index(prediction)
        confidence = probas[class_index]
        
        # Use a threshold (e.g., 0.3) to fallback to 'unknown' if not confident
        if confidence < 0.3:
            prediction = "unknown"
            
        return {
            "intent": str(prediction),
            "confidence": float(confidence)
        }
    except Exception as e:
        print(f"ML Service: Prediction error: {e}")
        return {"intent": "unknown", "confidence": 0.0}

def get_action_for_intent(intent: str, text: str) -> Dict[str, Any]:
    """
    Returns the action payload to be triggered and an optional custom AI response.
    """
    if intent == "drink_request":
        return {
            "action": "show_drink_options",
            "ai_response": "Sure sir, what would you like? Tea or Coffee?"
        }
        
    if intent == "meeting_request":
        return {
            "action": "trigger_appointment"
            # ai_response can be None so it will fallback to normal AI handling if we want
        }
        
    if intent == "appointment_booking":
        return {
            "action": "trigger_appointment"
        }
        
    if intent == "portfolio_query":
        return {
            "action": "highlight_portfolio"
        }
        
    if intent == "service_query":
        return {
            "action": "highlight_services"
        }
        
    if intent == "exit_office":
        return {
            "action": "exit_office"
        }

    # casual_talk or unknown
    return {
        "action": None
    }
