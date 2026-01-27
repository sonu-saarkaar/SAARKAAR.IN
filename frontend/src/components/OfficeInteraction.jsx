import { useState, useEffect } from 'react'
import { useExperienceStore } from '../store/experienceStore'
import './OfficeInteraction.css'

export default function OfficeInteraction() {
  const [showSeatingPrompt, setShowSeatingPrompt] = useState(false)
  const [showTeaOffer, setShowTeaOffer] = useState(false)
  const isSitting = useExperienceStore((state) => state.isSitting)
  const setSitting = useExperienceStore((state) => state.setSitting)
  const setMeetingActive = useExperienceStore((state) => state.setMeetingActive)
  const setHasMetFounder = useExperienceStore((state) => state.setHasMetFounder)
  const setNearSeating = useExperienceStore((state) => state.setNearSeating)
  const isInOffice = useExperienceStore((state) => state.isInOffice)
  const userPosition = useExperienceStore((state) => state.userPosition)

  useEffect(() => {
    if (!isInOffice) return

    // Check if user is near seating area in boss cabin
    const bossCabinPos = [8, 0, -6]
    const distance = Math.sqrt(
      Math.pow(userPosition[0] - bossCabinPos[0], 2) +
      Math.pow(userPosition[2] - bossCabinPos[2], 2)
    )
    
    const near = distance < 2
    setNearSeating(near)
    
    if (near && !isSitting) {
      setShowSeatingPrompt(true)
    } else {
      setShowSeatingPrompt(false)
    }
  }, [userPosition, isSitting, setNearSeating, isInOffice])

  useEffect(() => {
    if (isSitting) {
      setTimeout(() => {
        setShowTeaOffer(true)
      }, 2000)
    }
  }, [isSitting])

  const handleSit = () => {
    setSitting(true)
    setShowSeatingPrompt(false)
    useExperienceStore.getState().setUserPosition([7, 0.4, -5])
  }

  const handleTeaCoffee = () => {
    setShowTeaOffer(false)
    setTimeout(() => {
      setMeetingActive(true)
      setHasMetFounder(true)
    }, 1500)
  }

  if (!isInOffice) return null

  return (
    <div className="office-interaction">
      {showSeatingPrompt && !isSitting && (
        <div className="interaction-prompt">
          <button className="interaction-button" onClick={handleSit}>
            Sit Here
          </button>
        </div>
      )}

      {showTeaOffer && isSitting && (
        <div className="founder-message">
          <p>"Please have a seat. Tea or coffee?"</p>
          <div className="tea-coffee-options">
            <button onClick={handleTeaCoffee}>Tea</button>
            <button onClick={handleTeaCoffee}>Coffee</button>
          </div>
        </div>
      )}
    </div>
  )
}
