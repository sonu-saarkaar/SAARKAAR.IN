# SAARKAAR Virtual Office - Backend API

Simple FastAPI backend for the virtual office experience. Only includes AI chat functionality.

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- OpenAI API key

### Installation

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Environment Setup

Create a `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
CORS_ORIGINS=http://localhost:5173
```

### Run

```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

## 📡 API Endpoints

### AI Chat

**POST** `/api/ai/chat`

Request:
```json
{
  "message": "Tell me about yourself"
}
```

Response:
```json
{
  "response": "I'm Sonu Sarkar, a full-stack developer..."
}
```

Rate Limit: 10 requests per minute

## 🏗️ Project Structure

```
backend/
├── app/
│   ├── routers/
│   │   └── ai.py          # AI chat endpoint
│   ├── ai_service.py      # OpenAI integration
│   └── models.py          # Pydantic models
├── main.py                # FastAPI app
├── requirements.txt       # Dependencies
└── env.example            # Environment template
```

## 📦 Dependencies

- **FastAPI**: Web framework
- **OpenAI**: AI chat integration
- **Uvicorn**: ASGI server
- **SlowAPI**: Rate limiting
- **Pydantic**: Data validation

## 🔧 Configuration

All configuration is done through environment variables in `.env` file.

## 📄 License

Private - All rights reserved
