# SAARKAAR - Virtual Office Experience (Frontend)

A professional, immersive 3D virtual office experience built with React, Three.js, and React Three Fiber.

## 🎯 Core Experience

This is not a game. This is not a chatbot. This is a **virtual office visit**.

### Experience Flow

1. **Lobby (Reception Area)**
   - User enters a calm, stable lobby with glass walls and natural lighting
   - User has a visible 3D avatar (third-person view)
   - User can look around using mouse or keyboard controls
   - User can walk to the reception desk

2. **Reception Interaction**
   - User talks to the receptionist
   - Receptionist guides user to the office
   - User must walk to the office manually (no teleportation)

3. **Office Entry**
   - User enters the office through a door
   - Founder is seated and working
   - Professional, calm environment

4. **Meeting**
   - Founder offers tea/coffee
   - User sits down
   - Meeting begins with AI-powered conversation
   - User can speak (voice) or type questions
   - Founder responds professionally

5. **Exit & Panel**
   - After meeting, user exits back to lobby
   - Slide panel appears with website features
   - User can now explore About, Projects, Resume, Contact

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see `../backend/README.md`)

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🎮 Controls

- **W/A/S/D**: Move forward/left/backward/right
- **Mouse Drag**: Look around (camera rotation)
- **Arrow Keys**: Rotate view
- **Click**: Interact with objects (reception, door, etc.)

## 🏗️ Architecture

### Tech Stack

- **React 19**: UI framework
- **Vite**: Build tool and dev server
- **Three.js**: 3D graphics library
- **React Three Fiber**: React renderer for Three.js
- **React Three Drei**: Useful helpers for R3F
- **Zustand**: State management
- **Web Speech API**: Voice input

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── UI.jsx          # Main UI controller
│   │   ├── UserAvatar.jsx  # User 3D avatar
│   │   ├── ReceptionDesk.jsx
│   │   ├── OfficeDoor.jsx
│   │   ├── ReceptionInteraction.jsx
│   │   ├── OfficeInteraction.jsx
│   │   ├── MeetingInterface.jsx
│   │   └── SlidePanel.jsx
│   ├── scenes/             # 3D scenes
│   │   ├── LobbyScene.jsx  # Reception area
│   │   └── OfficeScene.jsx # Founder's office
│   ├── store/              # State management
│   │   └── experienceStore.js
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── index.html              # HTML entry point
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies
```

## 🎨 Design Principles

1. **Stable**: No chaos, no confusion
2. **Slow**: Calm, deliberate interactions
3. **Human**: Natural, guided experience
4. **Professional**: Trust-building environment

## 🔌 API Integration

The frontend communicates with the backend API:

- **AI Chat**: `POST /api/ai/chat`
  - Sends user messages
  - Receives founder AI responses

## 📝 Features

- ✅ 3D lobby with glass walls and natural lighting
- ✅ User avatar with third-person camera
- ✅ Mouse and keyboard controls
- ✅ Reception desk with receptionist
- ✅ Walking mechanics
- ✅ Office environment
- ✅ Founder character
- ✅ Meeting interface with voice/text input
- ✅ AI conversation integration
- ✅ Exit flow
- ✅ Slide panel with website features

## 🐛 Troubleshooting

### Speech Recognition Not Working

- Ensure you're using HTTPS or localhost
- Check browser permissions for microphone
- Some browsers require user interaction before enabling

### 3D Not Rendering

- Check browser console for errors
- Ensure WebGL is supported
- Try updating graphics drivers

### API Connection Issues

- Verify backend is running
- Check `VITE_API_URL` in `.env`
- Check CORS settings in backend

## 📄 License

Private - All rights reserved
