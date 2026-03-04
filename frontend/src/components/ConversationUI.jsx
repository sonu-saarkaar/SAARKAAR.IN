/*
  ConversationUI.jsx — Phone-call feeling, ChatGPT-smooth flow
  ─────────────────────────────────────────────────────────────
  Layout:
    ┌─────────────── upper-right ──────────────────┐
    │  💁 Assistant Reply  ● Speaking     [×]   │
    │  Welcome to SAARKAAR...                       │
    └──────────────────────────────────────────────┘

                    ┌── center top of input ──┐
                    │  ● Assistant Speak   │   ← status pill
                    └─────────────────────────┘

    ┌────────────── bottom center ─────────────────┐
    │  🎤  [You speaking in real-time…]      [ ▶ ] │
    └──────────────────────────────────────────────┘

  Auto-flow (call feeling):
    open → welcome → speak → auto-listen → user speaks →
    auto-send on silence → "Creating Answer" → reply →
    "Assistant Speak" → TTS → auto-listen again → …
*/

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../store/experienceStore'
import { useAnimationStore } from '../store/animationStore'
import { useVoiceInput } from '../hooks/useVoiceInput'
import './ConversationUI.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Typing-dot indicator
function TypingDots() {
  return <span className="tdots"><span /><span /><span /></span>
}

// Letter-by-letter text reveal
function TypeWriter({ text, speed = 24, onDone }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    setShown('')
    if (!text) return
    let i = 0
    const iv = setInterval(() => {
      i++
      setShown(text.slice(0, i))
      if (i >= text.length) { clearInterval(iv); onDone?.() }
    }, speed)
    return () => clearInterval(iv)
  }, [text])
  return <span>{shown}</span>
}

function RequestFormWidget({ title, subtitle, onSubmitSuccess, onCancel }) {
  const [formData, setFormData] = useState({ name: '', email: '', requirement: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      onSubmitSuccess(formData)
    }, 1500)
  }

  if (submitted) {
    return (
      <div className="cui-form-card" style={{ textAlign: 'center', padding: '20px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.25)' }}>
        <h4 className="cui-widget-title" style={{ color: '#4ade80' }}>Success</h4>
        <p className="cui-widget-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>Your request has been sent to our desk.</p>
      </div>
    )
  }

  return (
    <div className="cui-form-card" style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(0, 198, 255, 0.25)' }}>
      <div className="cui-project-header" style={{ marginBottom: '12px' }}>
        <h4 className="cui-widget-title" style={{ color: '#00c6ff', fontSize: '1.05rem', margin: '0 0 4px 0' }}>{title || "Project Request"}</h4>
        <h5 className="cui-widget-subtitle" style={{ color: '#d4af37', fontSize: '0.85rem', margin: '0 0 8px 0' }}>{subtitle || "Tell us what you need built"}</h5>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', color: '#fff', outline: 'none', borderRadius: '6px', fontSize: '0.85rem' }}
          placeholder="Name"
          required
          value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', color: '#fff', outline: 'none', borderRadius: '6px', fontSize: '0.85rem' }}
          placeholder="Email"
          type="email" required
          value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
        />
        <textarea
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', color: '#fff', outline: 'none', borderRadius: '6px', fontSize: '0.85rem', minHeight: '60px', resize: 'vertical' }}
          placeholder="What are we building?"
          required
          value={formData.requirement} onChange={e => setFormData({ ...formData, requirement: e.target.value })}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
          <button type="submit" className="cui-btn-action" style={{ background: 'rgba(0, 198, 255, 0.15)', color: '#00c6ff', borderColor: 'rgba(0, 198, 255, 0.4)' }}>Submit</button>
          <button type="button" className="cui-btn-action" onClick={onCancel} style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────
export default function ConversationUI() {
  const navigate = useNavigate()
  const partner = useExperienceStore(s => s.currentConversationPartner)
  const setPartner = useExperienceStore(s => s.setConversationPartner)
  const sessionId = useExperienceStore(s => s.sessionId)
  // ⚠️ userPosition intentionally NOT subscribed via React state
  // to prevent 10fps re-renders → white flicker. Instead use a ref.
  const userPositionRef = useRef([0, 0, 0])
  const setAssistantState = useAnimationStore(s => s.setAssistantState)
  const setBossState = useAnimationStore(s => s.setBossState)
  const assistantState = useAnimationStore(s => s.assistantState)

  const isOpen = Boolean(partner)

  // ── Chat state ──
  const [replyText, setReplyText] = useState('')   // current AI reply being shown
  const [uiTrigger, setUiTrigger] = useState(null)
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [autoListening, setAutoListening] = useState(false)

  // Status string (1–3 words)
  const [statusLabel, setStatusLabel] = useState('Ready')
  const [statusClass, setStatusClass] = useState('ready')

  const sendLockRef = useRef(false)
  const silenceTimer = useRef(null)
  const afterSpeakTimer = useRef(null)
  const voicesRef = useRef([])     // pre-loaded voices (fixes Chrome async bug)
  const hasGreetedRef = useRef(false)  // ensures greeting fires only ONCE per open-session
  const autoListenRef = useRef(false)  // prevents double auto-listen trigger
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

  // Subscribe to userPosition WITHOUT causing re-renders (Zustand v5 syntax)
  useEffect(() => {
    const unsub = useExperienceStore.subscribe(
      (state) => { userPositionRef.current = state.userPosition }
    )
    return unsub
  }, [])

  // ── Pre-load voices ──
  useEffect(() => {
    if (!synth) return
    const load = () => { voicesRef.current = synth.getVoices() }
    load()                              // attempt immediately (works on Firefox/Safari)
    synth.onvoiceschanged = load       // fires on Chrome when voices are ready
    return () => { synth.onvoiceschanged = null }
  }, [])

  // ── Helpers to update status ──
  const setStatus = (label, cls) => { setStatusLabel(label); setStatusClass(cls) }

  const normalizePartner = (value) => {
    const key = String(value || '').toLowerCase().trim()
    if (!key) return 'assistant'
    if (key === 'boss') return 'boss'
    if (key.includes('assistant') || key.includes('receptionist') || key.includes('alisa') || key.includes('alisha')) {
      return 'assistant'
    }
    return key
  }

  // ── Voice Input ──
  const { isListening, transcript, startListening, stopListening } = useVoiceInput(
    useCallback((finalText) => {
      // speech ended naturally → auto-send
      if (finalText?.trim() && !sendLockRef.current) {
        triggerSend(finalText)
      }
    }, []),
    useCallback(() => {
      // speech started → cancel any playing TTS
      synth?.cancel()
      setIsSpeaking(false)
      setAssistantState('idle')
      if (typeof setBossState === 'function') setBossState('idle')
    }, [])
  )

  // Live transcript → input box
  useEffect(() => {
    if (isListening) {
      setInputVal(transcript || '')
      if (transcript) setStatus('You Speaking…', 'listening')
      else setStatus('Listening…', 'listening')
    }
  }, [transcript, isListening])

  // ─ Auto-close when player walks away ─
  useEffect(() => {
    if (!isOpen || partner !== 'assistant') return
    // Poll position via interval — NO React subscription (prevents re-renders)
    const iv = setInterval(() => {
      const pos = userPositionRef.current
      const dx = pos[0]
      const dz = pos[2] - (-10.65)
      if (Math.sqrt(dx * dx + dz * dz) > 5.2) handleClose()
    }, 500)
    return () => clearInterval(iv)
  }, [isOpen, partner])

  // ─ Open → ONE-TIME greeting per session (continuous call mode) ─
  // hasGreetedRef ensures we never re-greet even if isOpen toggles on re-renders
  useEffect(() => {
    if (!isOpen) {
      // Conversation ended / closed — reset everything including the greeted flag
      hasGreetedRef.current = false
      autoListenRef.current = false
      resetAll()
      return
    }

    // Already greeted in this session — do NOT greet again
    if (hasGreetedRef.current) return
    hasGreetedRef.current = true

    const hr = new Date().getHours()
    const timeGreet = hr < 12 ? 'Good Morning,'
      : hr < 17 ? 'Good Afternoon,'
        : 'Good Evening,'

    let greet
    if (partner === 'boss') {
      greet = `${timeGreet} Please have a seat. How can I help you today?`
    } else {
      greet = `${timeGreet} Welcome to Saarkaar Virtual Office. I am Alisa, your virtual assistant. How may I assist you today?`
    }
    setReplyText(greet)
    setStatus(partner === 'boss' ? 'Boss Speaking' : 'Assistant Speaking', 'speaking')
    if (partner === 'assistant') setAssistantState('talking')
    else if (typeof setBossState === 'function') setBossState('talking')
    speakTTS(greet, partner || 'assistant', () => {
      setStatus('Waiting for you…', 'ready')
      if (partner === 'assistant') setAssistantState('idle')
      else if (typeof setBossState === 'function') setBossState('idle')
      scheduleAutoListen()
    })
  }, [isOpen])

  // ─ Cleanup on unmount ─
  useEffect(() => () => {
    synth?.cancel()
    clearTimers()
  }, [])

  // ─────────────────────────────────────────────────
  const clearTimers = () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current)
    if (afterSpeakTimer.current) clearTimeout(afterSpeakTimer.current)
  }

  const resetAll = () => {
    clearTimers()
    synth?.cancel()
    setReplyText('')
    setInputVal('')
    setIsThinking(false)
    setIsSpeaking(false)
    setStatus('Ready', 'ready')
    sendLockRef.current = false
    autoListenRef.current = false
    setAutoListening(false)
  }

  // Continuous call mode — after Alisha speaks, wait naturally for user's next input
  // Guard with autoListenRef so only ONE auto-listen fires at a time
  const scheduleAutoListen = () => {
    if (autoListenRef.current) return   // already scheduled / running
    autoListenRef.current = true
    afterSpeakTimer.current = setTimeout(() => {
      if (!sendLockRef.current) {
        setAutoListening(true)
        startListening()
        setStatus('Waiting for you…', 'listening')
      }
      autoListenRef.current = false
    }, 500)   // 500ms natural pause before mic activates
  }

  // ─── Premium TTS Voice Engine ───────────────────────────────
  // Alisha: calm · soft · confident · corporate female
  // Context-aware pitch/rate + sentence-by-sentence natural pauses
  const speakTTS = (text, pName, onDone) => {
    if (!synth || !text) { onDone?.(); return }
    synth.cancel()

    // Always use pre-loaded voices — avoids Chrome's empty-array-on-first-call bug
    const voices = voicesRef.current.length ? voicesRef.current : synth.getVoices()

    // ── Boss voice (unchanged, deep & calm) ──
    if (pName !== 'assistant') {
      const ut = new SpeechSynthesisUtterance(text)
      const bossVoice =
        voices.find(v => v.name === 'Google UK English Male') ||
        voices.find(v => v.name === 'Daniel') ||
        voices.find(v => v.name.toLowerCase().includes('male') && v.lang.startsWith('en'))
      if (bossVoice) ut.voice = bossVoice
      ut.pitch = 0.82; ut.rate = 0.87; ut.volume = 1.0
      ut.onstart = () => setIsSpeaking(true)
      ut.onend = () => { setIsSpeaking(false); onDone?.() }
      ut.onerror = () => { setIsSpeaking(false); onDone?.() }
      synth.speak(ut)
      return
    }

    // ── Alisha — best available female voice (priority order) ──
    const isHindiOrHinglish = /[\u0900-\u097F]/.test(text) || /\b(hai|hain|kya|kaisa|main|hum|tum|aap|ji|bolo|batao|suno|dekho|karo|nahi|haan)\b/i.test(text)
    
    // Phonetic replacement for Hinglish words so English voice pronounces correctly (if Hindi voice unavailable)
    let speakableText = text
    if (!/[\u0900-\u097F]/.test(text)) { // only if NOT Devanagari script
       speakableText = speakableText
         .replace(/saarkaar/gi, 'Sarkaar')
         .replace(/\bkya\b/gi, 'kya') 
         .replace(/\bhai\b/gi, 'hay')
         .replace(/\bhain\b/gi, 'hain')
         .replace(/\bmain\b/gi, 'meh')
         .replace(/\bkaise\b/gi, 'kai-say')
         .replace(/\bji\b/gi, 'jee')
         .replace(/\bnah(i|in)\b/gi, 'nahin')
         .replace(/\bhaan\b/gi, 'haan')
         .replace(/\bshukriya\b/gi, 'shuk-ree-ya')
    }

    const femaleVoice =
      (isHindiOrHinglish && voices.find(v => v.lang.startsWith('hi'))) ||
      voices.find(v => v.name === 'Google UK English Female') ||
      voices.find(v => v.name === 'Microsoft Aria Online (Natural) - English (United States)') ||
      voices.find(v => v.name === 'Samantha') ||
      voices.find(v => v.name === 'Karen') ||
      voices.find(v => v.name === 'Veena') ||
      voices.find(v => v.name === 'Microsoft Zira - English (United States)') ||
      voices.find(v => v.name.toLowerCase().includes('female') && v.lang.startsWith('en')) ||
      voices.find(v => v.lang.startsWith('en-GB')) ||
      voices.find(v => v.lang.startsWith('en-IN')) ||
      voices.find(v => v.lang.startsWith('en'))

    // ── Context detection → voice mood per reply ──
    const t = text.toLowerCase()
    const isGreeting = /good (morning|afternoon|evening)|welcome|namaste|shukriya/.test(t)
    const isCongrats = /wonderful|certainly|great|pleased|happy|proceed|welcome back/.test(t)
    const isSerious = /appointment|purpose|discuss|matter|meeting|inform|required|schedule/.test(t)

    let pitch, rate
    if (isGreeting) {
      // Warm, gentle — slightly slower for that reception-desk feel
      pitch = 1.14; rate = 0.86
    } else if (isCongrats) {
      // Mild enthusiasm — a touch more energy, still composed
      pitch = 1.18; rate = 0.92
    } else if (isSerious) {
      // Composed, steady — no extra warmth, purely professional
      pitch = 1.06; rate = 0.88
    } else {
      // Default: soft professional
      pitch = 1.10; rate = 0.90
    }

    // ── Split into sentences for natural inter-sentence pauses ──
    // Matches: sentence ending with . ! ? including those followed by space
    const sentences = text.match(/[^.!?…]+[.!?…]+(?:\s|$)/g)
      || text.match(/[^।]+[।]+(?:\s|$)/g)   // Hindi danda
      || [text]

    const cleanSentences = sentences.map(s => s.trim()).filter(Boolean)

    if (cleanSentences.length <= 1) {
      // Single sentence — speak directly
      const ut = new SpeechSynthesisUtterance(speakableText)
      if (femaleVoice) ut.voice = femaleVoice
      ut.pitch = pitch; ut.rate = rate; ut.volume = 1.0
      ut.onstart = () => setIsSpeaking(true)
      ut.onend = () => { setIsSpeaking(false); onDone?.() }
      ut.onerror = () => { setIsSpeaking(false); onDone?.() }
      synth.speak(ut)
      return
    }

    // Multi-sentence: speak each with a 220ms natural pause between them
    setIsSpeaking(true)
    let idx = 0

    const speakNext = () => {
      if (idx >= cleanSentences.length) {
        setIsSpeaking(false)
        onDone?.()
        return
      }
      let sentence = cleanSentences[idx++]
      if (!sentence) { speakNext(); return }
      
      // Apply phonetics again per sentence if needed (simpler: use speakableText logic here too)
      if (!/[\u0900-\u097F]/.test(sentence)) { 
         sentence = sentence
           .replace(/saarkaar/gi, 'Sarkaar')
           .replace(/\bkya\b/gi, 'kya') 
           .replace(/\bhai\b/gi, 'hay')
           .replace(/\bhain\b/gi, 'hain')
           .replace(/\bmain\b/gi, 'meh')
           .replace(/\bkaise\b/gi, 'kai-say')
      }

      const ut = new SpeechSynthesisUtterance(sentence)
      if (femaleVoice) ut.voice = femaleVoice
      ut.pitch = pitch; ut.rate = rate; ut.volume = 1.0
      // Natural pause between sentences — like a real person breathing between thoughts
      ut.onend = () => setTimeout(speakNext, 220)
      ut.onerror = () => setTimeout(speakNext, 100)
      synth.speak(ut)
    }

    speakNext()
  }


  // ─────────────────────────────────────────────────
  const triggerSend = async (forceText) => {
    const msg = (forceText || inputVal || '').trim()
    if (!msg || sendLockRef.current) return
    sendLockRef.current = true

    // Stop mic, clear input
    if (isListening) stopListening()
    clearTimers()
    setAutoListening(false)
    setInputVal('')
    synth?.cancel()

    // Status: sending
    setStatus('Sending Message', 'sending')
    setIsThinking(true)
    setReplyText('')
    setUiTrigger(null)
    const cur = normalizePartner(partner)
    if (cur === 'assistant') setAssistantState('listening')
    else if (typeof setBossState === 'function') setBossState('listening')

    try {
      setStatus('Searching Answer', 'thinking')
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          session_id: sessionId,
          current_partner: cur,
          tenant_id: 'default_tenant'
        })
      })
      const data = await res.json()
      const reply = data.response || 'How can I assist you further?'
      const active = normalizePartner(data.active_character || cur)

      setIsThinking(false)
      setReplyText(reply)
      setUiTrigger(data.ui_trigger || null)
      setStatus(active === 'boss' ? 'Boss Speaking' : 'Assistant Speaking', 'speaking')
      if (active === 'assistant') setAssistantState('talking')
      else if (typeof setBossState === 'function') setBossState('talking')

      speakTTS(reply, active, () => {
        setStatus('Ready', 'ready')
        setAssistantState('idle')
        sendLockRef.current = false
        scheduleAutoListen()   // auto-listen again after reply
      })

    } catch {
      const fb = 'Apologies, please try again.'
      setIsThinking(false)
      setReplyText(fb)
      setStatus('Assistant Speaking', 'speaking')
      speakTTS(fb, cur, () => {
        setStatus('Ready', 'ready')
        sendLockRef.current = false
        scheduleAutoListen()
      })
    }
  }

  const handleClose = () => {
    if (isListening) stopListening()
    resetAll()
    setPartner(null)
    setAssistantState('idle')
    if (typeof setBossState === 'function') setBossState('idle')
  }

  const handleMicClick = () => {
    // Interruption logic: if AI is speaking, stop it and start listening immediately
    if (isSpeaking) {
      synth?.cancel()
      setIsSpeaking(false)
      setAssistantState('idle')
      if (typeof setBossState === 'function') setBossState('idle')
      setInputVal('')
      startListening()
      setStatus('Listening…', 'listening')
      return
    }

    if (isListening) {
      stopListening()
      const t = (transcript || inputVal || '').trim()
      if (t) triggerSend(t)
      else setStatus('Ready', 'ready')
    } else {
      synth?.cancel()
      setInputVal('')
      startListening()
      setStatus('Listening…', 'listening')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (isListening) stopListening()
      triggerSend(inputVal)
    }
  }

  // ─ Placeholder text ─
  const placeholder = isListening ? 'Bol rahe ho… 🎤'
    : autoListening ? 'Mic ready…'
      : isThinking ? 'Please wait…'
        : 'Type or press 🎤 to speak…'

  const shouldShowBossPhoto = /\/profile\/sonu-boss\.png/i.test(replyText || '')

  if (!isOpen) return null

  return (
    <>
      {/* ══════════════════════════════════════════════════
          1. REPLY BOX — upper right, connected to assistant
          ══════════════════════════════════════════════════ */}
      <div className="cui-reply-box">
        {/* Header: badge left, close right */}
        <div className="cui-reply-header">
          <div className="cui-badge">
            <span className={`cui-led ${statusClass}`} />
            <span className="cui-badge-label">
              {partner === 'boss' ? '👔 Boss Reply' : '💁 Assistant Reply'}
            </span>
          </div>
          <button className="cui-xhr-btn" onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cui-reply-body">
          {isThinking && <TypingDots />}
          {!isThinking && replyText && (
            <TypeWriter
              key={replyText}
              text={replyText}
              speed={22}
            />
          )}
          {!isThinking && shouldShowBossPhoto && (
            <img
              src="/profile/sonu-boss.png"
              alt="Boss Sonu Saarkaar"
              className="cui-inline-boss-photo"
              onError={(e) => {
                e.currentTarget.src = '/face_texture.png'
              }}
            />
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          NEW: SMART WIDGET PANEL (LEFT SIDE)
          ══════════════════════════════════════════════════ */}
      {!isThinking && uiTrigger && (
        <div className="cui-side-widget-panel fade-in-up">
          <div className="cui-widget-header">
            <span className="cui-widget-header-title">Interaction Context</span>
            <button className="cui-xhr-btn" onClick={() => setUiTrigger(null)} aria-label="Close Widget">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="cui-smart-widget">
            {uiTrigger.type === 'profile_card' && (
              <div className="cui-profile-card">
                <div className="cui-profile-header">
                  <img
                    src="/profile/sonu-boss.png"
                    alt="Boss Sonu Saarkaar"
                    className="cui-profile-img"
                    onError={(e) => {
                      e.currentTarget.src = '/face_texture.png'
                    }}
                  />
                  <div>
                    <h4 className="cui-widget-title">{uiTrigger.name}</h4>
                    <p className="cui-widget-subtitle">{uiTrigger.role}</p>
                  </div>
                </div>
                <div className="cui-profile-bio">{uiTrigger.bio}</div>
                <div className="cui-profile-actions">
                  <a href={`mailto:${uiTrigger.email}`} className="cui-btn-action">📧 Email</a>
                  <a href={`tel:${uiTrigger.phone.replace(/\\s/g, '')}`} className="cui-btn-action">📞 Call</a>
                </div>
              </div>
            )}
            {uiTrigger.type === 'services_card' && (
              <div className="cui-services-card">
                <h4 className="cui-widget-title">Core Services</h4>
                <ul className="cui-services-list">
                  {uiTrigger.services.map((s, i) => (
                    <li key={i} className="cui-service-item">
                      <strong>{s.name}</strong>
                      <span>{s.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {uiTrigger.type === 'skills_card' && (
              <div className="cui-skills-card">
                <h4 className="cui-widget-title" style={{ color: '#ff9966' }}>{uiTrigger.title}</h4>
                <div className="cui-skills-grid">
                  {uiTrigger.categories.map((c, i) => (
                    <div key={i} className="cui-skill-category">
                      <strong>{c.name}</strong>
                      <span>{c.items}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {uiTrigger.type === 'social_card' && (
              <div className="cui-social-card">
                <h4 className="cui-widget-title" style={{ color: '#00c6ff', marginBottom: '15px' }}>{uiTrigger.title}</h4>
                <div className="cui-social-links">
                  {uiTrigger.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="cui-social-link-item">
                      <span className="cui-social-icon">{link.icon}</span>
                      <span className="cui-social-name">{link.name}</span>
                      <span className="cui-social-arrow">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {uiTrigger.type === 'location_card' && (
              <div className="cui-location-card">
                <div className="cui-location-header">
                  <h4 className="cui-widget-title">📌 Location</h4>
                  <h5 className="cui-widget-subtitle">{uiTrigger.address}</h5>
                </div>
                <div className="cui-map-preview">
                  <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Map View" className="cui-location-img" />
                </div>
                <a href={uiTrigger.map_url} target="_blank" rel="noopener noreferrer" className="cui-btn-action" style={{ display: 'flex', marginTop: '10px' }}>🗺️ Open Map</a>
              </div>
            )}
            {uiTrigger.type === 'project_card' && (
              <div className="cui-project-card">
                <div className="cui-project-header">
                  <h4 className="cui-widget-title" style={{ color: '#00c6ff' }}>{uiTrigger.title}</h4>
                  <h5 className="cui-widget-subtitle">{uiTrigger.tagline}</h5>
                </div>
                <div className="cui-project-tech"><strong>Core Stack:</strong> {uiTrigger.tech}</div>
                <button className="cui-btn-action" style={{ width: '100%', marginTop: '12px' }} onClick={() => {
                  setUiTrigger(null)
                  navigate(uiTrigger.link)
                }}>
                  View Project Details 🚀
                </button>
              </div>
            )}
            {uiTrigger.type === 'projects_list' && (
              <div className="cui-projects-list-widget">
                <h4 className="cui-widget-title">{uiTrigger.title}</h4>
                <ul className="cui-projects-list">
                  {uiTrigger.projects.map((p, i) => (
                    <li key={i} className="cui-project-list-item" onClick={() => {
                      setUiTrigger(null)
                      navigate(p.link)
                    }}>
                      <div className="cui-project-list-name">{p.name}</div>
                      <div className="cui-project-list-desc">{p.desc}</div>
                    </li>
                  ))}
                </ul>
                <button className="cui-btn-action" style={{ width: '100%', marginTop: '12px', background: 'rgba(212,175,55,0.2)' }} onClick={() => {
                  setUiTrigger(null)
                  navigate(uiTrigger.main_link)
                }}>
                  Explore Full Portfolio
                </button>
              </div>
            )}

            {uiTrigger.type === 'request_form' && (
              <RequestFormWidget
                title={uiTrigger.title}
                subtitle={uiTrigger.subtitle}
                onCancel={() => setUiTrigger(null)}
                onSubmitSuccess={(data) => {
                  setUiTrigger(null)
                  // Feed it back to the AI silently as an intent trigger
                  triggerSend(`[System: User submitted form: Name=${data.name}, Need=${data.requirement}]`)
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          2. STATUS PILL — just above input bar
          ══════════════════════════════════════════════════ */}
      <div className={`cui-status-pill cls-${statusClass}`}>
        <span className={`cui-status-dot ${statusClass}`} />
        <span className="cui-status-text">{statusLabel}</span>
      </div>

      {/* ══════════════════════════════════════════════════
          3. INPUT BAR — bottom center, call feeling
          ══════════════════════════════════════════════════ */}
      <div className={`cui-input-bar${isListening ? ' is-listening' : ''}`}>

        {/* Mic button */}
        <button
          className={`cui-mic-btn${isListening ? ' active' : ''}`}
          onClick={handleMicClick}
          title={isListening ? 'Tap to send' : 'Tap to speak'}
        >
          {isListening ? (
            /* Waveform bars when recording */
            <span className="cui-wave-icon">
              <span /><span /><span /><span /><span />
            </span>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>

        {/* Text input */}
        <input
          className="cui-text-input"
          type="text"
          placeholder={placeholder}
          value={inputVal}
          onChange={e => {
            if (!isListening) setInputVal(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          readOnly={isListening}
        />

        {/* Send */}
        <button
          className="cui-send-btn"
          onClick={() => {
            if (isListening) { stopListening(); triggerSend(transcript || inputVal) }
            else triggerSend(inputVal)
          }}
          disabled={!inputVal.trim() && !isListening && !isThinking}
          title="Send"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </>
  )
}
