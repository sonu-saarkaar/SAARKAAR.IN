import { useEffect } from 'react'
import { useExperienceStore } from '../store/experienceStore'
import ReceptionInteraction from './ReceptionInteraction'
import OfficeInteraction from './OfficeInteraction'
import MeetingInterface from './MeetingInterface'
import SlidePanel from './SlidePanel'
import './UI.css'

export default function UI() {
  const isNearReception = useExperienceStore((state) => state.isNearReception)
  const isInOffice = useExperienceStore((state) => state.isInOffice)
  const isSitting = useExperienceStore((state) => state.isSitting)
  const isMeetingActive = useExperienceStore((state) => state.isMeetingActive)
  const showSlidePanel = useExperienceStore((state) => state.showSlidePanel)
  const setUserPosition = useExperienceStore((state) => state.setUserPosition)
  const setUserRotation = useExperienceStore((state) => state.setUserRotation)
  const setCameraRotation = useExperienceStore((state) => state.setCameraRotation)

  // Smooth keyboard movement
  useEffect(() => {
    const keys = new Set()
    
    const handleKeyDown = (e) => {
      keys.add(e.key.toLowerCase())
    }
    
    const handleKeyUp = (e) => {
      keys.delete(e.key.toLowerCase())
    }

    const moveLoop = () => {
      if (keys.size === 0) return
      
      // Professional walking speed (not game-like)
      const speed = 0.06
      const currentPos = useExperienceStore.getState().userPosition
      const currentRot = useExperienceStore.getState().userRotation

      if (keys.has('w')) {
        setUserPosition([
          currentPos[0] + Math.sin(currentRot[1]) * speed,
          currentPos[1],
          currentPos[2] + Math.cos(currentRot[1]) * speed
        ])
      }
      if (keys.has('s')) {
        setUserPosition([
          currentPos[0] - Math.sin(currentRot[1]) * speed,
          currentPos[1],
          currentPos[2] - Math.cos(currentRot[1]) * speed
        ])
      }
      if (keys.has('a')) {
        setUserPosition([
          currentPos[0] - Math.cos(currentRot[1]) * speed,
          currentPos[1],
          currentPos[2] + Math.sin(currentRot[1]) * speed
        ])
      }
      if (keys.has('d')) {
        setUserPosition([
          currentPos[0] + Math.cos(currentRot[1]) * speed,
          currentPos[1],
          currentPos[2] - Math.sin(currentRot[1]) * speed
        ])
      }
      if (keys.has('arrowleft')) {
        setUserRotation([currentRot[0], currentRot[1] - 0.04, currentRot[2]])
      }
      if (keys.has('arrowright')) {
        setUserRotation([currentRot[0], currentRot[1] + 0.04, currentRot[2]])
      }
    }

    const interval = setInterval(moveLoop, 16) // ~60fps

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      clearInterval(interval)
    }
  }, [setUserPosition, setUserRotation])

  // Smooth mouse look
  useEffect(() => {
    let isMouseDown = false
    let lastX = 0
    let lastY = 0

    const handleMouseDown = (e) => {
      isMouseDown = true
      lastX = e.clientX
      lastY = e.clientY
    }

    const handleMouseUp = () => {
      isMouseDown = false
    }

    const handleMouseMove = (e) => {
      if (isMouseDown) {
        // Smooth, professional mouse sensitivity
        const sensitivity = 0.002
        const deltaX = (e.clientX - lastX) * sensitivity
        const deltaY = (e.clientY - lastY) * sensitivity
        
        const currentRot = useExperienceStore.getState().userRotation
        const currentCamRot = useExperienceStore.getState().cameraRotation
        
        // Smooth rotation with slight damping
        setUserRotation([currentRot[0], currentRot[1] - deltaX, currentRot[2]])
        setCameraRotation([currentCamRot[0], currentCamRot[1] - deltaX * 0.4, currentCamRot[2]])
        
        lastX = e.clientX
        lastY = e.clientY
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [setUserRotation, setCameraRotation])

  return (
    <div className="ui-container">
      {/* Instructions */}
      {!isInOffice && (
        <div className="instructions">
          <p style={{ color: '#1a252f', fontWeight: '500' }}>SAARKAAR Virtual Office</p>
          <p style={{ fontSize: '0.9em', color: '#4a90e2', marginTop: '4px' }}>Use W/A/S/D to move, Click & Drag to look around</p>
        </div>
      )}

      {/* Reception Interaction */}
      {isNearReception && !isInOffice && (
        <ReceptionInteraction />
      )}

      {/* Office Interactions */}
      {isInOffice && (
        <OfficeInteraction />
      )}

      {/* Meeting Interface */}
      {isMeetingActive && (
        <MeetingInterface />
      )}

      {/* Slide Panel */}
      {showSlidePanel && (
        <SlidePanel />
      )}
    </div>
  )
}
