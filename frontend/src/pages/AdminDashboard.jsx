import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './AdminDashboard.css'

const ADMIN_TOKEN_KEY = 'saarkaar_admin_token'

const tabs = [
  { id: 'summary', label: 'Summary' },
  { id: 'history', label: 'History' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'resumes', label: 'Resumes' },
  { id: 'health', label: 'Health' },
]

export default function AdminDashboard() {
  const explicitApiUrl = import.meta.env.VITE_API_URL
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const API_URL = explicitApiUrl || (backendUrl ? (backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`) : '/api')

  const [token, setToken] = useState(localStorage.getItem(ADMIN_TOKEN_KEY) || '')
  const [activeTab, setActiveTab] = useState('summary')
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

  const [editorMode, setEditorMode] = useState('create')
  const [editingProjectId, setEditingProjectId] = useState('')
  const [projectForm, setProjectForm] = useState({
    title: '',
    tagline: '',
    category: '',
    description: '',
    vision: '',
    status: 'Active',
    tech_stack: '',
    problem_statement: '',
    solution: '',
    features: '',
    gallery: '',
    live_link: '',
    client_info: '',
    timeline: '',
    badge: '',
    gradient: '',
  })

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    instance.interceptors.request.use((config) => {
      const authToken = localStorage.getItem(ADMIN_TOKEN_KEY)
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`
      }
      return config
    })

    return instance
  }, [API_URL])

  const parseList = (value) => value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const mapProjectToForm = (project) => ({
    title: project.title || '',
    tagline: project.tagline || '',
    category: project.category || '',
    description: project.description || '',
    vision: project.vision || '',
    status: project.status || 'Active',
    tech_stack: (project.tech_stack || []).join(', '),
    problem_statement: project.problem_statement || '',
    solution: project.solution || '',
    features: (project.features || []).join(', '),
    gallery: (project.gallery || []).join(', '),
    live_link: project.live_link || '',
    client_info: project.client_info || '',
    timeline: project.timeline || '',
    badge: project.badge || '',
    gradient: project.gradient || '',
  })

  const resetProjectForm = () => {
    setEditorMode('create')
    setEditingProjectId('')
    setProjectForm({
      title: '',
      tagline: '',
      category: '',
      description: '',
      vision: '',
      status: 'Active',
      tech_stack: '',
      problem_statement: '',
      solution: '',
      features: '',
      gallery: '',
      live_link: '',
      client_info: '',
      timeline: '',
      badge: '',
      gradient: '',
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/admin/login', loginForm)
      const nextToken = res.data?.token || ''
      if (!nextToken) throw new Error('Token not received')
      localStorage.setItem(ADMIN_TOKEN_KEY, nextToken)
      setToken(nextToken)
      setLoginForm({ username: '', password: '' })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setToken('')
    setSummary(null)
    setSessions([])
    setMessages([])
    setProjects([])
    setResumes([])
    setHealth(null)
    setHealthHistory([])
    resetProjectForm()
  }

  const loadSummary = async () => {
    const res = await api.get('/admin/dashboard/summary')
    setSummary(res.data)
  }

  const loadSessions = async () => {
    const res = await api.get('/admin/conversations/sessions?limit=120')
    setSessions(res.data || [])
  }

  const loadMessages = async (sessionId = selectedSession) => {
    if (!sessionId) {
      setMessages([])
      return
    }
    const res = await api.get(`/admin/conversations?session_id=${encodeURIComponent(sessionId)}&limit=200`)
    setMessages((res.data || []).reverse())
  }

  const loadProjects = async () => {
    const res = await api.get('/admin/portfolio')
    setProjects(res.data || [])
  }

  const loadResumes = async () => {
    const res = await api.get('/admin/resume-requests')
    setResumes(res.data || [])
  }

  const loadHealth = async () => {
    const [healthRes, historyRes] = await Promise.all([
      api.get('/admin/health'),
      api.get('/admin/health/history?limit=20'),
    ])
    setHealth(healthRes.data)
    setHealthHistory(historyRes.data || [])
  }

  const loadAll = async () => {
    setError('')
    setLoading(true)
    const results = await Promise.allSettled([
      loadSummary(),
      loadSessions(),
      loadProjects(),
      loadResumes(),
      loadHealth(),
    ])

    const firstRejection = results.find((r) => r.status === 'rejected')
    if (firstRejection) {
      const reason = firstRejection.reason
      if (reason?.response?.status === 401) {
        handleLogout()
        setError('Session expired. Please login again.')
      } else {
        setError('Some admin sections are unavailable right now. Partial data loaded.')
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!token) return
    loadAll()
  }, [token])

  useEffect(() => {
    if (!token || !selectedSession) return
    loadMessages(selectedSession)
  }, [selectedSession, token])

  const handleSaveProject = async (e) => {
    e.preventDefault()
    setError('')

    const payload = {
      title: projectForm.title,
      tagline: projectForm.tagline,
      category: projectForm.category,
      description: projectForm.description,
      vision: projectForm.vision || null,
      status: projectForm.status,
      tech_stack: parseList(projectForm.tech_stack),
      problem_statement: projectForm.problem_statement,
      solution: projectForm.solution,
      features: parseList(projectForm.features),
      gallery: parseList(projectForm.gallery),
      live_link: projectForm.live_link || null,
      client_info: projectForm.client_info || null,
      timeline: projectForm.timeline || null,
      badge: projectForm.badge || null,
      gradient: projectForm.gradient || null,
    }

    try {
      if (editorMode === 'edit' && editingProjectId) {
        await api.put(`/admin/portfolio/${editingProjectId}`, payload)
      } else {
        await api.post('/admin/portfolio', payload)
      }
      await loadProjects()
      await loadSummary()
      resetProjectForm()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to save project')
    }
  }

  const startEditProject = (project) => {
    setEditorMode('edit')
    setEditingProjectId(project.id)
    setProjectForm(mapProjectToForm(project))
    setActiveTab('portfolio')
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this portfolio project?')) return
    try {
      await api.delete(`/admin/portfolio/${projectId}`)
      await loadProjects()
      await loadSummary()
      if (editingProjectId === projectId) resetProjectForm()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to delete project')
    }
  }

  const updateResumeStatus = async (id, nextStatus) => {
    try {
      await api.post(`/admin/resume-requests/${id}/${nextStatus}`)
      await loadResumes()
      await loadSummary()
    } catch (err) {
      setError(err?.response?.data?.detail || `Unable to ${nextStatus} request`)
    }
  }

  if (!token) {
    return (
      <div className="admin-dashboard-container">
        <div className="admin-login-card">
          <h1>SAARKAAR Admin Panel</h1>
          <p>Login to manage portfolio, user conversation history, resume requests, and system health.</p>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <input
              placeholder="Admin username"
              value={loginForm.username}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
            {error && <div className="admin-error">{error}</div>}
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          </form>
          <div className="admin-note">Default credentials (if not changed in env): admin / admin123</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-topbar">
        <div>
          <h1>SAARKAAR // Admin Control Center</h1>
          <p>Website history, user conversations, editable portfolio, resume control, and health system</p>
        </div>
        <div className="admin-topbar-actions">
          <button onClick={loadAll}>Refresh</button>
          <button className="danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="admin-error global">{error}</div>}

      {activeTab === 'summary' && (
        <div className="admin-grid summary-grid">
          <SummaryCard title="Projects" value={summary?.projects ?? '-'} />
          <SummaryCard title="Chat Logs" value={summary?.chat_logs ?? '-'} />
          <SummaryCard title="Chat Logs (24h)" value={summary?.chat_logs_last_24h ?? '-'} />
          <SummaryCard title="Resume Requests" value={summary?.resume_requests ?? '-'} />
          <SummaryCard title="Pending Requests" value={summary?.pending_resume_requests ?? '-'} />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="admin-grid history-grid">
          <div className="admin-card">
            <h3>Sessions</h3>
            <div className="session-list">
              {sessions.map((session) => (
                <button
                  key={session.session_id}
                  className={selectedSession === session.session_id ? 'session-item active' : 'session-item'}
                  onClick={() => setSelectedSession(session.session_id)}
                >
                  <div className="session-id">{session.session_id}</div>
                  <div className="session-meta">{session.message_count} msgs • {new Date(session.last_seen).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h3>Conversation History</h3>
            {!selectedSession ? (
              <div className="admin-empty">Select a session to view message history.</div>
            ) : (
              <div className="message-log">
                {messages.map((msg) => (
                  <div key={msg._id || `${msg.created_at}-${msg.user_message}`} className="message-item">
                    <div><strong>User:</strong> {msg.user_message}</div>
                    <div><strong>AI:</strong> {msg.assistant_response}</div>
                    <div className="message-meta">{new Date(msg.created_at).toLocaleString()} • {msg.current_partner || 'unknown'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="admin-grid portfolio-grid">
          <div className="admin-card">
            <h3>{editorMode === 'edit' ? 'Edit Project' : 'Create Project'}</h3>
            <form className="admin-form" onSubmit={handleSaveProject}>
              {Object.keys(projectForm).map((field) => (
                <label key={field}>
                  <span>{field}</span>
                  {['description', 'vision', 'problem_statement', 'solution'].includes(field) ? (
                    <textarea
                      value={projectForm[field]}
                      onChange={(e) => setProjectForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      rows={3}
                    />
                  ) : (
                    <input
                      value={projectForm[field]}
                      onChange={(e) => setProjectForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      required={['title', 'tagline', 'category', 'description', 'status', 'tech_stack', 'problem_statement', 'solution', 'features'].includes(field)}
                    />
                  )}
                </label>
              ))}
              <div className="inline-actions">
                <button type="submit">{editorMode === 'edit' ? 'Update Project' : 'Create Project'}</button>
                {editorMode === 'edit' && (
                  <button type="button" className="muted" onClick={resetProjectForm}>Cancel Edit</button>
                )}
              </div>
            </form>
          </div>

          <div className="admin-card">
            <h3>Portfolio Projects ({projects.length})</h3>
            <div className="project-list">
              {projects.map((project) => (
                <div key={project.id} className="project-item">
                  <div>
                    <div className="project-title">{project.title}</div>
                    <div className="project-meta">{project.category} • {project.status}</div>
                  </div>
                  <div className="inline-actions">
                    <button onClick={() => startEditProject(project)}>Edit</button>
                    <button className="danger" onClick={() => handleDeleteProject(project.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'resumes' && (
        <div className="admin-card">
          <h3>Resume Access Requests</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((req) => (
                  <tr key={req.id || req._id}>
                    <td>{req.name}</td>
                    <td>{req.email}</td>
                    <td>{req.resume_type}</td>
                    <td>{req.status}</td>
                    <td>{req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
                    <td>
                      <div className="inline-actions">
                        <button onClick={() => updateResumeStatus(req.id || req._id, 'approve')}>Approve</button>
                        <button className="danger" onClick={() => updateResumeStatus(req.id || req._id, 'reject')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="admin-grid health-grid">
          <div className="admin-card">
            <h3>Current Health</h3>
            <div className="health-block">
              <div><strong>Status:</strong> {health?.status || '-'}</div>
              <div><strong>DB Connected:</strong> {String(health?.db_connected ?? '-')}</div>
              <div><strong>Uptime (s):</strong> {health?.uptime_seconds ?? '-'}</div>
              <div><strong>Checked At:</strong> {health?.checked_at ? new Date(health.checked_at).toLocaleString() : '-'}</div>
            </div>
          </div>
          <div className="admin-card">
            <h3>Health History</h3>
            <div className="health-history">
              {healthHistory.map((item) => (
                <div key={item._id || item.checked_at} className="health-item">
                  <span>{new Date(item.checked_at).toLocaleString()}</span>
                  <span>{item.status}</span>
                  <span>{String(item.db_connected)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ title, value }) {
  return (
    <div className="admin-card stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
