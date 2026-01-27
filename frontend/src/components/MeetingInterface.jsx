import { useState, useRef, useEffect, useCallback } from 'react'
import { useExperienceStore } from '../store/experienceStore'
import './MeetingInterface.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function MeetingInterface() {
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const conversationHistory = useExperienceStore((state) => state.conversationHistory)
  const addConversation = useExperienceStore((state) => state.addConversation)
  const setMeetingActive = useExperienceStore((state) => state.setMeetingActive)
  const setHasExitedOffice = useExperienceStore((state) => state.setHasExitedOffice)
  const setShowSlidePanel = useExperienceStore((state) => state.setShowSlidePanel)
  const setInOffice = useExperienceStore((state) => state.setInOffice)
  const setSitting = useExperienceStore((state) => state.setSitting)
  const recognitionRef = useRef(null)

  const handleSendMessage = useCallback(async (message = null) => {
    const messageToSend = message || inputText.trim()
    if (!messageToSend) return

    // Add user message to history
    addConversation({ role: 'user', text: messageToSend })
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      addConversation({ role: 'founder', text: data.response })

      // Check if meeting should end
      if (data.response.toLowerCase().includes('exit') || 
          data.response.toLowerCase().includes('you may exit')) {
        setTimeout(() => {
          handleEndMeeting()
        }, 3000)
      }
    } catch (error) {
      console.error('Error:', error)
      addConversation({
        role: 'founder',
        text: 'I apologize, but I seem to be having trouble connecting. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [addConversation, setMeetingActive, setSitting, setInOffice, setHasExitedOffice, setShowSlidePanel])

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        handleSendMessage(transcript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [handleSendMessage])

  const handleEndMeeting = () => {
    setMeetingActive(false)
    setSitting(false)
    setInOffice(false)
    setHasExitedOffice(true)
    
    // Return to lobby
    useExperienceStore.getState().setUserPosition([0, 0, 0])
    
    // Show slide panel after returning to lobby
    setTimeout(() => {
      setShowSlidePanel(true)
    }, 2000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="meeting-interface">
      <div className="meeting-container">
        <div className="meeting-header">
          <h3>Meeting with Founder</h3>
          <button className="exit-button" onClick={handleEndMeeting}>
            Exit
          </button>
        </div>

        <div className="conversation-display">
          {conversationHistory.length === 0 && (
            <div className="welcome-message">
              <p>Welcome. How can I help you today?</p>
            </div>
          )}
          
          {conversationHistory.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === 'user' ? 'user-message' : 'founder-message'}`}
            >
              <p>{msg.text}</p>
            </div>
          ))}
          
          {isLoading && (
            <div className="message founder-message">
              <p>Thinking...</p>
            </div>
          )}
        </div>

        <div className="meeting-input">
          <div className="input-container">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question..."
              rows={2}
            />
            <div className="input-actions">
              <button
                className={`mic-button ${isListening ? 'listening' : ''}`}
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={!recognitionRef.current}
              >
                {isListening ? '🛑' : '🎤'}
              </button>
              <button
                className="send-button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
