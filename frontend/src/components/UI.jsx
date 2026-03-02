import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../store/experienceStore'
import { useAnimationStore } from '../store/animationStore'
import OfficeInteraction from './OfficeInteraction'
import MeetingInterface from './MeetingInterface'
import SlidePanel from './SlidePanel'
import './UI.css'

export default function UI() {
  const navigate = useNavigate()
  const isNearReception = useExperienceStore((state) => state.isNearReception)
  const isNearOffice = useExperienceStore((state) => state.isNearOffice)
  const isInOffice = useExperienceStore((state) => state.isInOffice)
  const isMeetingActive = useExperienceStore((state) => state.isMeetingActive)
  const setShowSlidePanel = useExperienceStore((state) => state.setShowSlidePanel)
  const setConversationPartner = useExperienceStore((state) => state.setConversationPartner)
  const setSitting = useExperienceStore((state) => state.setSitting)
  const setInOffice = useExperienceStore((state) => state.setInOffice)
  const setInCEOOffice = useExperienceStore((state) => state.setInCEOOffice)
  const setCameraFocus = useExperienceStore((state) => state.setCameraFocus)
  const setReceptionistState = useAnimationStore((state) => state.setReceptionistState)

  const canInteract = useMemo(() => isNearReception || isNearOffice, [isNearReception, isNearOffice])

  // --- MOVEMENT LOGIC (Virtual Joystick Simulation) ---
  const simulateKey = (code, type) => {
    const event = new KeyboardEvent(type, { code: code, bubbles: true })
    window.dispatchEvent(event)
  }
  const handleMoveStart = (code) => simulateKey(code, 'keydown')
  const handleMoveEnd = (code) => simulateKey(code, 'keyup')

  const handleInteract = () => {
    if (isNearReception) {
      setConversationPartner('receptionist')
      setReceptionistState('talking')
    }
  }

  const handleExit = () => {
    setConversationPartner(null)
    setSitting(false)
    setInCEOOffice(false)
    setInOffice(false)
    setCameraFocus('lobby')
    setShowSlidePanel(false)
    navigate('/portfolio')
  }

  return (
    <div className="ui-container">

      {/* --- HUD HEADER --- */}
      <div className="hud-header">
        {!isInOffice && <div className="game-logo">SAARKAAR<span className="version">DEV</span></div>}

        <button
          className="hud-btn menu-btn top-control"
          title="Open Menu"
          onClick={() => setShowSlidePanel(true)}
        >
          <div className="icon-hamburger">
            <span></span><span></span><span></span>
          </div>
        </button>
      </div>

      {/* --- LEFT CONTROL: MOVEMENT (Joystick Style) --- */}
      <div className="joystick-zone">
        <div className="d-pad game-pad">
          <div className="d-row">
            <button className="d-btn up"
              onMouseDown={() => handleMoveStart('KeyW')} onMouseUp={() => handleMoveEnd('KeyW')}
              onTouchStart={() => handleMoveStart('KeyW')} onTouchEnd={() => handleMoveEnd('KeyW')}
            >
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" /></svg>
            </button>
          </div>
          <div className="d-row mid">
            <button className="d-btn left"
              onMouseDown={() => handleMoveStart('KeyA')} onMouseUp={() => handleMoveEnd('KeyA')}
              onTouchStart={() => handleMoveStart('KeyA')} onTouchEnd={() => handleMoveEnd('KeyA')}
            >
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
            </button>
            <div className="stick-center"></div>
            <button className="d-btn right"
              onMouseDown={() => handleMoveStart('KeyD')} onMouseUp={() => handleMoveEnd('KeyD')}
              onTouchStart={() => handleMoveStart('KeyD')} onTouchEnd={() => handleMoveEnd('KeyD')}
            >
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </button>
          </div>
          <div className="d-row">
            <button className="d-btn down"
              onMouseDown={() => handleMoveStart('KeyS')} onMouseUp={() => handleMoveEnd('KeyS')}
              onTouchStart={() => handleMoveStart('KeyS')} onTouchEnd={() => handleMoveEnd('KeyS')}
            >
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
            </button>
          </div>
        </div>
      </div>


      {/* --- RIGHT CONTROL: ACTIONS --- */}
      <div className="action-zone">

        {/* INTERACT (Context Aware) */}
        {canInteract && (
          <button className="action-btn interact-btn main-action" onClick={handleInteract}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 11.24V7.5C9 6.12 10.12 5 11.5 5S14 6.12 14 7.5v3.74c1.21-.81 2-2.18 2-3.74C16 5.01 13.99 3 11.5 3S7 5.01 7 7.5c0 1.56.79 2.93 2 3.74zM18.84 15.87l-4.54-2.26c-.17-.09-.38-.05-.51.09l-1.58 2.06c-.47-.52-1.22-1.33-1.65-1.92l2.36-1.18c.24-.12.35-.41.22-.67-.23-.46-.35-.97-.35-1.49 0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5c0 1.9-1.55 3.45-3.41 3.49l2.42 1.21c.29.15.4.51.25.8l-.71 1.42c-.09.18-.28.29-.48.29-.08 0-.17-.02-.24-.05z" />
            </svg>
          </button>
        )}

        {/* EXIT */}
        <button
          className="action-btn exit-btn"
          title="Exit"
          onClick={handleExit}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
            <path d="M10 16l-4-4 4-4" />
            <path d="M6 12h10" />
          </svg>
          <span className="action-label">EXIT</span>
        </button>
      </div>

      {/* --- OVERLAYS --- */}
      {/* Existing Interaction components still rendered but now we have HUD buttons for them if needed */}
      <OfficeInteraction />
      {isMeetingActive && <MeetingInterface />}

      {/* Using the new SlidePanel trigger above, so just rendering the panel itself */}
      <SlidePanel />

    </div>
  )
}
