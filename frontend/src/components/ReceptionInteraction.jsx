import { useState } from 'react'
import { useExperienceStore } from '../store/experienceStore'
import './ReceptionInteraction.css'

export default function ReceptionInteraction() {
  const [showConversation, setShowConversation] = useState(false)
  const [conversationStep, setConversationStep] = useState(0)
  const setInOffice = useExperienceStore((state) => state.setInOffice)

  const handleTalk = () => {
    setShowConversation(true)
  }

  const handleIntroduction = () => {
    setConversationStep(1)
  }

  const handleMeetingRequest = () => {
    setConversationStep(2)
    setTimeout(() => {
      setConversationStep(3)
    }, 2000)
  }

  const handleGoToOffice = () => {
    setShowConversation(false)
    // Transition to office scene
    setInOffice(true)
    useExperienceStore.getState().setUserPosition([0, 0, 0])
  }

  const receptionResponses = {
    0: "Welcome to SAARKAAR. How may I help you?",
    1: "This is our corporate headquarters. You're welcome to explore.",
    2: "You can proceed to the office area. The boss cabin is on your right.",
    3: "The office area is straight ahead. Walk through to explore."
  }

  return (
    <div className="reception-interaction">
      {!showConversation ? (
        <div className="interaction-prompt">
          <button className="interaction-button" onClick={handleTalk}>
            Talk to Reception
          </button>
        </div>
      ) : (
        <div className="conversation-box">
          <div className="receptionist-message">
            <p>{receptionResponses[conversationStep]}</p>
          </div>
          
          {conversationStep === 0 && (
            <div className="conversation-options">
              <button onClick={handleIntroduction}>Introduction</button>
              <button onClick={handleMeetingRequest}>I want to meet</button>
            </div>
          )}
          
          {conversationStep === 3 && (
            <div className="conversation-options">
              <button onClick={handleGoToOffice}>Enter Office Area</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
