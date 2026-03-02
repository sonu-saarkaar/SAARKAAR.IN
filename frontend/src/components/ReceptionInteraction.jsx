/*
  ReceptionInteraction.jsx
  Redesigned with Top Speak Icon + Auto-Submit Flow
*/
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../store/experienceStore'
import { useAnimationStore } from '../store/animationStore'
import './ReceptionInteraction.css'

export default function ReceptionInteraction() {
  const navigate = useNavigate()
  const isNearReception = useExperienceStore((state) => state.isNearReception)
  const currentConversationPartner = useExperienceStore((state) => state.currentConversationPartner)
  const setConversationPartner = useExperienceStore((state) => state.setConversationPartner)

  const {
    receptionistState,
    setReceptionistState,
    startReceptionistInteraction,
    endInteraction
  } = useAnimationStore()

  const [inputText, setInputText] = useState('')
  const [response, setResponse] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [detectedLanguage, setDetectedLanguage] = useState('en-US')
  const [suggestedServices, setSuggestedServices] = useState([])
  const [infoPanel, setInfoPanel] = useState(null)
  const [infoPanelPos, setInfoPanelPos] = useState({ x: 30, y: '50%' })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [chatActive, setChatActive] = useState(false) // Chat session control
  const initialHistory = [
    { role: 'system', content: 'You are Aalisha, SAARKAAR receptionist. Keep every reply short (max 1-2 lines), clear, and helpful in user language.' }
  ]

  const silenceTimerRef = useRef(null)
  const infoPanelTimerRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const isListeningRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const pendingUserInputRef = useRef('')
  const autoLoopEnabledRef = useRef(true)
  const chatActiveRef = useRef(false)
  const isNearReceptionRef = useRef(isNearReception)
  const historyRef = useRef(initialHistory)

  const [history, setHistory] = useState(initialHistory)

  // Service mapping
  const serviceMap = {
    'website': { name: '3D Web Development', route: '/portfolio', icon: '🌐' },
    'web development': { name: '3D Web Development', route: '/portfolio', icon: '🌐' },
    '3d': { name: '3D Web Development', route: '/portfolio', icon: '🎨' },
    'ai': { name: 'AI Integration', route: '/portfolio', icon: '🤖' },
    'artificial intelligence': { name: 'AI Integration', route: '/portfolio', icon: '🤖' },
    'csc': { name: 'CSC Digital Services', route: '/portfolio', icon: '🏛️' },
    'government': { name: 'CSC Digital Services', route: '/portfolio', icon: '🏛️' },
    'insurance': { name: 'BI Insurance', route: '/portfolio', icon: '🛡️' },
    'bi': { name: 'BI Insurance', route: '/portfolio', icon: '🛡️' },
    'portfolio': { name: 'View Portfolio', route: '/portfolio', icon: '💼' },
    'project': { name: 'Our Projects', route: '/portfolio', icon: '📁' }
  }

  // Info panel data
  // Info panel data
  const infoPanelData = {
    demos: {
      title: 'Demo Websites',
      icon: '🌐',
      items: [
        { name: 'AI Office Experience', url: 'https://saarkaar.in', type: 'Live Demo', value: 'Live' },
        { name: '3D Portfolio', url: 'https://saarkaar.in/portfolio', type: 'Interactive', value: 'View' },
        { name: 'CSC Platform Demo', url: '#', type: 'Coming Soon', value: 'Soon' }
      ]
    },
    contact: {
      title: 'Contact Information',
      icon: '📞',
      items: [
        { name: 'Business Mobile', value: '+91 9798299944', type: 'Call', url: 'tel:+919798299944' },
        { name: 'Email', value: 'sonusaarkaar@gmail.com', type: 'Email', url: 'mailto:sonusaarkaar@gmail.com' },
        { name: 'Website', value: 'SAARKAAR.IN', type: 'Visit', url: 'https://saarkaar.in' }
      ]
    },
    links: {
      title: 'Quick Links',
      icon: '🔗',
      items: [
        { name: 'Portfolio', url: '/portfolio', type: 'View', value: 'Open' },
        { name: 'GitHub', url: '#', type: 'Code', value: 'Repo' },
        { name: 'LinkedIn', url: '#', type: 'Connect', value: 'Profile' }
      ]
    },
    // New Panels
    services: {
      title: 'Elite Services',
      icon: '💎',
      items: [
        { name: '3D Web Development', value: 'React Three Fiber', type: 'Visuals' },
        { name: 'AI Solutions', value: 'Custom GPT/Agents', type: 'Automation' },
        { name: 'Full-Stack Engineering', value: 'FastAPI + Systems', type: 'Logic' },
        { name: 'CSC & Gov Tech', value: 'Digital Governance', type: 'Impact' }
      ]
    },
    tech: {
      title: 'Tech Ecosystem',
      icon: '⚡',
      items: [
        { name: 'Frontend', value: 'React + Three.js', type: 'UI/UX' },
        { name: 'Backend', value: 'Python FastAPI', type: 'API' },
        { name: 'AI Brain', value: 'OpenAI GPT-4o', type: 'Intel' },
        { name: 'Database', value: 'MongoDB', type: 'Data' }
      ]
    },
    founder: {
      title: 'Founder Profile',
      icon: '👨‍💻',
      items: [
        { name: 'Name', value: 'Asif Aslam (Sonu)', type: 'Founder' },
        { name: 'Role', value: 'Full Stack Architect', type: 'Tech' },
        { name: 'Vision', value: '3D Spatial Web', type: 'Goal' },
        { name: 'Portfolio', url: '/portfolio', type: 'View', value: 'Open' }
      ]
    }
  }

  // Detect triggers from BOTH user message and AI response
  const detectInfoTrigger = (text) => {
    if (!text) return null
    const lower = text.toLowerCase()

    // Services
    if (lower.includes('service') || lower.includes('offer') || lower.includes('provide') || lower.includes('suite')) return 'services'

    // Tech Stack
    if (lower.includes('tech') || lower.includes('stack') || lower.includes('react') || lower.includes('python') || lower.includes('fastapi')) return 'tech'

    // Founder
    if (lower.includes('founder') || lower.includes('ceo') || lower.includes('asif') || lower.includes('sonu') || lower.includes('who built')) return 'founder'

    // Demos
    if (lower.includes('demo') || lower.includes('example') || lower.includes('sample')) return 'demos'

    // Contact
    if (lower.includes('contact') || lower.includes('phone') || lower.includes('number') || lower.includes('email') || lower.includes('reach') || lower.includes('hire')) return 'contact'

    // Links
    if (lower.includes('link') || lower.includes('url') || lower.includes('website')) return 'links'

    return null
  }

  const startInfoPanelTimer = () => {
    if (infoPanelTimerRef.current) clearTimeout(infoPanelTimerRef.current)
    // Extended time for reading
    infoPanelTimerRef.current = setTimeout(() => setInfoPanel(null), 10000)
  }

  const keepInfoPanelVisible = () => {
    if (infoPanelTimerRef.current) clearTimeout(infoPanelTimerRef.current)
    // Timer paused while hovering
  }

  // Drag handlers for info panel
  const handleDragStart = (e) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - (typeof infoPanelPos.x === 'number' ? infoPanelPos.x : 30),
      y: e.clientY - (typeof infoPanelPos.y === 'number' ? infoPanelPos.y : window.innerHeight / 2)
    })
  }

  const handleDragMove = (e) => {
    if (!isDragging) return
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    setInfoPanelPos({ x: newX, y: newY })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 }) // Reset
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      return () => {
        window.removeEventListener('mousemove', handleDragMove)
        window.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging])

  useEffect(() => {
    isListeningRef.current = isListening
  }, [isListening])

  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  useEffect(() => {
    chatActiveRef.current = chatActive
  }, [chatActive])

  useEffect(() => {
    isNearReceptionRef.current = isNearReception
  }, [isNearReception])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Stop error:', e)
      }
    }

    setIsListening(false)
    setLiveTranscript('')
  }, [])

  const startListening = useCallback((langOverride) => {
    if (!recognitionRef.current) return
    if (!isNearReceptionRef.current || !chatActiveRef.current) return
    if (isListeningRef.current || isSpeakingRef.current) return

    try {
      recognitionRef.current.lang = langOverride || detectedLanguage || 'hi-IN'
      recognitionRef.current.start()
      setIsListening(true)
      setReceptionistState('listening')
    } catch (e) {
      console.log('Mic start error:', e)
    }
  }, [detectedLanguage, setReceptionistState])


  const submitMessage = useCallback(async (messageText) => {
    const normalized = (messageText || '').trim()
    if (!normalized) return

    pendingUserInputRef.current = ''
    setInputText('')
    setLiveTranscript('')

    const services = detectServices(normalized)
    setSuggestedServices(services)

    const infoType = detectInfoTrigger(normalized)
    if (infoType) {
      setInfoPanel(infoType)
      startInfoPanelTimer()
    }

    startReceptionistInteraction()
    setReceptionistState('listening')
    setResponse('')

    const newHistory = [...historyRef.current, { role: 'user', content: normalized }]
    setHistory(newHistory)

    try {
      const ENV_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const API_ENDPOINT = ENV_URL.endsWith('/api') ? `${ENV_URL}/chat` : `${ENV_URL}/api/chat`

      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          language: detectedLanguage
        })
      })

      if (!res.ok) throw new Error('API failed')

      const data = await res.json()
      const aiResponseText = (data.response || '').trim()

      setReceptionistState('talking')
      setResponse(aiResponseText)
      setHistory(prev => [...prev, { role: 'assistant', content: aiResponseText }])

      const aiTrigger = detectInfoTrigger(aiResponseText)
      if (aiTrigger) {
        setInfoPanel(aiTrigger)
        startInfoPanelTimer()
      }

      speakResponse(aiResponseText, detectedLanguage)
    } catch (error) {
      console.error('AI Error:', error)
      setReceptionistState('talking')
      setResponse(error.message || 'Connection Error. Please try again.')
      setHistory(prev => [...prev, { role: 'assistant', content: 'Connection Error. Please check your network or server status.' }])
      speakResponse('System Error. Please try again.', detectedLanguage)
    }
  }, [detectedLanguage, setReceptionistState, startReceptionistInteraction])

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        setLiveTranscript(interimTranscript || finalTranscript.trim())

        if (finalTranscript) {
          const mergedText = `${pendingUserInputRef.current} ${finalTranscript}`.trim()
          pendingUserInputRef.current = mergedText
          setInputText(mergedText)
          setLiveTranscript('')

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

          // Auto-submit after short silence
          silenceTimerRef.current = setTimeout(async () => {
            stopListening()
            await submitMessage(pendingUserInputRef.current)
          }, 900)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        setLiveTranscript('')
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setLiveTranscript('')
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      }
    }

    return () => {
      stopListening()
      synthRef.current.cancel()
    }
  }, [stopListening, submitMessage])

  // Cleanup when leaving reception area
  useEffect(() => {
    if (!isNearReception) {
      endInteraction()
      setResponse('')
      setInputText('')
      setIsListening(false)
      setLiveTranscript('')
      setSuggestedServices([])
      setInfoPanel(null)
      setChatActive(false)
      setConversationPartner(null)
      pendingUserInputRef.current = ''
      stopListening()
      synthRef.current.cancel()
    }
  }, [isNearReception, endInteraction, setConversationPartner, stopListening])

  // React to 3D interactable click
  useEffect(() => {
    if (currentConversationPartner === 'receptionist' && !chatActive) {
      startConversation()
    }
  }, [currentConversationPartner])

  const detectServices = (message) => {
    // Disabled - no service suggestions popup
    return []
  }

  const startConversation = () => {
    setChatActive(true)
    autoLoopEnabledRef.current = true
    startReceptionistInteraction()

    // Auto-greet
    setTimeout(() => {
      const greeting = 'Welcome to SAARKAAR Virtual Office. How can I help you today?'
      setResponse(greeting)
      setReceptionistState('talking')
      speakResponse(greeting, 'hi-IN')
    }, 300)
  }


  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported. Please use Chrome or Edge.')
      return
    }

    if (isListening) {
      autoLoopEnabledRef.current = false
      stopListening()
    } else {
      autoLoopEnabledRef.current = true
      const langToUse = 'hi-IN'
      setDetectedLanguage(langToUse)
      startReceptionistInteraction()
      startListening(langToUse)
    }
  }

  const speakResponse = (text, lang) => {
    stopListening()
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.9
    utterance.pitch = 1.1

    utterance.onstart = () => {
      setIsSpeaking(true)
      setReceptionistState('talking')
    }
    utterance.onend = () => {
      setIsSpeaking(false)
      setReceptionistState('idle')

      // Auto-reactivate mic after AI responds
      setTimeout(() => {
        if (autoLoopEnabledRef.current) {
          startListening()
        }
      }, 250)
    }

    synthRef.current.speak(utterance)
  }

  const handleAutoSubmit = async () => {
    if (!inputText.trim()) return
    stopListening()
    await submitMessage(inputText)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return
    pendingUserInputRef.current = inputText
    stopListening()
    await submitMessage(inputText)
  }

  const handleServiceClick = (route) => {
    setSuggestedServices([])
    setResponse('')
    endInteraction()
    navigate(route)
  }

  if (!isNearReception) return null

  return (
    <>
      {/* Info Panel - Moved outside to escape parent transform */}
      {infoPanel && infoPanelData[infoPanel] && (
        <div
          className="info-panel"
          onMouseEnter={keepInfoPanelVisible}
          onMouseLeave={startInfoPanelTimer}
        >
          <div className="info-header">
            <span className="info-icon">{infoPanelData[infoPanel].icon}</span>
            <span className="info-title">{infoPanelData[infoPanel].title}</span>
            <button className="info-close" onClick={() => setInfoPanel(null)}>×</button>
          </div>
          <div className="info-items">
            {infoPanelData[infoPanel].items.map((item, i) => {
              const ItemWrapper = item.url ? 'a' : 'div'
              const itemProps = item.url ? {
                href: item.url,
                target: item.url.startsWith('http') ? '_blank' : '_self',
                rel: 'noopener noreferrer'
              } : {}

              return (
                <ItemWrapper
                  key={i}
                  className="info-item clickable"
                  {...itemProps}
                  onClick={(e) => {
                    keepInfoPanelVisible()
                    if (item.url && item.url.startsWith('/')) {
                      e.preventDefault()
                      navigate(item.url)
                    }
                  }}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div className="info-item-main">
                    <span className="info-item-name">{item.name}</span>
                    <span className="info-item-type">{item.type}</span>
                  </div>
                  {item.value && (
                    <span className="info-item-value">{item.value}</span>
                  )}
                  {item.url && !item.value && (
                    <span className="info-item-link-text">Open →</span>
                  )}
                </ItemWrapper>
              )
            })}
          </div>
        </div>
      )}

      <div className="reception-overlay">
        {/* Service Suggestions */}
        {suggestedServices.length > 0 && (
          <div className="service-suggestions">
            <div className="suggestions-header">
              <span className="suggestions-title">Suggested Services</span>
              <button className="suggestions-close" onClick={() => setSuggestedServices([])}>×</button>
            </div>
            {suggestedServices.map((service, i) => (
              <button
                key={i}
                className="service-card"
                onClick={() => handleServiceClick(service.route)}
              >
                <span className="service-icon">{service.icon}</span>
                <span className="service-name">{service.name}</span>
                <svg className="service-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Compact Dialogue Box - Only shows when chat is active */}
        {chatActive && response && (
          <div className="dialogue-box-compact">
            <div className="avatar-circle-small">
              <img src="https://ui-avatars.com/api/?name=R&background=d4af37&color=000&size=128" alt="Receptionist" />
            </div>

            <div className="content-compact">
              <p className="response-text">
                {response}
                {isSpeaking && <span className="speaking-indicator"> 🔊</span>}
              </p>

              {liveTranscript && (
                <div className="live-subtitle">
                  <span className="subtitle-icon">🎙️</span> {liveTranscript}
                </div>
              )}

              {receptionistState !== 'talking' && (
                <form onSubmit={handleSubmit} className="input-row">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="text-input-inline"
                  />

                  <button
                    type="button"
                    className={`icon-btn mic-btn ${isListening ? 'active' : ''}`}
                    onClick={toggleVoiceInput}
                    title={isListening ? "Stop" : "Speak"}
                  >
                    {isListening ? (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" rx="1" />
                        <rect x="14" y="4" width="4" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    )}
                  </button>

                  <button type="submit" className="icon-btn send-btn" title="Send">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </form>
              )}
            </div>

            <button className="close-btn" onClick={() => {
              autoLoopEnabledRef.current = false
              endInteraction()
              setResponse('')
              setIsListening(false)
              setSuggestedServices([])
              setInfoPanel(null)
              setChatActive(false)
              setConversationPartner(null)
              pendingUserInputRef.current = ''
              stopListening()
              synthRef.current.cancel()
            }}>×</button>
          </div>
        )}
      </div>
    </>
  )
}
