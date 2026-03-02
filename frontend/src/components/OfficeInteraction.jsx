/*
  OfficeInteraction.jsx
  Premium Boss Interaction Interface
*/
import React, { useState, useEffect } from 'react'
import { useExperienceStore } from '../store/experienceStore'
import { useAnimationStore } from '../store/animationStore'
import './OfficeInteraction.css'

export default function OfficeInteraction() {
  const userPosition = useExperienceStore((state) => state.userPosition)
  const setCeoDoorOpen = useExperienceStore((state) => state.setCeoDoorOpen)
  const setUserPosition = useExperienceStore((state) => state.setUserPosition)

  const {
    bossState,
    setBossState,
    startReceptionistInteraction, // reusing for generic 'startInteraction' if needed
    setInteraction,
    isInteracting,
    interactionTarget
  } = useAnimationStore()

  const [promptVisible, setPromptVisible] = useState(false)
  const [dialogueStep, setDialogueStep] = useState(0)

  // Check distance to Boss Cabin Gate (Approx x=8 to 9, z=0)
  useEffect(() => {
    // We want the prompt to appear near the gate, before entering
    const gatePos = [8, 0, 0]
    const dist = Math.sqrt(
      Math.pow(userPosition[0] - gatePos[0], 2) +
      Math.pow(userPosition[2] - gatePos[2], 2)
    )

    // Only show if user is near gate and NOT already inside (x > 9.5 is inside)
    if (dist < 3 && userPosition[0] < 9.5) {
      setPromptVisible(true)
    } else {
      setPromptVisible(false)
    }
  }, [userPosition, isInteracting])

  const handleEnterBossCabin = () => {
    // Open the door
    setCeoDoorOpen(true)
    // Small delay to let the door open smoothly, then move player inside
    setTimeout(() => {
      setUserPosition([12, userPosition[1], 0])
    }, 500)
    setPromptVisible(false)
  }

  if (!isInteracting) return null

  return (
    <div className="office-overlay">
      {isInteracting && interactionTarget === 'boss' && (
        <div className="boss-dialogue">
          <h3>CEO</h3>
          <p>
            {dialogueStep === 1 ? "Welcome. I've been expecting you. Let's discuss the project." : "..."}
          </p>
          <button onClick={() => {
            setInteraction(false, null)
            setBossState('typing')
          }}>End Meeting</button>
        </div>
      )}
    </div>
  )
}
