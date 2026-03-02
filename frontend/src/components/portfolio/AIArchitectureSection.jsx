import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import './AIArchitectureSection.css'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const SUGGESTED_QUESTIONS = [
    "What projects has Asif built?",
    "KYRON kya hai?",
    "Tech stack bao",
    "Hire karna hai",
    "What is SAARKAAR?",
]

export default function AIArchitectureSection() {
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            text: "I'm SAARKAAR's Portfolio AI — trained on Asif Alam's complete professional history. Ask me anything: projects, tech stack, hiring, or his vision. Aap Hindi mein bhi pooch sakte hain! 🤖"
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const chatEndRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const sendMessage = async (text) => {
        const msg = (text || input).trim()
        if (!msg || loading) return

        const userMsg = { role: 'user', text: msg }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        const hostname = window.location.hostname;
        const tenantId = hostname === 'localhost' || hostname === '127.0.0.1' ? 'default_tenant' : hostname.split('.')[0];

        try {
            const res = await axios.post(`${BACKEND}/api/chat`, {
                messages: [{ role: 'user', content: msg }],
                language: 'auto',
                tenant_id: tenantId
            })
            const aiText = res.data.response || "System processed your query."
            setMessages(prev => [...prev, { role: 'ai', text: aiText }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: "Neural Core temporarily offline. Please try again in a moment.",
                error: true
            }])
        } finally {
            setLoading(false)
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage()
    }

    return (
        <section className="aia-section" id="ai-system">

            {/* === HEADER === */}
            <div className="aia-header">
                <span className="aia-label">NEURAL INTERFACE</span>
                <h2 className="aia-title">SYSTEM <span>ARCHITECTURE</span></h2>
            </div>

            {/* === ARCHITECTURE NODES === */}
            <div className="aia-arch-diagram">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="aia-arch-node aia-node-teal"
                >
                    <div className="aia-node-icon">⚡</div>
                    <h4>FRONTEND</h4>
                    <span className="aia-node-pill">React + Three.js</span>
                    <p>Immersive UI Layer</p>
                </motion.div>

                <div className="aia-arch-arrow">→</div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="aia-arch-node aia-node-gold"
                >
                    <div className="aia-node-icon">⚙️</div>
                    <h4>BACKEND CORE</h4>
                    <span className="aia-node-pill aia-pill-gold">FastAPI (Python)</span>
                    <p>Logic & Processing</p>
                </motion.div>

                <div className="aia-arch-arrow">→</div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="aia-arch-node aia-node-red"
                >
                    <div className="aia-node-icon">🧠</div>
                    <h4>AI ENGINE</h4>
                    <span className="aia-node-pill aia-pill-red">OpenAI GPT-4o</span>
                    <p>Neural Intelligence</p>
                </motion.div>
            </div>

            {/* === AI CHAT INTERFACE === */}
            <motion.div
                className="aia-chat-wrapper"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                {/* Chat Header */}
                <div className="aia-chat-header">
                    <div className="aia-chat-header-left">
                        <div className="aia-status-dot"></div>
                        <div>
                            <h3>🎙️ INTERVIEW THE FOUNDER AI</h3>
                            <p>Trained on complete SAARKAAR portfolio · Multilingual · Real-time</p>
                        </div>
                    </div>
                    <div className="aia-header-badge">AI ONLINE</div>
                </div>

                {/* Message Window */}
                <div className="aia-messages">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`aia-msg ${msg.role === 'user' ? 'aia-msg-user' : 'aia-msg-ai'} ${msg.error ? 'aia-msg-error' : ''}`}
                            >
                                {msg.role === 'ai' && (
                                    <div className="aia-msg-avatar">AI</div>
                                )}
                                <div className="aia-msg-bubble">{msg.text}</div>
                                {msg.role === 'user' && (
                                    <div className="aia-msg-avatar aia-user-avatar">U</div>
                                )}
                            </motion.div>
                        ))}

                        {/* Typing Indicator */}
                        {loading && (
                            <motion.div
                                key="typing"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="aia-msg aia-msg-ai"
                            >
                                <div className="aia-msg-avatar">AI</div>
                                <div className="aia-typing-indicator">
                                    <span></span><span></span><span></span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={chatEndRef} />
                </div>

                {/* Suggested Questions */}
                <div className="aia-suggestions">
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                            key={i}
                            className="aia-suggestion-chip"
                            onClick={() => sendMessage(q)}
                            disabled={loading}
                        >
                            {q}
                        </button>
                    ))}
                </div>

                {/* Input Bar */}
                <form className="aia-input-bar" onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="aia-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask anything... Hindi ya English mein (e.g. 'KYRON kya hai?')"
                        disabled={loading}
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        className="aia-send-btn"
                        disabled={loading || !input.trim()}
                    >
                        {loading ? (
                            <span className="aia-btn-spinner"></span>
                        ) : (
                            <span>SEND ↑</span>
                        )}
                    </button>
                </form>

                <div className="aia-chat-footer">
                    Powered by SAARKAAR Neural Core · Responds in your language
                </div>
            </motion.div>

        </section>
    )
}
