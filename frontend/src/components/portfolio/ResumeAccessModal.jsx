import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'
import './ResumeAccessModal.css'

export default function ResumeAccessModal({ isOpen, onClose, initialFormData = null }) {
    const [step, setStep] = useState('form') // form, check_status, animating, success, pending

    // Forms
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact_number: '',
        organization: '',
        resume_type: 'Technical Resume',
        reason: ''
    })

    // Auto-fill effect
    useEffect(() => {
        if (isOpen) {
            const savedName = localStorage.getItem('user_name') || ''
            const savedEmail = localStorage.getItem('user_email') || ''
            setFormData(prev => ({
                ...prev,
                name: initialFormData?.name || prev.name || savedName,
                email: initialFormData?.email || prev.email || savedEmail,
                resume_type: initialFormData?.resume_type || prev.resume_type,
                reason: initialFormData?.reason || prev.reason,
            }))
            setCheckEmail(initialFormData?.email || '')
        }
    }, [isOpen, initialFormData])

    const [checkEmail, setCheckEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [successData, setSuccessData] = useState(null)
    const [historyData, setHistoryData] = useState([])

    // Animation Steps
    const [genStep, setGenStep] = useState(0)
    const [blueprintActive, setBlueprintActive] = useState(false)

    if (!isOpen) return null

    const fetchHistory = async (email) => {
        try {
            const res = await api.get(`/resume/history/${encodeURIComponent(email)}`)
            if (res.data && res.data.length > 0) {
                setHistoryData(res.data)
            }
        } catch (err) {
            console.log("No history found")
        }
    }

    const handleRequestAccess = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMsg('')
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                contact_number: formData.contact_number,
                organization: formData.organization,
                resume_type: formData.resume_type,
                reason: formData.reason
            }
            const res = await api.post('/resume/request', payload)
            if (res.data.status === 'pending') {
                setStep('pending')
                fetchHistory(formData.email)
            } else if (res.data.status === 'approved') {
                setCheckEmail(formData.email)
                handleCheckStatusMock(formData.email)
            } else {
                setErrorMsg(res.data.message)
            }
        } catch (err) {
            console.error(err)
            setErrorMsg(err?.response?.data?.detail || err?.response?.data?.message || 'System disconnected. Try again.')
        }
        setIsLoading(false)
    }

    const handleCheckStatusMock = async (email) => {
        try {
            const res = await api.get(`/resume/status/${encodeURIComponent(email)}`)
            if (res.data.status === 'pending') {
                setStep('pending')
            } else if (res.data.status === 'approved') {
                setSuccessData(res.data)
                runGenerationAnimation()
            } else if (res.data.status === 'rejected') {
                setErrorMsg('Access denied by admin.')
            } else if (res.data.status === 'expired') {
                setErrorMsg('Access token expired. Request again.')
            }
            fetchHistory(email)
        } catch (err) {
            setErrorMsg(err?.response?.data?.detail || 'Connection error.')
        }
    }

    const handleCheckStatus = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setErrorMsg('')
        try {
            const res = await api.get(`/resume/status/${encodeURIComponent(checkEmail)}`)
            fetchHistory(checkEmail)
            if (res.data.status === 'pending') {
                setStep('pending')
            } else if (res.data.status === 'approved') {
                setSuccessData(res.data)
                runGenerationAnimation()
            } else if (res.data.status === 'rejected') {
                setErrorMsg('Access denied by admin.')
            } else if (res.data.status === 'expired') {
                setErrorMsg('Access token expired. Request again.')
            }
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setErrorMsg('No protocol found for this identity.')
            } else {
                setErrorMsg(err?.response?.data?.detail || 'Connection error.')
            }
        }
        setIsLoading(false)
    }

    const runGenerationAnimation = () => {
        setStep('animating')
        setGenStep(0)
        setBlueprintActive(true) // Start blueprint animations on the left

        // Simulate complex build (Timing adjusted for Phase 6)
        setTimeout(() => setGenStep(1), 800)  // Verifying Identity
        setTimeout(() => setGenStep(2), 1600) // Fetching Timeline
        setTimeout(() => setGenStep(3), 2400) // Compiling Technical Skills
        setTimeout(() => setGenStep(4), 3200) // Structuring Data
        setTimeout(() => setGenStep(5), 4000) // Formatting PDF
        setTimeout(() => setGenStep(6), 4800) // Finalizing
        setTimeout(() => setStep('success'), 5600)
    }

    const handleDownload = async () => {
        if (!successData || !successData.token) return
        try {
            setStep('downloading') // Show mini animation
            setTimeout(async () => {
                try {
                    const res = await api.get(`/resume/download/${successData.token}`)
                    // Simulate download
                    const link = document.createElement('a')
                    link.href = res.data.url
                    link.setAttribute('download', res.data.filename)
                    document.body.appendChild(link)
                    link.click()
                    link.parentNode.removeChild(link)
                    setStep('success')
                    fetchHistory(checkEmail) // Refresh download counts
                } catch (e) {
                    alert(e?.response?.data?.detail || "Token expired or corrupted.")
                    setStep('success')
                }
            }, 1500)
        } catch (e) {
            alert(e?.response?.data?.detail || "Error initiating secure download.")
        }
    }

    const renderHistory = () => {
        if (historyData.length === 0) return null;
        return (
            <div className="rm-history-section">
                <h4>Activity Log</h4>
                <div className="rm-history-list">
                    {historyData.map(h => (
                        <div key={h.id} className="rm-history-item">
                            <div className="rm-h-top">
                                <span className="rm-h-type">{h.resume_type}</span>
                                <span className={`rm-h-status status-${h.status}`}>{h.status.toUpperCase()}</span>
                            </div>
                            <div className="rm-h-meta">
                                <span>Req: {new Date(h.created_at).toLocaleDateString()}</span>
                                <span>Downloads: {h.download_count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="resume-modal-overlay">
            <motion.div
                className="resume-full-container"
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 20 }}
            >
                <button className="rm-close-master" onClick={() => { setStep('form'); onClose() }}>×</button>

                <div className="rm-split-layout">

                    {/* ========================================================= */}
                    {/* LEFT COLUMN: LIVE RESUME BLUEPRINT ENGINE */}
                    {/* ========================================================= */}
                    <div className="rm-left-blueprint pulse-blue-glow">
                        <div className="rm-blueprint-bg"></div>
                        <div className="rm-blueprint-grid"></div>

                        <div className="rm-blueprint-header">
                            <div className="rm-bp-title">
                                <span className="bp-dot"></span>
                                EXECUTIVE RESUME // LIVE BUILD MODE
                                <span className="bp-cursor blink">_</span>
                            </div>
                        </div>

                        <div className="rm-blueprint-body">
                            {!blueprintActive ? (
                                <div className="bp-idle">
                                    <span className="bp-idle-text">[ AWAITING_AUTHORIZATION ]</span>
                                </div>
                            ) : (
                                <div className="bp-active-wrapper">

                                    {/* Blueprint Resume Skeleton that fades in sequentially */}
                                    <div className="bp-resume-document">
                                        <motion.div className="bp-section bp-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: genStep >= 1 ? 1 : 0.2, y: 0 }} transition={{ duration: 0.5 }}>
                                            <div className="bp-line bp-w-50 bp-h-large"></div>
                                            <div className="bp-line bp-w-30"></div>
                                        </motion.div>

                                        <motion.div className="bp-section" initial={{ opacity: 0 }} animate={{ opacity: genStep >= 2 ? 1 : 0.1 }}>
                                            <div className="bp-line bp-w-100"></div>
                                            <div className="bp-line bp-w-90"></div>
                                            <div className="bp-line bp-w-80"></div>
                                        </motion.div>

                                        <div className="bp-split">
                                            <motion.div className="bp-col" initial={{ opacity: 0 }} animate={{ opacity: genStep >= 3 ? 1 : 0.1 }}>
                                                <div className="bp-box bp-w-40 bp-h-mid"></div>
                                                <div className="bp-line bp-w-80"></div>
                                                <div className="bp-line bp-w-70"></div>
                                                <div className="bp-line bp-w-90"></div>
                                            </motion.div>
                                            <motion.div className="bp-col" initial={{ opacity: 0 }} animate={{ opacity: genStep >= 4 ? 1 : 0.1 }}>
                                                <div className="bp-box bp-w-40 bp-h-mid"></div>
                                                <div className="bp-line bp-w-100"></div>
                                                <div className="bp-line bp-w-90"></div>
                                            </motion.div>
                                        </div>

                                        <motion.div className="bp-section" initial={{ opacity: 0 }} animate={{ opacity: genStep >= 5 ? 1 : 0.1 }}>
                                            <div className="bp-line bp-w-60 bp-h-mid"></div>
                                            <div className="bp-line bp-w-100"></div>
                                            <div className="bp-line bp-w-100"></div>
                                            <div className="bp-line bp-w-50"></div>
                                        </motion.div>
                                    </div>

                                    {/* Scanner Line Effect */}
                                    {step === 'animating' && <div className="bp-scanner"></div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* RIGHT COLUMN: ACCESS CONTROL SYSTEM */}
                    {/* ========================================================= */}
                    <div className="rm-right-panel">
                        <div className="rm-auth-top">
                            <h2 className="rm-panel-title">SECURE RESUME CONSOLE</h2>
                            <p className="rm-panel-subtitle">Access Control & Authorization</p>
                        </div>

                        <div className="rm-interactive-area">
                            <AnimatePresence mode="wait">

                                {/* ENTRY */}
                                {step === 'entry' && (
                                    <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="rm-entry-options">
                                            <button className="rm-sys-btn rm-btn-gold" onClick={() => setStep('form')}>
                                                <span className="btn-icon">⚡</span> REQUEST CLEARANCE
                                            </button>
                                            <button className="rm-sys-btn rm-btn-outline" onClick={() => setStep('check_status')}>
                                                <span className="btn-icon">👁️</span> VERIFY ACCESS STATUS
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* FORM */}
                                {step === 'form' && (
                                    <motion.form key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} onSubmit={handleRequestAccess}>
                                        <div className="rm-premium-form">
                                            {/* Header Label */}
                                            <div className="rm-form-sec-title">
                                                <span className="sec-icon">👤</span> IDENTITY & ACCESS
                                            </div>

                                            <div className="rm-grid-2">
                                                <div className="rm-field">
                                                    <label>Full Name</label>
                                                    <div className="rm-input-wrapper">
                                                        <span className="input-icon">📛</span>
                                                        <input required placeholder="Your Legal Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="rm-field">
                                                    <label>Email Address</label>
                                                    <div className="rm-input-wrapper">
                                                        <span className="input-icon">📧</span>
                                                        <input required type="email" placeholder="official@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rm-grid-2">
                                                <div className="rm-field">
                                                    <label>Contact Number</label>
                                                    <div className="rm-input-wrapper">
                                                        <span className="input-icon">☎️</span>
                                                        <input required type="tel" placeholder="+91 XXXX-XXXX" value={formData.contact_number} onChange={e => setFormData({ ...formData, contact_number: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="rm-field">
                                                    <label>Organization / Industry</label>
                                                    <div className="rm-input-wrapper">
                                                        <span className="input-icon">🏢</span>
                                                        <input placeholder="Company or Entity" value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rm-form-sec-title mt-4">
                                                <span className="sec-icon">📜</span> CLEARANCE DETAILS
                                            </div>

                                            <div className="rm-field">
                                                <label>Target Document Type</label>
                                                <div className="rm-input-wrapper">
                                                    <span className="input-icon">📄</span>
                                                    <select className="rm-select" value={formData.resume_type} onChange={e => setFormData({ ...formData, resume_type: e.target.value })}>
                                                        <option>Technical Resume (Engineering)</option>
                                                        <option>Executive Profile (Management)</option>
                                                        <option>Full Academic CV</option>
                                                        <option>Creative Portfolio Resume</option>
                                                        <option>One-Page Hybrid Resume</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="rm-field">
                                                <label>Objective / Reason for Access</label>
                                                <div className="rm-input-wrapper">
                                                    <span className="input-icon">❓</span>
                                                    <textarea required rows="2" placeholder="Tell us why you need this clearance... (e.g. Recruitment, Collaboration)" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>

                                        {errorMsg && <div className="rm-error">{errorMsg}</div>}

                                        <div className="rm-form-footer">
                                            <button type="button" className="rm-sys-btn-text" onClick={() => setStep('check_status')}>{'👁 Check Status'}</button>
                                            <button type="submit" className="rm-sys-btn rm-btn-gold" disabled={isLoading}>
                                                {isLoading ? 'INITIATING...' : 'REQUEST PROTOCOL'}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}

                                {/* CHECK STATUS */}
                                {step === 'check_status' && (
                                    <motion.form key="check_status" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} onSubmit={handleCheckStatus}>
                                        <div className="rm-field mb-4">
                                            <label>Registered Email</label>
                                            <input required type="email" placeholder="Enter identification string..." value={checkEmail} onChange={e => setCheckEmail(e.target.value)} />
                                        </div>

                                        {errorMsg && <div className="rm-error">{errorMsg}</div>}
                                        {renderHistory()}

                                        <div className="rm-form-footer mt-4">
                                            <button type="button" className="rm-sys-btn-text" onClick={() => setStep('form')}>{'< BACK'}</button>
                                            <button type="submit" className="rm-sys-btn rm-btn-blue" disabled={isLoading}>
                                                {isLoading ? 'SCANNING...' : 'AUTHENTICATE'}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}

                                {/* PENDING */}
                                {step === 'pending' && (
                                    <motion.div key="pending" className="rm-sys-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="rm-spinner"></div>
                                        <h3 className="rm-state-title gold-text">AWAITING AUTHORIZATION</h3>
                                        <p className="rm-state-desc">Your request has been logged. Admin clearance is required to proceed. Check back later.</p>
                                        {renderHistory()}
                                        <button className="rm-sys-btn-text mt-4" onClick={() => setStep('form')}>{'< BACK TO FORM'}</button>
                                    </motion.div>
                                )}

                                {/* ANIMATING / BUILDING */}
                                {step === 'animating' && (
                                    <motion.div key="animating" className="rm-sys-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <h3 className="rm-state-title blue-text blink">GENERATING RESUME BLUEPRINT</h3>
                                        <ul className="rm-build-steps">
                                            <li className={genStep >= 1 ? "done" : ""}>Verifying Identity</li>
                                            <li className={genStep >= 2 ? "done" : ""}>Fetching Engineering Timeline</li>
                                            <li className={genStep >= 3 ? "done" : ""}>Compiling Technical Skills</li>
                                            <li className={genStep >= 4 ? "done" : ""}>Structuring AI Project Data</li>
                                            <li className={genStep >= 5 ? "done" : ""}>Formatting Secure PDF Output</li>
                                            <li className={genStep >= 6 ? "done" : ""}>Finalizing Document</li>
                                        </ul>
                                        <div className="rm-bp-progress-bar">
                                            <motion.div
                                                className="rm-bp-fill"
                                                initial={{ width: 0 }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 5.6, ease: "easeInOut" }}
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {/* SUCCESS */}
                                {step === 'success' && (
                                    <motion.div key="success" className="rm-sys-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                        <div className="rm-icon-large blue-text">✔️</div>
                                        <h3 className="rm-state-title blue-text">ACCESS GRANTED</h3>
                                        {historyData.length > 0 && <p className="rm-state-desc" style={{ color: '#60a5fa', marginBottom: '0.5rem' }}>Welcome back. Verification successful.</p>}
                                        <p className="rm-state-desc">Document rendering complete. Active link expires in 24 hours.</p>
                                        <button className="rm-sys-btn rm-btn-blue mt-4 w-full" onClick={handleDownload}>
                                            📥 DOWNLOAD SECURE PDF
                                        </button>
                                        {renderHistory()}
                                        <button className="rm-sys-btn-text mt-4 mx-auto block" onClick={() => setStep('entry')}>{'< EXIT SYSTEM'}</button>
                                    </motion.div>
                                )}

                                {/* DOWNLOADING (MINI ANIMATION) */}
                                {step === 'downloading' && (
                                    <motion.div key="downloading" className="rm-sys-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="rm-spinner blue-border"></div>
                                        <h3 className="rm-state-title blue-text">PREPARING SECURE PDF...</h3>
                                        <p className="rm-state-desc">Applying watermark: <br /><em>"Generated via SAARKAAR Digital Console"</em></p>
                                        <div className="rm-watermark-overlay"></div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    )
}
