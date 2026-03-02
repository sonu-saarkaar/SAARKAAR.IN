const fs = require('fs');
const content = "import React, { useState, useEffect, useRef } from 'react'
import { useExperienceStore } from '../store/experienceStore'
import { useAnimationStore } from '../store/animationStore'
import { useVoiceInput } from '../hooks/useVoiceInput'
import './ConversationUI.css'

const RECEPTIONIST_POS = [0, 0, -10.65]
const AUTO_CLOSE_DIST = 4.5

function TypingDots() {
    return (
        <div className=\\\\"typing-dots\\\\">
            <span /><span /><span />
        </div>
    )
}

export default function ConversationUI() {
    const {
        currentConversationPartner,
        setConversationPartner,
        setLastReceptionistReply,
        sessionId,
        userPosition,
    } = useExperienceStore()

    const { setReceptionistState, setBossState } = useAnimationStore()

    const [input, setInput] = useState('')
    const [latestReply, setLatestReply] = useState('')
    const [liveSpokenText, setLiveSpokenText] = useState('')
    const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false)
    const [callStatus, setCallStatus] = useState('Idle')

    const inputRef = useRef(null)
    const isSendingRef = useRef(false)
    const lastSubmittedRef = useRef({ text: '', ts: 0 })
    const lastSpokenRef = useRef({ text: '', ts: 0 })
    const speechRevealTimerRef = useRef(null)
    const voiceSilenceTimerRef = useRef(null)

    const partner = currentConversationPartner
    const isOpen = !!partner

    useEffect(() => {
        if (!isOpen) return
        if (partner !== 'receptionist') return
        const rx = RECEPTIONIST_POS[0], rz = RECEPTIONIST_POS[2]
        const dist = Math.sqrt((userPosition[0] - rx) ** 2 + (userPosition[2] - rz) ** 2)
        if (dist > AUTO_CLOSE_DIST) {
            handleClose()
        }
    }, [userPosition, isOpen, partner])

    useEffect(() => {
        if (isOpen && callStatus === 'Idle') {
            setCallStatus('Ready')
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    useEffect(() => {
        window.speechSynthesis?.getVoices()
        if ('speechSynthesis' in window && speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
        }
    }, [])

    const speakResponse = (text, voiceConfig, onEnd) => {
        if (!('speechSynthesis' in window)) return
        const normalized = (text || '').trim()
        if (!normalized) {
            if (onEnd) onEnd()
            return
        }

        const now = Date.now()
        if (lastSpokenRef.current.text === normalized && now - lastSpokenRef.current.ts < 5000) {
            if (onEnd) onEnd()
            return
        }

        lastSpokenRef.current = { text: normalized, ts: now }
        window.speechSynthesis.cancel()
        if (speechRevealTimerRef.current) {
            clearInterval(speechRevealTimerRef.current)
            speechRevealTimerRef.current = null
        }
        
        const ut = new SpeechSynthesisUtterance(normalized)
        const voices = window.speechSynthesis.getVoices()
        if (voiceConfig?.character === 'receptionist' || partner === 'receptionist') {
            ut.pitch = 1.2; ut.rate = 0.95
            const v = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'))
            if (v) ut.voice = v
        } else {
            ut.pitch = 0.8; ut.rate = 0.9
            const v = voices.find(v => v.name.includes('Male') || v.name.includes('Daniel') || v.name.includes('Google UK English Male'))
            if (v) ut.voice = v
        }

        ut.onstart = () => {
            setIsAssistantSpeaking(true)
            setLiveSpokenText('')
            setCallStatus('Speaking...')

            const words = normalized.split(' ')
            let i = 0
            speechRevealTimerRef.current = setInterval(() => {
                if (i >= words.length) {
                    clearInterval(speechRevealTimerRef.current)
                    speechRevealTimerRef.current = null
                    return
                }
                i += 1
                setLiveSpokenText(words.slice(0, i).join(' '))
            }, 140)
        }

        ut.onboundary = (event) => {
            if (typeof event.charIndex === 'number') {
                const upto = Math.max(0, Math.min(normalized.length, event.charIndex + 1))
                setLiveSpokenText(normalized.slice(0, upto))
            }
        }

        ut.onend = () => {
            if (speechRevealTimerRef.current) {
                clearInterval(speechRevealTimerRef.current)
                speechRevealTimerRef.current = null
            }
            setLiveSpokenText(normalized)
            setIsAssistantSpeaking(false)
            setCallStatus('Ready')
            if (onEnd) onEnd()
        }

        ut.onerror = () => {
            setIsAssistantSpeaking(false)
            setLiveSpokenText(normalized)
            setCallStatus('Ready')
            if (onEnd) onEnd()
        }

        window.speechSynthesis.speak(ut)
    }

    const { isListening, transcript, startListening, stopListening } = useVoiceInput(
        (finalText) => { if (finalText) handleSend(null, finalText) },
        () => {
            if (window.speechSynthesis?.speaking) {
                window.speechSynthesis.cancel()
                setIsAssistantSpeaking(false)
                if (partner === 'boss') setBossState('listening')
                else setReceptionistState('listening')
            }
            setCallStatus('Listening...')
        }
    )

    useEffect(() => {
        if (isListening) {
            setInput(transcript)
        }
    }, [isListening, transcript])

    useEffect(() => {
        if (!isListening) {
            if (voiceSilenceTimerRef.current) {
                clearTimeout(voiceSilenceTimerRef.current)
                voiceSilenceTimerRef.current = null
            }
            return
        }

        const live = (transcript || '').trim()
        if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current)

        if (!live) {
            voiceSilenceTimerRef.current = setTimeout(() => {
                stopListening()
                setCallStatus('Ready')
            }, 5000)
            return
        }

        voiceSilenceTimerRef.current = setTimeout(() => {
            const finalText = (transcript || '').trim()
            if (!finalText) return
            stopListening()
            handleSend(null, finalText)
        }, 1500)

    }, [isListening, transcript])

    useEffect(() => {
        return () => {
            if (speechRevealTimerRef.current) clearInterval(speechRevealTimerRef.current)
            if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current)
        }
    }, [])

    const handleClose = () => {
        setConversationPartner(null)
        setReceptionistState('idle')
        setBossState('idle')
        setLastReceptionistReply('')
        window.speechSynthesis?.cancel()
        if (speechRevealTimerRef.current) clearInterval(speechRevealTimerRef.current)
        if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current)
        setIsAssistantSpeaking(false)
        setLiveSpokenText('')
        setInput('')
        setLatestReply('')
        setCallStatus('Idle')
    }

    const handleSend = async (e, forcedText = null) => {
        if (e) e.preventDefault()
        const normalized = (forcedText || input || '').trim()
        if (!normalized) return

        const now = Date.now()
        if (lastSubmittedRef.current.text === normalized && now - lastSubmittedRef.current.ts < 3500) return
        if (isSendingRef.current) return

        isSendingRef.current = true
        lastSubmittedRef.current = { text: normalized, ts: now }

        setInput('')
        setLiveSpokenText('')
        setIsAssistantSpeaking(false)
        setCallStatus('Sending Message...')

        if (partner === 'receptionist') setReceptionistState('listening')
        else setBossState('listening')

        setTimeout(() => {
            if (isSendingRef.current) setCallStatus('Creating Response...')
        }, 400)

        const hostname = window.location.hostname
        const tenantId = (hostname === 'localhost' || hostname === '127.0.0.1') ? 'default_tenant' : hostname.split('.')[0]

        try {
            const res = await fetch('http://127.0.0.1:8000/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: normalized, session_id: sessionId, current_partner: partner, tenant_id: tenantId })
            })
            const data = await res.json()
            setLatestReply(data.response || '')

            const activePartner = (data.active_character || partner).toLowerCase()
            if (activePartner === 'receptionist') setLastReceptionistReply(data.response || '')

            const anim = data.animation || 'talking'
            if (activePartner === 'boss') setBossState(anim)
            else setReceptionistState('talking')

            const onEnd = () => {
                if (activePartner === 'boss') setBossState('listening')
                else setReceptionistState('idle')
                
                setTimeout(() => {
                    if (useExperienceStore.getState().currentConversationPartner) {
                        try {
                            startListening()
                        } catch(err) {}
                    }
                }, 300)
            }

            speakResponse(data.response, { character: activePartner }, onEnd)

            if (data.active_character && data.active_character.toLowerCase() !== partner) {
                setConversationPartner(data.active_character.toLowerCase())
            }
            if (data.camera_focus) useExperienceStore.getState().setCameraFocus(data.camera_focus)

        } catch (error) {
            const errMsg = 'Systems recalibrating. Please try again.'
            setLatestReply(errMsg)
            setCallStatus('Ready')
            speakResponse(errMsg, { character: partner })
        } finally {
            isSendingRef.current = false
        }
    }

    if (!isOpen) return null

    const isReceptionist = partner === 'receptionist'
    const partnerName = isReceptionist ? 'Head Receptionist' : 'CEO Office'
    const currentReplyText = isAssistantSpeaking ? liveSpokenText : latestReply
    
    let statusClass = 'ready'
    if (callStatus === 'Listening...') statusClass = 'listening'
    if (callStatus === 'Sending Message...') statusClass = 'sending'
    if (callStatus === 'Creating Response...') statusClass = 'creating'
    if (callStatus === 'Speaking...') statusClass = 'speaking'
    
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const rootCls = 'cui-root ' + (isOpen ? 'cui-visible' : '')
    const pillCls = 'call-status-pill ' + ((statusClass === 'listening' || statusClass === 'speaking') ? 'active-glow' : '')
    const dotCls = 'call-status-dot ' + statusClass
    const btnCls = 'call-icon-btn ' + (isListening ? 'mic-active' : '')
    const sendCls = 'call-icon-btn ' + (input.length > 0 && !isListening ? 'send-active' : '')

    return (
        <div className={rootCls}>
            {((callStatus === 'Creating Response...' || callStatus === 'Sending Message...' || latestReply) && latestReply !== '') && (
                <div className=\\\\"call-response-box\\\\">
                    <div className=\\\\"call-header\\\\">
                        <div className=\\\\"call-name\\\\">{partnerName}</div>
                        <div className=\\\\"call-time\\\\">{timeString}</div>
                    </div>
                    <div className=\\\\"call-message\\\\">
                        {(callStatus === 'Creating Response...' || callStatus === 'Sending Message...') && !isAssistantSpeaking 
                            ? <TypingDots /> 
                            : currentReplyText}
                    </div>
                </div>
            )}

            <div className=\\\\"call-bottom-container\\\\">
                <div className={pillCls}>
                    <span className={dotCls} />
                    <span className=\\\\"call-status-text\\\\">{callStatus}</span>
                </div>

                <form className=\\\\"call-input-bar\\\\" onSubmit={handleSend}>
                    <button
                        type=\\\\"button\\\\"
                        className={btnCls}
                        onClick={() => {
                            if (isListening) stopListening()
                            else startListening()
                        }}
                    >
                        {isListening ? (
                            <svg viewBox=\\\\"0 0 24 24\\\\" width=\\\\"20\\\\" height=\\\\"20\\\\" fill=\\\\"currentColor\\\\">
                                <path d=\\\\"M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z\\\\" />
                            </svg>
                        ) : (
                            <svg viewBox=\\\\"0 0 24 24\\\\" width=\\\\"20\\\\" height=\\\\"20\\\\" fill=\\\\"currentColor\\\\">
                                <path d=\\\\"M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z\\\\" />
                                <path d=\\\\"M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z\\\\" />
                            </svg>
                        )}
                    </button>

                    <input
                        ref={inputRef}
                        type=\\\\"text\\\\"
                        className=\\\\"call-input-field\\\\"
                        value={isListening ? (transcript || input) : input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isListening ? 'Listening...' : 'Type or use mic...'}
                        readOnly={isListening}
                        autoComplete=\\\\"off\\\\"
                    />

                    <button 
                        type=\\\\"submit\\\\" 
                        className={sendCls}
                    >
                        <svg viewBox=\\\\"0 0 24 24\\\\" width=\\\\"18\\\\" height=\\\\"18\\\\" fill=\\\\"currentColor\\\\">
                            <path d=\\\\"M2.01 21L23 12 2.01 3 2 10l15 2-15 2z\\\\" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    )
}";
fs.writeFileSync('C:/Users/Sonu Bhai/Desktop/Project/SAARKAAR.IN/frontend/src/components/ConversationUI.jsx', content);
