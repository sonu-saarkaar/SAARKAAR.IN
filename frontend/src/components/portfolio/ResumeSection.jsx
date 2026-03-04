import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import './ResumeSection.css'

const RESUME_REQUEST_FALLBACK_URLS = [
    'http://127.0.0.1:8011/api/resume/request',
    'http://127.0.0.1:8013/api/resume/request',
    'http://localhost:8011/api/resume/request',
    'http://localhost:8013/api/resume/request',
]

const RESUME_API_BASES = [
    '',
    'http://127.0.0.1:8011/api',
    'http://127.0.0.1:8013/api',
    'http://localhost:8011/api',
    'http://localhost:8013/api',
]

const RESUME_DATA = {
    name: 'Asif Alam (Sonu)',
    role: 'AI Systems Architect & Full Stack Developer',
    location: 'Bihar, India',
    email: 'sonusaarkaar@gmail.com',
    phone: '+91 9798299944',
    summary: 'Elite Full Stack Developer specialising in AI automation, immersive 3D web systems, and enterprise-grade digital ecosystems. Founder of SAARKAAR — a premium digital solutions firm.',
    skills: ['React / Next.js', 'Python / FastAPI', 'Three.js / WebGL', 'OpenAI / LLMs', 'MongoDB / PostgreSQL', 'Node.js', 'AWS / Railway', 'AI Agent Design'],
    experience: [
        { title: 'Founder & AI Architect', company: 'SAARKAAR', year: '2024 – Present', desc: 'Built full 3D virtual office with AI assistant system, multi-tenant SaaS architecture.' },
    ],
    education: 'B.Tech CSE — Parul University',
}

const SCAN_DURATION_MS = 3000
const SCAN_RESULT_HOLD_MS = 1200

export default function ResumeSection() {
    const [requestForm, setRequestForm] = useState({
        name: '',
        email: '',
        phone: '',
        documentType: 'Technical Resume (Engineering)',
        reason: '',
    })

    const [statusEmail, setStatusEmail] = useState('')
    const [activePanel, setActivePanel] = useState('request')

    const [toast, setToast] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [requestHistory, setRequestHistory] = useState([])
    const [historyEmail, setHistoryEmail] = useState('')
    const [historyLoaded, setHistoryLoaded] = useState(false)
    const [requestLocked, setRequestLocked] = useState(false)
    const [status, setStatus] = useState('idle')
    const [token, setToken] = useState('')
    const [lastRequestId, setLastRequestId] = useState('')
    const [hasCheckedStatus, setHasCheckedStatus] = useState(false)
    const [hasStatusData, setHasStatusData] = useState(true)
    const [requestAnimating, setRequestAnimating] = useState(false)
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [shakeCard, setShakeCard] = useState(false)
    const [scanState, setScanState] = useState({
        active: false,
        scanning: false,
        message: '',
    })
    const scanStartedAtRef = useRef(0)

    const showToast = (message) => {
        setToast(typeof message === 'string' ? message : String(message || 'Something went wrong'))
        window.clearTimeout(window.__resumeToastTimer)
        window.__resumeToastTimer = window.setTimeout(() => setToast(''), 2500)
    }

    const normalizeApiError = (error, fallback = 'Something went wrong') => {
        const payload = error?.response?.data

        if (!payload) return fallback
        if (typeof payload === 'string') return payload

        const detail = payload?.detail
        if (typeof detail === 'string') return detail

        if (Array.isArray(detail) && detail.length > 0) {
            const first = detail[0]
            if (typeof first === 'string') return first
            if (first && typeof first === 'object') return first.msg || first.message || fallback
        }

        if (typeof payload?.message === 'string') return payload.message
        return fallback
    }

    const formatRequestTime = (value) => {
        if (!value) return 'Just now'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'Unknown time'
        return date.toLocaleString()
    }

    const loadHistoryByEmail = async (email) => {
        if (!email) {
            setRequestHistory([])
            setHistoryEmail('')
            setHistoryLoaded(false)
            return
        }

        const encodedEmail = encodeURIComponent(email)
        const candidates = []
        for (const base of RESUME_API_BASES) {
            const prefix = base ? `${base}` : ''
            candidates.push({ url: `${prefix}/resume/history/${encodedEmail}` })
            candidates.push({ url: `${prefix}/resume/history`, params: { email } })
        }

        let lastError = null
        for (const candidate of candidates) {
            try {
                const historyRes = await api.get(candidate.url, candidate.params ? { params: candidate.params } : undefined)
                const items = Array.isArray(historyRes?.data)
                    ? historyRes.data
                    : Array.isArray(historyRes?.data?.items)
                        ? historyRes.data.items
                        : []
                setRequestHistory(items)
                setHistoryEmail(email)
                setHistoryLoaded(true)
                return
            } catch (error) {
                lastError = error
            }
        }

        setRequestHistory([])
        setHistoryEmail(email)
        setHistoryLoaded(false)
        throw lastError
    }

    const fetchStatusWithFallback = async (email) => {
        const encodedEmail = encodeURIComponent(email)
        const candidates = []

        for (const base of RESUME_API_BASES) {
            const prefix = base ? `${base}` : ''
            candidates.push({ url: `${prefix}/resume/status`, params: { email } })
            candidates.push({ url: `${prefix}/resume/status/${encodedEmail}` })
        }

        let lastError = null
        for (const candidate of candidates) {
            try {
                return await api.get(candidate.url, candidate.params ? { params: candidate.params } : undefined)
            } catch (error) {
                lastError = error
            }
        }
        throw lastError
    }

    const fetchDownloadWithFallback = async (resumeToken, email) => {
        const candidates = []
        for (const base of RESUME_API_BASES) {
            const prefix = base ? `${base}` : ''
            candidates.push({ url: `${prefix}/resume/download/${resumeToken}` })
            candidates.push({ url: `${prefix}/resume/download`, params: { token: resumeToken, email } })
        }

        let lastError = null
        for (const candidate of candidates) {
            try {
                return await api.get(candidate.url, candidate.params ? { params: candidate.params } : undefined)
            } catch (error) {
                lastError = error
            }
        }

        throw lastError
    }

    const startScanAnimation = () => {
        scanStartedAtRef.current = Date.now()
        setScanState({ active: true, scanning: true, message: 'SCANNING REQUEST...' })
    }

    const finalizeScanAnimation = (nextStatus, nextToken = '') => {
        const elapsedMs = scanStartedAtRef.current ? Date.now() - scanStartedAtRef.current : 0
        const waitMs = Math.max(250, SCAN_DURATION_MS - elapsedMs)

        window.setTimeout(() => {
            let resultMessage = 'STATUS UPDATED'

            if (nextStatus === 'approved') {
                setIsUnlocked(true)
                setToken(nextToken || '')
                resultMessage = 'ACCESS VERIFIED'
            } else if (nextStatus === 'pending') {
                setIsUnlocked(false)
                setToken('')
                resultMessage = 'AUTHORIZATION PENDING'
            } else if (nextStatus === 'not_found') {
                setIsUnlocked(false)
                setToken('')
                setShakeCard(true)
                window.setTimeout(() => setShakeCard(false), 700)
                resultMessage = 'NO REQUEST FOUND'
            } else {
                setIsUnlocked(false)
                setToken('')
                setShakeCard(true)
                window.setTimeout(() => setShakeCard(false), 700)
                resultMessage = 'ACCESS DENIED'
            }

            setScanState({ active: true, scanning: false, message: resultMessage })

            window.setTimeout(() => {
                setScanState({ active: false, scanning: false, message: '' })
            }, SCAN_RESULT_HOLD_MS)
        }, waitMs)
    }

    const getResumePreviewData = () => {
        const email = statusEmail.trim()
        const matched = historyEmail === email && Array.isArray(requestHistory) && requestHistory.length > 0
            ? requestHistory[0]
            : null

        if (!hasCheckedStatus || !hasStatusData || !matched) {
            return RESUME_DATA
        }

        const requestedType = matched.resume_type || matched.documentType || 'Requested Resume'
        const createdAt = matched.created_at ? new Date(matched.created_at) : null
        const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
            ? `${createdAt.toLocaleDateString()} – Present`
            : 'Active Request'

        return {
            ...RESUME_DATA,
            name: matched.name || RESUME_DATA.name,
            role: `${requestedType} · Access Workflow`,
            location: matched.organization || RESUME_DATA.location,
            email: matched.email || RESUME_DATA.email,
            summary: (matched.reason || '').trim() || RESUME_DATA.summary,
            experience: [
                {
                    title: 'Resume Access Request',
                    company: matched.organization || 'SAARKAAR Secure Console',
                    year: createdLabel,
                    desc: `Status: ${(matched.status || 'pending').toUpperCase()}`,
                },
            ],
        }
    }

    const previewData = getResumePreviewData()

    const validateRequest = () => {
        if (!requestForm.name.trim()) return 'Please enter full name.'
        if (!requestForm.email.trim()) return 'Please enter email.'
        if (!requestForm.documentType.trim()) return 'Please select resume type.'
        if (!requestForm.reason.trim()) return 'Please enter reason for download.'
        return ''
    }

    const postResumeRequestWithFallback = async (payload) => {
        try {
            return await api.post('/resume/request', payload)
        } catch (primaryError) {
            const shouldTryFallback = !primaryError?.response || primaryError?.response?.status >= 500
            if (!shouldTryFallback) {
                throw primaryError
            }

            for (const url of RESUME_REQUEST_FALLBACK_URLS) {
                try {
                    return await api.post(url, payload)
                } catch {
                    // try next fallback url
                }
            }

            throw primaryError
        }
    }

    const handleRequest = async () => {
        const validationError = validateRequest()
        if (validationError) {
            showToast(validationError)
            return
        }

        setIsSubmitting(true)
        setRequestAnimating(true)
        try {
            const requestEmail = requestForm.email.trim()
            const cleanPhone = requestForm.phone.trim()
            const selectedResumeType = requestForm.documentType || 'Technical Resume (Engineering)'
            const payload = {
                name: requestForm.name.trim(),
                email: requestEmail,
                phone: cleanPhone,
                contact_number: cleanPhone,
                documentType: selectedResumeType,
                resume_type: selectedResumeType,
                reason: requestForm.reason.trim(),
            }

            const res = await postResumeRequestWithFallback(payload)
            const nextStatus = res?.data?.status || 'pending'
            const nextToken = res?.data?.token || ''
            const requestId = res?.data?.id || ''

            setStatus(nextStatus)
            setStatusEmail(requestEmail)
            setActivePanel('request')
            setHasCheckedStatus(false)
            setHasStatusData(true)
            setLastRequestId(requestId)
            if (nextStatus === 'approved') {
                setIsUnlocked(true)
                setToken(nextToken)
                setRequestLocked(true)
            } else {
                setRequestLocked(true)
                setIsUnlocked(false)
            }

            await loadHistoryByEmail(requestEmail)
            showToast('Request submitted successfully')
        } catch (error) {
            showToast(normalizeApiError(error, 'Failed to submit request'))
        } finally {
            setIsSubmitting(false)
            window.setTimeout(() => setRequestAnimating(false), 250)
        }
    }

    const handleCheckStatus = async (isSilent = false, scanAlreadyStarted = false) => {
        const email = statusEmail.trim() || requestForm.email.trim()
        if (!email) {
            if (!isSilent) showToast('Please enter email first.')
            return
        }

        if (!isSilent) setIsChecking(true)
        if (!isSilent && !scanAlreadyStarted) startScanAnimation()
        try {
            const res = await fetchStatusWithFallback(email)
            const nextStatus = res?.data?.status || 'pending'
            const nextToken = res?.data?.token || ''

            setStatus(nextStatus)
            setToken(nextToken)
            setIsUnlocked(nextStatus === 'approved' && !!nextToken)
            setStatusEmail(email)
            setHasCheckedStatus(true)
            setHasStatusData(true)

            if (!isSilent) {
                finalizeScanAnimation(nextStatus, nextToken)
            }

            try {
                await loadHistoryByEmail(email)
            } catch {
                if (!isSilent) showToast('Status मिला, लेकिन history load nahi ho payi.')
            }

            setActivePanel('status')

            if (!isSilent && nextStatus === 'approved') {
                showToast('Request approved. Download unlocked.')
            }
        } catch (error) {
            setStatus('not_found')
            setToken('')
            setIsUnlocked(false)
            setHasCheckedStatus(true)
            setHasStatusData(false)
            setHistoryEmail(email)
            setRequestHistory([])
            setHistoryLoaded(true)

            if (!isSilent) {
                finalizeScanAnimation('not_found')
            }

            if (!isSilent) {
                showToast(normalizeApiError(error, 'No request found for this email'))
            }
        } finally {
            if (!isSilent) setIsChecking(false)
        }
    }

    const handleManualCheckStatus = () => {
        if (isChecking) return
        startScanAnimation()
        handleCheckStatus(false, true)
    }

    const handleDownload = async () => {
        const useToken = (token || '').trim()
        if (!useToken) {
            showToast('Token missing. Please check status again.')
            return
        }

        try {
            const res = await fetchDownloadWithFallback(useToken, statusEmail.trim() || requestForm.email.trim())
            const link = document.createElement('a')
            link.href = res.data.url
            link.setAttribute('download', res.data.filename || 'SAARKAAR_Resume.pdf')
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            showToast(normalizeApiError(error, 'Resume download failed'))
        }
    }

    useEffect(() => {
        const email = statusEmail.trim() || requestForm.email.trim()
        if (!email || activePanel !== 'status') return undefined

        const intervalId = window.setInterval(() => {
            handleCheckStatus(true)
        }, 5000)

        return () => window.clearInterval(intervalId)
    }, [activePanel, statusEmail, requestForm.email])

    return (
        <section id="resume" className="rs-section">
            <div className="rs-glow" />

            {toast && <div className="rs-toast">{toast}</div>}

            <motion.div
                className="rs-wrapper"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
                <div className="rs-left">
                    <div className="rs-left-label">EXECUTIVE RESUME — PREVIEW</div>

                    <div className={`rs-resume-card ${shakeCard ? 'rs-shake' : ''} ${activePanel === 'status' && hasCheckedStatus && !hasStatusData ? 'rs-no-data' : ''}`}>
                        <div className="rs-rc-header">
                                <div className="rs-rc-avatar">
                                <img
                                    src="/profile/sonu-boss.png?v=2"
                                    alt="Asif Alam (Sonu Saarkaar)"
                                    onError={(e) => {
                                        e.currentTarget.src = '/face_texture.png'
                                    }}
                                />
                            </div>
                            <div>
                                <div className="rs-rc-name">{previewData.name}</div>
                                <div className="rs-rc-role">{previewData.role}</div>
                                <div className="rs-rc-meta">
                                    <span>📍 {previewData.location}</span>
                                    <span>✉ {previewData.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rs-rc-divider" />

                        <div className="rs-rc-block">
                            <div className="rs-rc-section-title">PROFILE</div>
                            <p className="rs-rc-text">{previewData.summary}</p>
                        </div>

                        <div className="rs-rc-block rs-skills-block">
                            <div className="rs-rc-section-title">CORE SKILLS</div>
                            <div className="rs-skills-grid">
                                {previewData.skills.map((skill) => (
                                    <span key={skill} className="rs-skill-tag">{skill}</span>
                                ))}
                            </div>

                            {!isUnlocked && !scanState.active && (
                                <div className="rs-blur-lock">
                                    <div className="rs-lock-badge">
                                        <span className="rs-lock-icon">🔒</span>
                                        <span>Full Document Secured</span>
                                        <span className="rs-lock-sub">Request Clearance to Unlock</span>
                                        <span className="rs-scan-line" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="rs-rc-block">
                            <div className="rs-rc-section-title">EXPERIENCE</div>
                            {previewData.experience.map((exp, index) => (
                                <div key={index} className="rs-exp-item">
                                    <div className="rs-exp-top">
                                        <span className="rs-exp-title">{exp.title}</span>
                                        <span className="rs-exp-year">{exp.year}</span>
                                    </div>
                                    <div className="rs-exp-company">{exp.company}</div>
                                    <div className="rs-exp-desc">{exp.desc}</div>
                                </div>
                            ))}
                        </div>

                        <div className="rs-rc-block">
                            <div className="rs-rc-section-title">EDUCATION</div>
                            <div className="rs-rc-text">{previewData.education}</div>
                        </div>

                        {scanState.active && (
                            <div className={`rs-scan-overlay ${scanState.scanning ? 'is-scanning' : 'is-result'}`}>
                                <div className="rs-scan-gradient" />
                                <div className="rs-scan-glitch" />
                                {scanState.scanning && <div className="rs-scan-line-animated" />}
                                <div className="rs-scan-center">
                                    <span className="rs-lock-blink">🔒</span>
                                    <span className="rs-scan-text">{scanState.message}</span>
                                </div>
                                <div className="rs-progress-wrap">
                                    <div className="rs-progress-track">
                                        <div className={`rs-progress-fill ${scanState.scanning ? 'is-running' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {requestAnimating && !scanState.active && (
                            <div className="rs-build-overlay">
                                <div className="rs-build-grid" />
                                <div className="rs-build-core">
                                    <span className="rs-build-lock">⚙️</span>
                                    <span className="rs-build-title">BUILDING RESUME PROFILE</span>
                                    <span className="rs-build-sub">Matching candidate intent with requested role...</span>
                                </div>
                            </div>
                        )}

                        {activePanel === 'status' && hasCheckedStatus && !hasStatusData && !scanState.active && (
                            <div className="rs-no-data-overlay">
                                <span className="rs-no-data-title">NO VERIFIED RESUME DATA</span>
                                <span className="rs-no-data-sub">Check with correct email or submit a new request.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="rs-right">
                    <div className="rs-right-label">SECURE DOCUMENTATION</div>
                    <div className="rs-right-shell">
                        <div className="rs-right-top">
                            <h2 className="rs-heading">SECURE <span className="rs-heading-outline">RESUME CONSOLE</span></h2>
                            <p className="rs-desc">Request access and check authorization status without leaving this page.</p>
                        </div>

                        <div className="rs-panel-content">
                            <div className="rs-switch-shell">
                                <div className="rs-dual-grid">
                                    <button
                                        type="button"
                                        className={`rs-mode-card ${activePanel === 'request' ? 'is-active' : ''}`}
                                        onClick={() => setActivePanel('request')}
                                    >
                                        <span className="rs-dual-title">Request For Resume</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`rs-mode-card ${activePanel === 'status' ? 'is-active' : ''}`}
                                        onClick={() => setActivePanel('status')}
                                    >
                                        <span className="rs-dual-title">Check Request</span>
                                    </button>
                                </div>
                            </div>

                            <div className="rs-detail-shell">
                                {activePanel === 'request' ? (
                                    <>
                                        <div className="rs-detail-title">Request For Resume</div>

                                        <div className="rs-request-form">
                                            <div className="rs-request-field">
                                                <label>Full Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Enter full name"
                                                    value={requestForm.name}
                                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="rs-request-field">
                                                <label>Email ID</label>
                                                <input
                                                    type="email"
                                                    placeholder="Enter email"
                                                    value={requestForm.email}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        setRequestForm((prev) => ({ ...prev, email: value }))
                                                        if (!statusEmail) setStatusEmail(value)
                                                    }}
                                                />
                                            </div>
                                            <div className="rs-request-field">
                                                <label>Phone</label>
                                                <input
                                                    type="tel"
                                                    placeholder="Enter phone (optional)"
                                                    value={requestForm.phone}
                                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                />
                                            </div>
                                            <div className="rs-request-field">
                                                <label>Resume Type</label>
                                                <select
                                                    value={requestForm.documentType}
                                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, documentType: e.target.value }))}
                                                >
                                                    <option>Technical Resume (Engineering)</option>
                                                    <option>Executive Profile (Management)</option>
                                                    <option>Full Academic CV</option>
                                                    <option>Creative Portfolio Resume</option>
                                                    <option>One-Page Hybrid Resume</option>
                                                </select>
                                            </div>
                                            <div className="rs-request-field rs-request-field-full">
                                                <label>Reason of Download Resume</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Write reason for download"
                                                    value={requestForm.reason}
                                                    onChange={(e) => setRequestForm((prev) => ({ ...prev, reason: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            className="rs-primary-btn"
                                            onClick={handleRequest}
                                            disabled={isSubmitting || requestLocked}
                                        >
                                            {isSubmitting ? 'Submitting...' : 'REQUEST CLEARANCE'}
                                        </button>

                                        {status !== 'idle' && status !== 'pending' && (
                                            <div className={`rs-status-tag status-${status}`}>
                                                {status === 'approved' && 'Approved'}
                                                {status === 'rejected' && 'Rejected'}
                                                {status === 'expired' && 'Expired'}
                                                {status === 'not_found' && 'No Request Found'}
                                            </div>
                                        )}

                                        {status === 'pending' && (
                                            <div className="rs-status-note">Request received. Waiting for admin approval.</div>
                                        )}

                                        {!!lastRequestId && (
                                            <div className="rs-request-id">Request ID: {lastRequestId}</div>
                                        )}

                                        {!!lastRequestId && (
                                            <button
                                                className="rs-secondary-btn"
                                                onClick={() => {
                                                    setActivePanel('status')
                                                    setStatusEmail(requestForm.email.trim())
                                                    handleManualCheckStatus()
                                                }}
                                            >
                                                Data Sent to Admin · Check Status
                                            </button>
                                        )}

                                        {isUnlocked && token && (
                                            <button className="rs-secondary-btn" onClick={handleDownload}>
                                                Download Resume
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="rs-detail-title">Status Details</div>

                                        <div className="rs-request-field">
                                            <label>Email ID</label>
                                            <input
                                                type="email"
                                                placeholder="Enter email for status"
                                                value={statusEmail}
                                                onChange={(e) => setStatusEmail(e.target.value)}
                                            />
                                        </div>

                                        <button className={`rs-secondary-btn rs-check-btn ${isChecking ? 'is-checking' : ''}`} onClick={handleManualCheckStatus} disabled={isChecking}>
                                            {isChecking ? 'Checking...' : 'CHECK REQUEST STATUS'}
                                        </button>

                                        {!!historyEmail && historyEmail === statusEmail.trim() && (
                                            <div className="rs-request-count">Recent Requests: {requestHistory.length}</div>
                                        )}

                                        {status !== 'idle' && status !== 'pending' ? (
                                            <div className={`rs-status-tag status-${status}`}>
                                                {status === 'approved' && 'Approved'}
                                                {status === 'rejected' && 'Rejected'}
                                                {status === 'expired' && 'Expired'}
                                                {status === 'not_found' && 'No Request Found'}
                                            </div>
                                        ) : status === 'pending' ? (
                                            <div className="rs-status-note">Request found. Waiting for admin approval.</div>
                                        ) : (
                                            <div className="rs-request-history-empty">Enter email and click check status.</div>
                                        )}

                                        {isUnlocked && token && (
                                            <button className="rs-secondary-btn" onClick={handleDownload}>
                                                Download Resume
                                            </button>
                                        )}

                                        {!!historyEmail && historyEmail === statusEmail.trim() && (
                                            <div className="rs-request-history-box">
                                                <div className="rs-request-history-head">
                                                    <span>Recent Request Details</span>
                                                    <span>{requestHistory.length}</span>
                                                </div>
                                                {!historyLoaded ? (
                                                    <div className="rs-request-history-empty">History sync ho rahi hai...</div>
                                                ) : requestHistory.length === 0 ? (
                                                    <div className="rs-request-history-empty">No request found for this email.</div>
                                                ) : (
                                                    <div className="rs-request-history-list">
                                                        {requestHistory.slice(0, 6).map((item, index) => (
                                                            <div key={item.id || `${item.created_at || 'req'}-${index}`} className="rs-request-history-item">
                                                                <span className={`rs-history-status rs-history-status-${item.status || 'pending'}`}>
                                                                    {(item.status || 'pending').toUpperCase()}
                                                                </span>
                                                                <span className="rs-history-type">{item.resume_type || 'Resume Request'}</span>
                                                                <span className="rs-history-time">{formatRequestTime(item.created_at)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
