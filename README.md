# 🏛️ SAARKAAR – Virtual Office Experience

A professional, immersive 3D virtual office experience with AI-powered conversations. This is not a game. This is not a chatbot. This is a **virtual office visit**.

## 📁 Project Structure

```
Saarkaar Portfolio/
├── frontend/              # React + Vite frontend application
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── scenes/       # 3D scenes
│   │   └── store/        # State management
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.js   # Vite configuration
│   └── README.md         # Frontend documentation
│
├── backend/              # FastAPI backend application
│   ├── app/              # Application code
│   │   ├── routers/     # API routes
│   │   ├── models.py    # Data models
│   │   └── ai_service.py # AI integration
│   ├── main.py          # FastAPI app entry
│   ├── requirements.txt # Python dependencies
│   └── README.md        # Backend documentation
│
├── README.md             # This file
└── .gitignore           # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm (for frontend)
- **Python 3.10+** (for backend)
- **OpenAI API key** (for AI conversations)

### Step 1: Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
cp env.example .env
# Edit .env with your OpenAI API key

uvicorn main:app --reload
```

Backend will run at `http://localhost:8000`

### Step 2: Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend URL (default: http://localhost:8000)

npm run dev
```

Frontend will run at `http://localhost:5173`

## 🎯 Core Experience

### The Flow

1. **Lobby** → User enters stable, calm reception area
2. **Reception** → Talk to receptionist, get guided to office
3. **Office** → Enter founder's office, sit down
4. **Meeting** → AI-powered conversation with founder
5. **Exit** → Return to lobby, explore website features

### Design Principles

- **Stable**: No chaos, no confusion
- **Slow**: Calm, deliberate interactions
- **Human**: Natural, guided experience
- **Professional**: Trust-building environment

## 🎮 Controls

- **W/A/S/D**: Move around
- **Mouse Drag**: Look around
- **Click**: Interact with objects

## 🏗️ Technology Stack

### Frontend
- React 19
- Vite
- Three.js
- React Three Fiber
- Zustand

### Backend
- FastAPI
- Python 3.10+
- OpenAI API

## 📝 Features

### Frontend
- ✅ 3D lobby with glass walls
- ✅ User avatar (third-person view)
- ✅ Reception desk with receptionist
- ✅ Office environment
- ✅ Meeting interface (voice + text)
- ✅ Slide panel with website features

### Backend
- ✅ AI conversation service (OpenAI integration)

## 🔧 Environment Variables

### Backend (`backend/.env`)
```env
OPENAI_API_KEY=sk-...
CORS_ORIGINS=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)
- Connect GitHub repository
- Set Python version: 3.10+
- Add environment variables
- Deploy

## 📚 Documentation

- **Frontend**: See `frontend/README.md`
- **Backend**: See `backend/README.md` (if exists)

## 🐛 Troubleshooting

### Backend not connecting
- Check if backend is running: `http://localhost:8000/health`
- Verify CORS settings
- Check `VITE_API_URL` in frontend `.env`

### 3D not rendering
- Check browser console
- Ensure WebGL is supported
- Try Chrome or Firefox

### Speech recognition not working
- Requires HTTPS or localhost
- Check microphone permissions
- Chrome/Edge have best support

## 📄 License

Private - All rights reserved

---

**Built with ❤️ for SAARKAAR**
