# 📁 SAARKAAR Project Structure

## Complete Directory Tree

```
Saarkaar Portfolio/
│
├── 📁 frontend/                    # React + Vite Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/         # React Components
│   │   │   ├── MeetingInterface.jsx
│   │   │   ├── MeetingInterface.css
│   │   │   ├── OfficeDoor.jsx
│   │   │   ├── OfficeInteraction.jsx
│   │   │   ├── OfficeInteraction.css
│   │   │   ├── ReceptionDesk.jsx
│   │   │   ├── ReceptionInteraction.jsx
│   │   │   ├── ReceptionInteraction.css
│   │   │   ├── SlidePanel.jsx
│   │   │   ├── SlidePanel.css
│   │   │   ├── ThirdPersonCamera.jsx
│   │   │   ├── UI.jsx
│   │   │   ├── UI.css
│   │   │   └── UserAvatar.jsx
│   │   │
│   │   ├── 📁 scenes/              # 3D Scenes
│   │   │   ├── LobbyScene.jsx
│   │   │   └── OfficeScene.jsx
│   │   │
│   │   ├── 📁 store/               # State Management
│   │   │   └── experienceStore.js
│   │   │
│   │   ├── App.jsx                 # Main App Component
│   │   ├── main.jsx                # Entry Point
│   │   └── index.css               # Global Styles
│   │
│   ├── index.html                  # HTML Entry Point
│   ├── vite.config.js              # Vite Configuration
│   ├── package.json                # Frontend Dependencies
│   ├── env.example                  # Environment Variables Template
│   └── README.md                    # Frontend Documentation
│
├── 📁 backend/                     # FastAPI Backend Application
│   ├── 📁 app/
│   │   ├── 📁 routers/              # API Routes
│   │   │   ├── __init__.py
│   │   │   ├── access.py
│   │   │   ├── ai.py               # AI Chat Endpoint
│   │   │   ├── auth.py             # Authentication
│   │   │   ├── contact.py          # Contact Form
│   │   │   └── resume.py           # Resume Generation
│   │   │
│   │   ├── __init__.py
│   │   ├── ai_service.py           # OpenAI Integration
│   │   ├── auth.py                 # Auth Utilities
│   │   ├── database.py             # MongoDB Connection
│   │   ├── models.py               # Pydantic Models
│   │   └── resume_service.py       # Resume Logic
│   │
│   ├── main.py                      # FastAPI App Entry
│   ├── requirements.txt            # Python Dependencies
│   ├── env.example                  # Environment Variables Template
│   ├── Procfile                     # Deployment Config
│   ├── runtime.txt                  # Python Version
│   └── start_network.py            # Network Utilities
│
├── README.md                        # Main Project Documentation
├── PROJECT_STRUCTURE.md            # This File
└── .gitignore                      # Git Ignore Rules
```

## 📂 Folder Purposes

### `frontend/`
All frontend code, assets, and configuration files.
- **Entry**: `frontend/index.html`
- **Build**: `npm run build` → `frontend/dist/`
- **Dev**: `npm run dev` → `http://localhost:5173`

### `backend/`
All backend code, API routes, and server configuration.
- **Entry**: `backend/main.py`
- **Run**: `uvicorn main:app --reload` → `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

## 🔄 Development Workflow

### Starting Both Services

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📝 Key Files

### Frontend
- `frontend/src/App.jsx` - Main React component
- `frontend/src/store/experienceStore.js` - Global state
- `frontend/vite.config.js` - Build configuration

### Backend
- `backend/main.py` - FastAPI application
- `backend/app/routers/ai.py` - AI chat endpoint
- `backend/app/ai_service.py` - OpenAI integration

## 🎯 Quick Navigation

| What you need | Go to |
|--------------|-------|
| Frontend code | `frontend/src/` |
| Backend API | `backend/app/routers/` |
| 3D scenes | `frontend/src/scenes/` |
| Components | `frontend/src/components/` |
| State management | `frontend/src/store/` |
| API models | `backend/app/models.py` |
| Environment setup | `frontend/env.example` & `backend/env.example` |

---

**Last Updated**: Project organization complete ✅
