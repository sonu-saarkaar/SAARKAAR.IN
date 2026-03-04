import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import BrandLogo from '../../components/BrandLogo'
import Sidebar from './components/Sidebar'
import './AdminApp.css'

const ADMIN_TOKEN_KEY = 'saarkaar_admin_token'

const emptyProjectForm = {
    title: '',
    description: '',
    longStory: '',
    vision: '',
    techStack: '',
    status: 'upcoming',
    teamMembers: '',
    images: [],
    liveUrl: '',
    appUrl: '',
    progressPercentage: 0,
}

const defaultSystemConfig = {
    maintenanceMode: false,
    aiEnabled: true,
    voiceEnabled: true,
    heroText: '',
    contactEmail: '',
    themeColor: '#D4AF37',
}

export default function AdminApp() {
    const explicitApiUrl = import.meta.env.VITE_API_URL
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const API_URL = explicitApiUrl || (backendUrl ? (backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`) : '/api')

    const [token, setToken] = useState(localStorage.getItem(ADMIN_TOKEN_KEY) || '')
    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [loginForm, setLoginForm] = useState({ username: '', password: '' })

    const [summary, setSummary] = useState(null)
    const [sessions, setSessions] = useState([])
    const [selectedSession, setSelectedSession] = useState('')
    const [messages, setMessages] = useState([])
    const [projects, setProjects] = useState([])
    const [resumes, setResumes] = useState([])
    const [health, setHealth] = useState(null)
    const [healthHistory, setHealthHistory] = useState([])
    const [users, setUsers] = useState([])
    const [content, setContent] = useState({})
    const [media, setMedia] = useState([])
    const [maintenance, setMaintenance] = useState(null)
    const [aiConfig, setAiConfig] = useState(null)
    const [analytics, setAnalytics] = useState(null)
    const [security, setSecurity] = useState(null)
    const [activity, setActivity] = useState([])
    const [systemConfig, setSystemConfig] = useState(defaultSystemConfig)

    const [editorMode, setEditorMode] = useState('create')
    const [editingProjectId, setEditingProjectId] = useState('')
    const [projectForm, setProjectForm] = useState(emptyProjectForm)

    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: API_URL,
            headers: { 'Content-Type': 'application/json' },
        })
        instance.interceptors.request.use((config) => {
            const authToken = localStorage.getItem(ADMIN_TOKEN_KEY)
            if (authToken) config.headers.Authorization = `Bearer ${authToken}`
            return config
        })
        return instance
    }, [API_URL])

    const toCsvList = (value) => Array.isArray(value) ? value.join(', ') : ''
    const parseCsv = (value) => (value || '').split(',').map(x => x.trim()).filter(Boolean)

    const normalizeProjectToForm = (project) => ({
        title: project.title || '',
        description: project.description || '',
        longStory: project.longStory || project.solution || '',
        vision: project.vision || '',
        techStack: toCsvList(project.techStack || project.tech_stack || []),
        status: project.status || 'upcoming',
        teamMembers: toCsvList(project.teamMembers || []),
        images: Array.isArray(project.images) ? project.images : (project.gallery || []),
        liveUrl: project.liveUrl || project.live_link || '',
        appUrl: project.appUrl || '',
        progressPercentage: project.progressPercentage ?? 0,
    })

    const buildProjectPayload = () => ({
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        longStory: projectForm.longStory.trim(),
        vision: projectForm.vision.trim(),
        techStack: parseCsv(projectForm.techStack),
        status: projectForm.status,
        teamMembers: parseCsv(projectForm.teamMembers),
        images: projectForm.images,
        liveUrl: projectForm.liveUrl.trim() || null,
        appUrl: projectForm.appUrl.trim() || null,
        progressPercentage: Number(projectForm.progressPercentage || 0),
    })

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const payload = {
                username: loginForm.username.trim(),
                password: loginForm.password,
            }
            const res = await api.post('/admin/login', payload)
            const nextToken = res.data?.token || ''
            if (!nextToken) throw new Error('Token not received')
            localStorage.setItem(ADMIN_TOKEN_KEY, nextToken)
            setToken(nextToken)
            setLoginForm({ username: '', password: '' })
        } catch (err) {
            if (err?.response?.data?.detail) {
                setError(err.response.data.detail)
            } else if (err?.request) {
                setError('Backend unreachable. Please start backend on http://localhost:8000 and retry.')
            } else {
                setError('Login failed')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        setToken('')
        setSummary(null)
        setSessions([])
        setProjects([])
        setResumes([])
    }

    const loadSummary = async () => setSummary((await api.get('/admin/dashboard/summary')).data)
    const loadSessions = async () => setSessions((await api.get('/admin/conversations/sessions?limit=120')).data || [])
    const loadMessages = async (sid = selectedSession) => {
        if (!sid) return setMessages([])
        setMessages(((await api.get(`/admin/conversations?session_id=${encodeURIComponent(sid)}&limit=200`)).data || []).reverse())
    }
    const loadProjects = async () => setProjects((await api.get('/projects/')).data || [])
    const loadResumes = async () => setResumes((await api.get('/admin/resume-requests')).data || [])
    const loadUsers = async () => setUsers((await api.get('/admin/users')).data || [])
    const loadContent = async () => setContent((await api.get('/admin/content')).data || {})
    const loadMedia = async () => setMedia((await api.get('/admin/media')).data || [])
    const loadMaintenance = async () => setMaintenance((await api.get('/admin/maintenance')).data)
    const loadAiConfig = async () => setAiConfig((await api.get('/admin/ai-config')).data)
    const loadAnalytics = async () => setAnalytics((await api.get('/admin/analytics')).data)
    const loadSecurity = async () => setSecurity((await api.get('/admin/security')).data)
    const loadActivity = async () => setActivity((await api.get('/admin/activity')).data || [])
    const loadSystemConfig = async () => setSystemConfig((await api.get('/admin/system-config')).data || defaultSystemConfig)
    const loadHealth = async () => {
        const [hRes, histRes] = await Promise.all([api.get('/admin/health'), api.get('/admin/health/history?limit=20')])
        setHealth(hRes.data)
        setHealthHistory(histRes.data || [])
    }

    const loadAll = async () => {
        setError('')
        setLoading(true)
        const criticalLoads = [
            { name: 'summary', run: loadSummary },
            { name: 'projects', run: loadProjects },
            { name: 'resumes', run: loadResumes },
        ]

        const optionalLoads = [
            { name: 'health', run: loadHealth },
            { name: 'users', run: loadUsers },
            { name: 'content', run: loadContent },
            { name: 'media', run: loadMedia },
            { name: 'maintenance', run: loadMaintenance },
            { name: 'ai-config', run: loadAiConfig },
            { name: 'analytics', run: loadAnalytics },
            { name: 'security', run: loadSecurity },
            { name: 'activity', run: loadActivity },
            { name: 'system-config', run: loadSystemConfig },
        ]

        const criticalResults = await Promise.allSettled(criticalLoads.map(item => item.run()))
        const criticalFailure = criticalResults.find(r => r.status === 'rejected')

        if (criticalFailure) {
            if (criticalFailure.reason?.response?.status === 401) {
                handleLogout()
                setError('Session expired. Please login again.')
                setLoading(false)
                return
            }
            console.warn('[Admin] Critical module failed during initial load', criticalFailure.reason)
        }

        const optionalResults = await Promise.allSettled(optionalLoads.map(item => item.run()))
        optionalResults.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.warn(`[Admin] Optional module failed: ${optionalLoads[index].name}`, result.reason)
            }
        })

        setLoading(false)
    }

    useEffect(() => {
        if (token) loadAll()
    }, [token])

    useEffect(() => {
        if (token && selectedSession) loadMessages(selectedSession)
    }, [selectedSession, token])

    const updateResumeStatus = async (id, nextStatus, payload = {}) => {
        try {
            if (nextStatus === 'reject') {
                const reason = prompt('Enter rejection reason:')
                if (reason === null) return
                if (reason.trim()) payload.reason = reason
            }
            await api.post(`/admin/resume-requests/${id}/${nextStatus}`, payload)
            await loadResumes()
            await loadSummary()
        } catch (err) {
            setError(err?.response?.data?.detail || `Unable to ${nextStatus} request`)
        }
    }

    const resetProjectEditor = () => {
        setEditorMode('create')
        setEditingProjectId('')
        setProjectForm(emptyProjectForm)
    }

    const handleEditProject = (project) => {
        setEditorMode('update')
        setEditingProjectId(project.id)
        setProjectForm(normalizeProjectToForm(project))
    }

    const handleSaveProject = async () => {
        setError('')
        const payload = buildProjectPayload()
        if (!payload.title || !payload.description) {
            setError('Title and description are required')
            return
        }
        try {
            if (editorMode === 'update' && editingProjectId) {
                await api.put(`/projects/${editingProjectId}`, payload)
            } else {
                await api.post('/projects/', payload)
            }
            await loadProjects()
            await loadSummary()
            resetProjectEditor()
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to save project')
        }
    }

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Delete this project permanently?')) return
        try {
            await api.delete(`/projects/${projectId}`)
            await loadProjects()
            await loadSummary()
            if (editingProjectId === projectId) resetProjectEditor()
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to delete project')
        }
    }

    const handleProjectStatusToggle = async (project) => {
        const nextStatus = project.status === 'live' ? 'private' : 'live'
        try {
            await api.put(`/projects/${project.id}`, { status: nextStatus })
            await loadProjects()
        } catch (err) {
            setError(err?.response?.data?.detail || 'Status update failed')
        }
    }

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            if (res.data?.url) {
                setProjectForm(prev => ({ ...prev, images: [...prev.images, res.data.url] }))
            }
        } catch (err) {
            setError(err?.response?.data?.detail || 'Image upload failed')
        } finally {
            event.target.value = ''
        }
    }

    const removeImage = (idx) => {
        setProjectForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
    }

    const saveContent = async () => {
        try {
            await api.put('/admin/content', { content })
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to save content')
        }
    }

    const saveMaintenance = async () => {
        try {
            await api.put('/admin/maintenance', maintenance)
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to save maintenance config')
        }
    }

    const saveAiConfig = async () => {
        try {
            await api.put('/admin/ai-config', aiConfig)
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to save AI config')
        }
    }

    const saveSystemConfig = async () => {
        try {
            await api.put('/admin/system-config', systemConfig)
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to save system config')
        }
    }

    if (!token) {
        return (
            <div className="admin-login-layout">
                <div className="admin-login-card">
                    <BrandLogo size="md" />
                    <h1>SAARKAAR Control Panel</h1>
                    <p>Restricted Access - Enterprise Admins Only</p>
                    <form className="admin-login-form" onSubmit={handleLogin}>
                        <input
                            placeholder="Admin ID / Username"
                            value={loginForm.username}
                            onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Security Key"
                            value={loginForm.password}
                            onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                        />
                        {error && <div className="admin-error">{error}</div>}
                        <button type="submit" disabled={loading}>{loading ? 'Authenticating...' : 'Secure Login'}</button>
                    </form>
                    <div className="admin-note">Default credentials (if unchanged): admin / admin123</div>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-layout">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

            <main className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1').trim()}</h2>
                        <div className="admin-header-subtitle">SAARKAAR Enterprise Hub</div>
                    </div>
                    <div className="admin-header-actions">
                        {loading && <span className="loading-badge">Refreshing Data...</span>}
                        <button onClick={loadAll} className="outline-btn">Refresh Module</button>
                        <div className="admin-avatar">A</div>
                    </div>
                </header>

                <section className="admin-content">
                    {error && <div className="admin-error global">{error}</div>}

                    {activeTab === 'dashboard' && (
                        <div className="admin-grid overview-grid">
                            <SummaryCard title="Projects" value={summary?.projects ?? '-'} icon="📁" />
                            <SummaryCard title="Total Chat Logs" value={summary?.chat_logs ?? '-'} icon="💬" />
                            <SummaryCard title="Chat Logs (24h)" value={summary?.chat_logs_last_24h ?? '-'} icon="⚡" />
                            <SummaryCard title="Resume Requests" value={summary?.resume_requests ?? '-'} icon="📄" />
                            <SummaryCard title="Pending Requests" value={summary?.pending_resume_requests ?? '-'} icon="⏳" highlight />
                        </div>
                    )}

                    {activeTab === 'resumes' && (
                        <div className="admin-card full-width">
                            <div className="card-header">
                                <h3>Resume Access Requests</h3>
                                <span className="badge">{resumes.length} total</span>
                            </div>
                            <div className="table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th><th>Email</th><th>Org / Contact</th><th>Type Requested</th><th>Status</th><th>Date</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resumes.map(req => (
                                            <tr key={req.id || req._id}>
                                                <td><div className="fw-600">{req.name}</div>{req.reason && <div className="rs-reason">Reason: {req.reason}</div>}</td>
                                                <td>{req.email}</td>
                                                <td className="text-muted">{req.organization || '-'} <br /> {req.contact_number || '-'}</td>
                                                <td><span className="pill badge-dark">{req.resume_type}</span></td>
                                                <td><span className={`pill status-${req.status}`}>{req.status.toUpperCase()}</span></td>
                                                <td className="time-cell">{req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
                                                <td>
                                                    {req.status === 'pending' ? (
                                                        <div className="inline-actions">
                                                            <button className="sm-btn success" onClick={() => updateResumeStatus(req.id || req._id, 'approve')}>Approve</button>
                                                            <button className="sm-btn danger" onClick={() => updateResumeStatus(req.id || req._id, 'reject')}>Reject</button>
                                                        </div>
                                                    ) : <span className="text-muted">No actions</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {resumes.length === 0 && <tr><td colSpan={7} className="text-center text-muted">No resume requests found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="admin-split-layout">
                            <div className="admin-card history-sessions">
                                <h3>Chat Sessions</h3>
                                <div className="session-list custom-scroll">
                                    {sessions.map(session => (
                                        <button
                                            key={session.session_id}
                                            className={`session-item ${selectedSession === session.session_id ? 'active' : ''}`}
                                            onClick={() => setSelectedSession(session.session_id)}
                                        >
                                            <div className="session-id">{session.session_id}</div>
                                            <div className="session-meta">{session.message_count} msgs • {new Date(session.last_seen).toLocaleString()}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="admin-card history-messages">
                                <h3>Message Log</h3>
                                {!selectedSession ? (
                                    <div className="admin-empty">Select a session to view detailed transcript.</div>
                                ) : (
                                    <div className="message-log custom-scroll">
                                        {messages.map((msg, i) => (
                                            <div key={msg._id || i} className="message-item">
                                                <div className="msg-user"><span className="msg-tag">USER</span><span>{msg.user_message}</span></div>
                                                <div className="msg-ai"><span className="msg-tag">AI</span><span>{msg.assistant_response}</span></div>
                                                <div className="msg-meta">{new Date(msg.created_at).toLocaleString()} • Model/Partner: {msg.current_partner || 'unknown'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'portfolio' && (
                        <div className="admin-grid" style={{ gridTemplateColumns: '1.1fr 1fr' }}>
                            <div className="admin-card">
                                <div className="card-header"><h3>Projects</h3><span className="badge">{projects.length}</span></div>
                                <div className="session-list custom-scroll" style={{ maxHeight: 620 }}>
                                    {projects.map(project => (
                                        <div key={project.id} className="session-item" style={{ alignItems: 'stretch' }}>
                                            <div>
                                                <div className="session-id">{project.title}</div>
                                                <div className="session-meta">{project.status} • {project.progressPercentage ?? 0}%</div>
                                            </div>
                                            <div className="inline-actions" style={{ marginTop: 8 }}>
                                                <button className="sm-btn" onClick={() => handleEditProject(project)}>Edit</button>
                                                <button className="sm-btn" onClick={() => handleProjectStatusToggle(project)}>{project.status === 'live' ? 'Make Private' : 'Make Live'}</button>
                                                <button className="sm-btn danger" onClick={() => handleDeleteProject(project.id)}>Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                    {projects.length === 0 && <div className="admin-empty">No projects found.</div>}
                                </div>
                            </div>

                            <div className="admin-card">
                                <div className="card-header">
                                    <h3>{editorMode === 'create' ? 'Create Project' : 'Update Project'}</h3>
                                    {editorMode === 'update' && <button className="outline-btn" onClick={resetProjectEditor}>New</button>}
                                </div>

                                <div className="settings-form" style={{ display: 'grid', gap: 10 }}>
                                    <input className="admin-input" placeholder="Title" value={projectForm.title} onChange={e => setProjectForm(prev => ({ ...prev, title: e.target.value }))} />
                                    <textarea className="admin-input" placeholder="Description" value={projectForm.description} onChange={e => setProjectForm(prev => ({ ...prev, description: e.target.value }))} />
                                    <textarea className="admin-input" placeholder="Long Story" value={projectForm.longStory} onChange={e => setProjectForm(prev => ({ ...prev, longStory: e.target.value }))} />
                                    <textarea className="admin-input" placeholder="Vision" value={projectForm.vision} onChange={e => setProjectForm(prev => ({ ...prev, vision: e.target.value }))} />
                                    <input className="admin-input" placeholder="Tech Stack (comma separated)" value={projectForm.techStack} onChange={e => setProjectForm(prev => ({ ...prev, techStack: e.target.value }))} />
                                    <input className="admin-input" placeholder="Team Members (comma separated)" value={projectForm.teamMembers} onChange={e => setProjectForm(prev => ({ ...prev, teamMembers: e.target.value }))} />
                                    <select className="admin-input" value={projectForm.status} onChange={e => setProjectForm(prev => ({ ...prev, status: e.target.value }))}>
                                        <option value="live">live</option>
                                        <option value="sold">sold</option>
                                        <option value="upcoming">upcoming</option>
                                        <option value="private">private</option>
                                    </select>
                                    <input className="admin-input" type="number" min="0" max="100" placeholder="Progress %" value={projectForm.progressPercentage} onChange={e => setProjectForm(prev => ({ ...prev, progressPercentage: e.target.value }))} />
                                    <input className="admin-input" placeholder="Live URL" value={projectForm.liveUrl} onChange={e => setProjectForm(prev => ({ ...prev, liveUrl: e.target.value }))} />
                                    <input className="admin-input" placeholder="App URL" value={projectForm.appUrl} onChange={e => setProjectForm(prev => ({ ...prev, appUrl: e.target.value }))} />
                                    <input className="admin-input" type="file" accept="image/*" onChange={handleImageUpload} />

                                    {projectForm.images.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                            {projectForm.images.map((src, idx) => (
                                                <div key={`${src}-${idx}`} style={{ position: 'relative' }}>
                                                    <img src={src} alt="preview" style={{ width: '100%', borderRadius: 6, height: 70, objectFit: 'cover' }} />
                                                    <button className="sm-btn danger" style={{ position: 'absolute', top: 4, right: 4 }} onClick={() => removeImage(idx)}>x</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="inline-actions">
                                        <button className="sm-btn success" onClick={handleSaveProject}>{editorMode === 'create' ? 'Save' : 'Update'}</button>
                                        {editorMode === 'update' && <button className="sm-btn" onClick={resetProjectEditor}>Cancel</button>}
                                    </div>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    <h4>Live Preview</h4>
                                    <div className="admin-card" style={{ padding: 12 }}>
                                        <div className="fw-600">{projectForm.title || 'Untitled Project'}</div>
                                        <div className="text-muted" style={{ marginTop: 4 }}>{projectForm.description || 'Project description preview'}</div>
                                        <div className="session-meta" style={{ marginTop: 6 }}>Status: {projectForm.status} • {projectForm.progressPercentage || 0}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>Users</h3><span className="badge">{users.length}</span></div>
                            <div className="table-wrap">
                                <table className="admin-table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Tag</th><th>Conversations</th></tr></thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.status}</td><td>{user.tag}</td><td>{user.conversation_count || 0}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>Content Manager</h3><button className="outline-btn" onClick={saveContent}>Save</button></div>
                            <textarea className="admin-input" rows={18} value={JSON.stringify(content, null, 2)} onChange={e => {
                                try { setContent(JSON.parse(e.target.value)) } catch (_) {}
                            }} />
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>Media Library</h3><span className="badge">{media.length}</span></div>
                            <div className="table-wrap">
                                <table className="admin-table">
                                    <thead><tr><th>Name</th><th>Type</th><th>URL</th></tr></thead>
                                    <tbody>{media.map(asset => <tr key={asset._id}><td>{asset.name}</td><td>{asset.type}</td><td>{asset.url}</td></tr>)}</tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'health' && (
                        <div className="admin-grid overview-grid">
                            <SummaryCard title="Status" value={health?.status || '-'} />
                            <SummaryCard title="DB" value={health?.db_connected ? 'connected' : 'down'} />
                            <SummaryCard title="Uptime (s)" value={Math.round(health?.uptime_seconds || 0)} />
                            <SummaryCard title="Snapshots" value={healthHistory.length} />
                        </div>
                    )}

                    {activeTab === 'maintenance' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>Maintenance</h3><button className="outline-btn" onClick={saveMaintenance}>Update</button></div>
                            <div className="settings-form">
                                <label><input type="checkbox" checked={!!maintenance?.enabled} onChange={e => setMaintenance(prev => ({ ...prev, enabled: e.target.checked }))} /> Enabled</label>
                                <textarea className="admin-input" rows={4} value={maintenance?.message || ''} onChange={e => setMaintenance(prev => ({ ...prev, message: e.target.value }))} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'ai' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>AI Configuration</h3><button className="outline-btn" onClick={saveAiConfig}>Update</button></div>
                            <div className="settings-form" style={{ display: 'grid', gap: 10 }}>
                                <input className="admin-input" value={aiConfig?.model || ''} onChange={e => setAiConfig(prev => ({ ...prev, model: e.target.value }))} placeholder="Model" />
                                <input className="admin-input" type="number" value={aiConfig?.temperature ?? 0.7} onChange={e => setAiConfig(prev => ({ ...prev, temperature: Number(e.target.value) }))} placeholder="Temperature" />
                                <input className="admin-input" type="number" value={aiConfig?.token_limit ?? 600} onChange={e => setAiConfig(prev => ({ ...prev, token_limit: Number(e.target.value) }))} placeholder="Token limit" />
                                <label><input type="checkbox" checked={!!aiConfig?.voice_enabled} onChange={e => setAiConfig(prev => ({ ...prev, voice_enabled: e.target.checked }))} /> Voice Enabled</label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>Analytics</h3></div>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(analytics || {}, null, 2)}</pre>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>Security</h3></div>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(security || {}, null, 2)}</pre>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>Admin Activity Logs</h3><span className="badge">{activity.length}</span></div>
                            <div className="table-wrap">
                                <table className="admin-table">
                                    <thead><tr><th>Admin</th><th>Action</th><th>Meta</th><th>At</th></tr></thead>
                                    <tbody>{activity.map((row, idx) => <tr key={row._id || idx}><td>{row.admin}</td><td>{row.action}</td><td>{JSON.stringify(row.meta || {})}</td><td>{row.created_at ? new Date(row.created_at).toLocaleString() : '-'}</td></tr>)}</tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="admin-card full-width">
                            <div className="card-header"><h3>System Configuration</h3><button className="outline-btn" onClick={saveSystemConfig}>Update</button></div>
                            <div className="settings-form" style={{ display: 'grid', gap: 10 }}>
                                <label><input type="checkbox" checked={!!systemConfig.maintenanceMode} onChange={e => setSystemConfig(prev => ({ ...prev, maintenanceMode: e.target.checked }))} /> Maintenance Mode</label>
                                <label><input type="checkbox" checked={!!systemConfig.aiEnabled} onChange={e => setSystemConfig(prev => ({ ...prev, aiEnabled: e.target.checked }))} /> AI Enabled</label>
                                <label><input type="checkbox" checked={!!systemConfig.voiceEnabled} onChange={e => setSystemConfig(prev => ({ ...prev, voiceEnabled: e.target.checked }))} /> Voice Enabled</label>
                                <input className="admin-input" value={systemConfig.heroText || ''} onChange={e => setSystemConfig(prev => ({ ...prev, heroText: e.target.value }))} placeholder="Hero text" />
                                <input className="admin-input" value={systemConfig.contactEmail || ''} onChange={e => setSystemConfig(prev => ({ ...prev, contactEmail: e.target.value }))} placeholder="Contact email" />
                                <input className="admin-input" value={systemConfig.themeColor || '#D4AF37'} onChange={e => setSystemConfig(prev => ({ ...prev, themeColor: e.target.value }))} placeholder="Theme color" />
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

function SummaryCard({ title, value, icon, highlight }) {
    return (
        <div className={`admin-card stat-card ${highlight ? 'highlight-border' : ''}`}>
            <div className="stat-header">
                <span className="stat-title">{title}</span>
                {icon && <span className="stat-icon">{icon}</span>}
            </div>
            <div className="stat-value">{value}</div>
        </div>
    )
}
