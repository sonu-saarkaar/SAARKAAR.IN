import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import BrandLogo from '../components/BrandLogo'
import './AdminDashboard.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

const ADMIN_TOKEN_KEY = 'saarkaar_admin_token'

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'chat', label: 'Chat History' },
  { id: 'resumes', label: 'Resume Requests' },
  { id: 'projects', label: 'Projects Manager' },
  { id: 'content', label: 'Content Manager' },
  { id: 'media', label: 'Media Library' },
  { id: 'system', label: 'System Status' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'ai', label: 'AI Configuration' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'security', label: 'Security' },
  { id: 'audit', label: 'Audit Logs' },
  { id: 'settings', label: 'Settings' },
]

const STATUS_COLORS = {
  healthy: 'green',
  degraded: 'yellow',
  warning: 'yellow',
  critical: 'red',
  active: 'green',
  blocked: 'red',
}

const emptyContent = {
  founder_story: '',
  about: '',
  skills: '',
  experience: '',
  education: '',
  testimonials: '',
  contact_info: '',
  hero_text: '',
  virtual_office_dialogues: '',
}

const emptyProject = {
  title: '',
  tagline: '',
  category: '',
  description: '',
  vision: '',
  status: 'Live',
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
  team_members: '',
  story: '',
  progress: '0',
  visible: 'true',
}

export default function AdminDashboard() {
  const explicitApiUrl = import.meta.env.VITE_API_URL
  const backendUrl = import.meta.env.VITE_BACKEND_URL
  const API_URL = explicitApiUrl || (backendUrl ? (backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`) : '/api')

  const [token, setToken] = useState(localStorage.getItem(ADMIN_TOKEN_KEY) || '')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginForm, setLoginForm] = useState({ username: '', password: '' })

  const [summary, setSummary] = useState({})
  const [users, setUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState('')
  const [sessionMessages, setSessionMessages] = useState([])
  const [resumes, setResumes] = useState([])
  const [projects, setProjects] = useState([])
  const [activity, setActivity] = useState([])
  const [health, setHealth] = useState({})
  const [healthHistory, setHealthHistory] = useState([])
  const [systemStatus, setSystemStatus] = useState({})
  const [analytics, setAnalytics] = useState({ daily_interactions: [], project_interest: [], top_questions: [], top_sections: [] })
  const [security, setSecurity] = useState({ login_attempt_logs: [] })
  const [maintenance, setMaintenance] = useState({ enabled: false, message: '', allow_admin_bypass: true, schedule: '' })
  const [aiConfig, setAiConfig] = useState({ model: 'gpt-4o', temperature: 0.7, token_limit: 600, system_prompt: '', voice_enabled: true, chat_memory_enabled: true })
  const [featureToggles, setFeatureToggles] = useState({})
  const [content, setContent] = useState(emptyContent)
  const [officeSettings, setOfficeSettings] = useState({})
  const [mediaItems, setMediaItems] = useState([])
  const [mediaForm, setMediaForm] = useState({ name: '', type: 'image', url: '', folder: 'general', usage: 'manual' })

  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('')
  const [userTagFilter, setUserTagFilter] = useState('')

  const [chatSearch, setChatSearch] = useState('')
  const [chatUserFilter, setChatUserFilter] = useState('')
  const [chatDateFrom, setChatDateFrom] = useState('')
  const [chatDateTo, setChatDateTo] = useState('')

  const [resumeNoteDraft, setResumeNoteDraft] = useState({})

  const [projectForm, setProjectForm] = useState(emptyProject)
  const [projectEditorMode, setProjectEditorMode] = useState('create')
  const [editingProjectId, setEditingProjectId] = useState('')

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

  const parseList = (value) => String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const mapProjectToForm = (project) => ({
    title: project.title || '',
    tagline: project.tagline || '',
    category: project.category || '',
    description: project.description || '',
    vision: project.vision || '',
    status: project.status || 'Live',
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
    team_members: (project.team_members || []).join(', '),
    story: project.story || '',
    progress: String(project.progress ?? 0),
    visible: String(project.visible ?? true),
  })

  const resetProjectEditor = () => {
    setProjectEditorMode('create')
    setEditingProjectId('')
    setProjectForm(emptyProject)
  }

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
    setSelectedSession('')
    setSessionMessages([])
  }

  const loadUsers = async () => {
    const params = {}
    if (userSearch) params.search = userSearch
    if (userStatusFilter) params.status_filter = userStatusFilter
    if (userTagFilter) params.tag = userTagFilter
    const res = await api.get('/admin/users', { params })
    setUsers(res.data || [])
  }

  const loadConversations = async () => {
    const params = { limit: 300 }
    if (chatSearch) params.search = chatSearch
    if (chatUserFilter) params.user = chatUserFilter
    if (chatDateFrom) params.from_date = chatDateFrom
    if (chatDateTo) params.to_date = chatDateTo
    const [conversationsRes, sessionsRes] = await Promise.all([
      api.get('/admin/conversations', { params }),
      api.get('/admin/conversations/sessions?limit=150'),
    ])
    setConversations(conversationsRes.data || [])
    setSessions(sessionsRes.data || [])
  }

  const loadSessionMessages = async (sessionId) => {
    if (!sessionId) {
      setSessionMessages([])
      return
    }
    const res = await api.get(`/admin/conversations?session_id=${encodeURIComponent(sessionId)}&limit=200`)
    setSessionMessages((res.data || []).reverse())
  }

  const loadAll = async () => {
    setError('')
    setLoading(true)
    const tasks = await Promise.allSettled([
      api.get('/admin/dashboard/summary'),
      loadUsers(),
      loadConversations(),
      api.get('/admin/resume-requests'),
      api.get('/admin/portfolio'),
      api.get('/admin/health'),
      api.get('/admin/health/history?limit=20'),
      api.get('/admin/activity?limit=200'),
      api.get('/admin/analytics'),
      api.get('/admin/system/status'),
      api.get('/admin/maintenance'),
      api.get('/admin/ai-config'),
      api.get('/admin/feature-toggles'),
      api.get('/admin/security'),
      api.get('/admin/media'),
      api.get('/admin/content'),
      api.get('/admin/office-settings'),
    ])

    const safe = (idx, fallback) => tasks[idx]?.status === 'fulfilled' ? tasks[idx].value.data : fallback

    setSummary(safe(0, {}))
    setResumes(safe(3, []))
    setProjects(safe(4, []))
    setHealth(safe(5, {}))
    setHealthHistory(safe(6, []))
    setActivity(safe(7, []))
    setAnalytics(safe(8, { daily_interactions: [], project_interest: [], top_questions: [], top_sections: [] }))
    setSystemStatus(safe(9, {}))
    setMaintenance((prev) => ({ ...prev, ...safe(10, prev) }))
    setAiConfig((prev) => ({ ...prev, ...safe(11, prev) }))
    setFeatureToggles(safe(12, {}))
    setSecurity(safe(13, { login_attempt_logs: [] }))
    setMediaItems(safe(14, []))
    setContent((prev) => ({ ...prev, ...safe(15, prev) }))
    setOfficeSettings((prev) => ({ ...prev, ...safe(16, prev) }))

    const firstRejection = tasks.find((t) => t.status === 'rejected')
    if (firstRejection) {
      const reason = firstRejection.reason
      if (reason?.response?.status === 401) {
        handleLogout()
        setError('Session expired. Please login again.')
      } else {
        setError('Some enterprise modules are partially unavailable right now.')
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!token) return
    loadAll()
  }, [token])

  useEffect(() => {
    if (!token) return
    loadSessionMessages(selectedSession)
  }, [selectedSession, token])

  const refreshUsers = async () => {
    try {
      await loadUsers()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to refresh users')
    }
  }

  const updateUserStatus = async (userId, status) => {
    try {
      await api.post(`/admin/users/${encodeURIComponent(userId)}/status`, { status })
      await refreshUsers()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to update user status')
    }
  }

  const updateUserTag = async (userId, tag) => {
    try {
      await api.post(`/admin/users/${encodeURIComponent(userId)}/tag`, { tag })
      await refreshUsers()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to update user tag')
    }
  }

  const softDeleteUser = async (userId) => {
    try {
      await api.post(`/admin/users/${encodeURIComponent(userId)}/soft-delete`)
      await refreshUsers()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to soft delete user')
    }
  }

  const hardDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete user data?')) return
    try {
      await api.delete(`/admin/users/${encodeURIComponent(userId)}`)
      await refreshUsers()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to permanently delete user')
    }
  }

  const runChatFilters = async () => {
    try {
      await loadConversations()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to apply chat filters')
    }
  }

  const markConversation = async (id, mode) => {
    try {
      if (mode === 'flag') await api.post(`/admin/conversations/${id}/flag`)
      if (mode === 'important') await api.post(`/admin/conversations/${id}/important`)
      if (mode === 'delete') await api.delete(`/admin/conversations/${id}`)
      await loadConversations()
      if (selectedSession) await loadSessionMessages(selectedSession)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Conversation action failed')
    }
  }

  const updateResume = async (id, status) => {
    const note = resumeNoteDraft[id] || ''
    try {
      await api.put(`/admin/resume-requests/${id}`, {
        status,
        note,
        expiry_hours: status === 'approved' ? 24 : undefined,
      })
      const res = await api.get('/admin/resume-requests')
      setResumes(res.data || [])
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to update resume request')
    }
  }

  const revokeResume = async (id) => {
    try {
      await api.put(`/admin/resume-requests/${id}`, { revoke: true })
      const res = await api.get('/admin/resume-requests')
      setResumes(res.data || [])
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to revoke resume access')
    }
  }

  const saveProject = async (e) => {
    e.preventDefault()
    const payload = {
      ...projectForm,
      status: projectForm.status,
      tech_stack: parseList(projectForm.tech_stack),
      features: parseList(projectForm.features),
      gallery: parseList(projectForm.gallery),
      team_members: parseList(projectForm.team_members),
      progress: Number(projectForm.progress || 0),
      visible: projectForm.visible === 'true',
    }
    try {
      if (projectEditorMode === 'edit' && editingProjectId) {
        await api.put(`/admin/portfolio/${editingProjectId}`, payload)
      } else {
        await api.post('/admin/portfolio', payload)
      }
      const res = await api.get('/admin/portfolio')
      setProjects(res.data || [])
      resetProjectEditor()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to save project')
    }
  }

  const editProject = (project) => {
    setProjectEditorMode('edit')
    setEditingProjectId(project.id)
    setProjectForm(mapProjectToForm(project))
    setActiveSection('projects')
  }

  const deleteProject = async (projectId) => {
    if (!window.confirm('Delete this project?')) return
    try {
      await api.delete(`/admin/portfolio/${projectId}`)
      const res = await api.get('/admin/portfolio')
      setProjects(res.data || [])
      if (editingProjectId === projectId) resetProjectEditor()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to delete project')
    }
  }

  const saveContent = async () => {
    try {
      await api.put('/admin/content', { content })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to save content')
    }
  }

  const saveMaintenance = async () => {
    try {
      await api.put('/admin/maintenance', maintenance)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to save maintenance settings')
    }
  }

  const saveAiConfig = async () => {
    try {
      await api.put('/admin/ai-config', aiConfig)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to save AI config')
    }
  }

  const saveFeatureToggles = async () => {
    try {
      await api.put('/admin/feature-toggles', { toggles: featureToggles })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to save feature toggles')
    }
  }

  const saveOfficeSettings = async () => {
    try {
      await api.put('/admin/office-settings', { settings: officeSettings })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to save office settings')
    }
  }

  const addMedia = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/admin/media', mediaForm)
      setMediaItems((prev) => [res.data, ...prev])
      setMediaForm({ name: '', type: 'image', url: '', folder: 'general', usage: 'manual' })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to add media asset')
    }
  }

  const deleteMedia = async (assetId) => {
    try {
      await api.delete(`/admin/media/${assetId}`)
      setMediaItems((prev) => prev.filter((a) => (a._id || a.id) !== assetId))
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to delete media asset')
    }
  }

  const healthPills = [
    { label: 'Server Status', value: systemStatus.backend_api || health.status || 'unknown' },
    { label: 'AI API', value: systemStatus.ai_api || 'unknown' },
    { label: 'Database', value: systemStatus.database || (health.db_connected ? 'healthy' : 'critical') },
    { label: 'Uptime %', value: systemStatus.uptime_percent ?? '-' },
    { label: 'System Load', value: systemStatus.system_load ?? '-' },
    { label: 'Response Time', value: systemStatus.response_time_ms ? `${systemStatus.response_time_ms} ms` : '-' },
  ]

  const kpiCards = [
    { label: 'Total Users', value: users.length },
    { label: 'Active Users Today', value: users.filter((u) => u.status === 'active').length },
    { label: 'Total Conversations', value: summary.chat_logs ?? conversations.length },
    { label: 'Pending Resume Requests', value: summary.pending_resume_requests ?? resumes.filter((r) => r.status === 'pending').length },
    { label: 'Approved Requests', value: resumes.filter((r) => r.status === 'approved').length },
    { label: 'Blocked Users', value: users.filter((u) => u.status === 'blocked').length },
    { label: 'Server Status', value: String(systemStatus.backend_api || health.status || '-') },
    { label: 'AI API Status', value: String(systemStatus.ai_api || '-') },
    { label: 'Uptime %', value: String(systemStatus.uptime_percent ?? '-') },
    { label: 'System Load', value: String(systemStatus.system_load ?? '-') },
    { label: 'Database', value: String(systemStatus.database || (health.db_connected ? 'healthy' : 'critical')) },
  ]

  const lineData = {
    labels: (analytics.daily_interactions || []).map((d) => d.label),
    datasets: [{
      label: 'Daily Interactions',
      data: (analytics.daily_interactions || []).map((d) => d.value),
      borderColor: '#d4af37',
      backgroundColor: 'rgba(212,175,55,0.2)',
      tension: 0.35,
      pointRadius: 3,
    }],
  }

  const pieData = {
    labels: (analytics.project_interest || []).map((d) => d.name),
    datasets: [{
      data: (analytics.project_interest || []).map((d) => d.value),
      backgroundColor: ['#d4af37', '#b48b2f', '#8f6b1f', '#5a4414', '#2b2414'],
      borderColor: '#0b0b0f',
      borderWidth: 2,
    }],
  }

  if (!token) {
    return (
      <div className="admin-enterprise-shell login-shell">
        <div className="admin-login-card enterprise-card">
          <div className="admin-brand-wrap">
            <BrandLogo size="md" />
          </div>
          <h1>SAARKAAR Enterprise Admin</h1>
          <p>Secure access to users, AI operations, portfolio controls, and system governance.</p>
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
            <button type="submit" disabled={loading}>{loading ? 'Authenticating...' : 'Enter Control Center'}</button>
          </form>
          <div className="admin-note">Default credentials (if unchanged): admin / admin123</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-enterprise-shell">
      <aside className="admin-sidebar enterprise-card">
        <div className="admin-sidebar-brand">
          <BrandLogo size="sm" />
          <div>
            <h3>SAARKAAR</h3>
            <p>Enterprise Console</p>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={activeSection === item.id ? 'active' : ''}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={loadAll} disabled={loading}>{loading ? 'Syncing...' : 'Refresh Data'}</button>
          <button className="danger" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-main-header enterprise-card">
          <div>
            <h1>{SIDEBAR_ITEMS.find((x) => x.id === activeSection)?.label || 'Dashboard'}</h1>
            <p>SaaS-grade control panel for Virtual Office governance and operations.</p>
          </div>
          <div className="admin-health-pills">
            {healthPills.slice(0, 4).map((pill) => (
              <div key={pill.label} className={`health-pill ${STATUS_COLORS[String(pill.value).toLowerCase()] || ''}`}>
                <span>{pill.label}</span>
                <strong>{pill.value}</strong>
              </div>
            ))}
          </div>
        </header>

        {error && <div className="admin-error global">{error}</div>}

        {activeSection === 'dashboard' && (
          <section className="admin-section-grid">
            <div className="kpi-grid">
              {kpiCards.map((card) => (
                <article key={card.label} className="enterprise-card kpi-card">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>

            <div className="analytics-grid">
              <article className="enterprise-card chart-card">
                <h3>Daily Interactions</h3>
                <Line data={lineData} options={{ plugins: { legend: { labels: { color: '#f2e6b8' } } }, scales: { x: { ticks: { color: '#a8a8a8' } }, y: { ticks: { color: '#a8a8a8' } } } }} />
              </article>
              <article className="enterprise-card chart-card">
                <h3>Project Interest Stats</h3>
                <div className="donut-wrap">
                  <Doughnut data={pieData} options={{ plugins: { legend: { labels: { color: '#f2e6b8' } } } }} />
                </div>
              </article>
            </div>

            <div className="dashboard-bottom-grid">
              <article className="enterprise-card feed-card">
                <h3>Live Activity Feed</h3>
                <div className="scroll-area">
                  {activity.slice(0, 25).map((log) => (
                    <div key={log._id || `${log.action}-${log.created_at}`} className="feed-item">
                      <strong>{log.action}</strong>
                      <span>{log.admin || 'admin'} · {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="enterprise-card feed-card">
                <h3>Most Asked Questions</h3>
                <div className="scroll-area">
                  {(analytics.top_questions || []).map((q) => (
                    <div key={q.question} className="feed-item">
                      <strong>{q.question}</strong>
                      <span>{q.count} asks</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="enterprise-card feed-card">
                <h3>Top Visited Sections</h3>
                <div className="scroll-area">
                  {(analytics.top_sections || []).map((section) => (
                    <div key={section.name} className="feed-item">
                      <strong>{section.name}</strong>
                      <span>{section.value}%</span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        )}

        {activeSection === 'users' && (
          <section className="admin-section-grid">
            <article className="enterprise-card control-row">
              <input placeholder="Search users" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
              <select value={userTagFilter} onChange={(e) => setUserTagFilter(e.target.value)}>
                <option value="">All Tags</option>
                <option value="Investor">Investor</option>
                <option value="Client">Client</option>
                <option value="Student">Student</option>
                <option value="Recruiter">Recruiter</option>
              </select>
              <button onClick={loadUsers}>Apply Filters</button>
            </article>

            <article className="enterprise-card table-card">
              <h3>Users Management</h3>
              <div className="table-wrap">
                <table className="admin-table enterprise-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Status</th>
                      <th>Tag</th>
                      <th>Resume</th>
                      <th>Conversations</th>
                      <th>IP</th>
                      <th>Last Login</th>
                      <th>Device</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}<div className="muted-line">{user.email}</div></td>
                        <td>{user.status}</td>
                        <td>
                          <select value={user.tag || 'Student'} onChange={(e) => updateUserTag(user.id, e.target.value)}>
                            <option>Investor</option>
                            <option>Client</option>
                            <option>Student</option>
                            <option>Recruiter</option>
                          </select>
                        </td>
                        <td>{user.resume_requested ? 'Yes' : 'No'}</td>
                        <td>{user.conversation_count || 0}</td>
                        <td>{user.ip_address || 'unknown'}</td>
                        <td>{user.last_login ? new Date(user.last_login).toLocaleString() : '-'}</td>
                        <td className="cell-truncate">{user.device_info || 'web'}</td>
                        <td>
                          <div className="inline-actions">
                            <button onClick={() => updateUserStatus(user.id, user.status === 'blocked' ? 'active' : 'blocked')}>
                              {user.status === 'blocked' ? 'Unblock' : 'Block'}
                            </button>
                            <button className="muted" onClick={() => softDeleteUser(user.id)}>Soft Delete</button>
                            <button className="danger" onClick={() => hardDeleteUser(user.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {activeSection === 'chat' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card control-row">
              <input placeholder="Keyword search" value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} />
              <input placeholder="User/session" value={chatUserFilter} onChange={(e) => setChatUserFilter(e.target.value)} />
              <input type="datetime-local" value={chatDateFrom} onChange={(e) => setChatDateFrom(e.target.value)} />
              <input type="datetime-local" value={chatDateTo} onChange={(e) => setChatDateTo(e.target.value)} />
              <button onClick={runChatFilters}>Run Filter</button>
            </article>

            <article className="enterprise-card session-card">
              <h3>Sessions</h3>
              <div className="scroll-area">
                {sessions.map((session) => (
                  <button key={session.session_id} className={selectedSession === session.session_id ? 'session-item active' : 'session-item'} onClick={() => setSelectedSession(session.session_id)}>
                    <strong>{session.session_id}</strong>
                    <span>{session.message_count} msgs · {session.last_seen ? new Date(session.last_seen).toLocaleString() : '-'}</span>
                  </button>
                ))}
              </div>
            </article>

            <article className="enterprise-card message-card">
              <h3>Conversation Details</h3>
              <div className="scroll-area">
                {(selectedSession ? sessionMessages : conversations).map((msg) => {
                  const cid = msg._id || msg.id
                  return (
                    <div key={cid || `${msg.created_at}-${msg.user_message}`} className="message-item">
                      <p><strong>User:</strong> {msg.user_message}</p>
                      <p><strong>AI:</strong> {msg.assistant_response}</p>
                      <div className="message-meta-row">
                        <span>{msg.created_at ? new Date(msg.created_at).toLocaleString() : '-'}</span>
                        <span>{msg.current_partner || 'assistant'}</span>
                        <span>{msg.sentiment || 'neutral'}</span>
                      </div>
                      {cid && (
                        <div className="inline-actions">
                          <button onClick={() => markConversation(cid, 'important')}>Important</button>
                          <button className="muted" onClick={() => markConversation(cid, 'flag')}>Flag</button>
                          <button className="danger" onClick={() => markConversation(cid, 'delete')}>Delete</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </article>
          </section>
        )}

        {activeSection === 'resumes' && (
          <section className="admin-section-grid">
            <article className="enterprise-card table-card">
              <h3>Resume Request Management</h3>
              <div className="table-wrap">
                <table className="admin-table enterprise-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Downloads</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumes.map((req) => {
                      const id = req.id || req._id
                      return (
                        <tr key={id}>
                          <td>{req.name}</td>
                          <td>{req.email}</td>
                          <td>{req.resume_type}</td>
                          <td className="cell-truncate">{req.reason}</td>
                          <td>{req.status}</td>
                          <td>{req.download_count || 0}</td>
                          <td>{req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</td>
                          <td>
                            <textarea
                              rows={2}
                              placeholder="Add admin note"
                              value={resumeNoteDraft[id] || ''}
                              onChange={(e) => setResumeNoteDraft((prev) => ({ ...prev, [id]: e.target.value }))}
                            />
                            <div className="inline-actions">
                              <button onClick={() => updateResume(id, 'approved')}>Approve</button>
                              <button className="muted" onClick={() => updateResume(id, 'rejected')}>Reject</button>
                              <button className="danger" onClick={() => revokeResume(id)}>Revoke</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {activeSection === 'projects' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card form-card">
              <h3>{projectEditorMode === 'edit' ? 'Edit Project' : 'Add New Project'}</h3>
              <form className="admin-form project-form" onSubmit={saveProject}>
                {Object.keys(projectForm).map((field) => (
                  <label key={field}>
                    <span>{field}</span>
                    {['description', 'vision', 'problem_statement', 'solution', 'story'].includes(field) ? (
                      <textarea
                        rows={3}
                        value={projectForm[field]}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      />
                    ) : field === 'status' ? (
                      <select value={projectForm.status} onChange={(e) => setProjectForm((prev) => ({ ...prev, status: e.target.value }))}>
                        <option>Live</option>
                        <option>Sold</option>
                        <option>Upcoming</option>
                        <option>Private</option>
                      </select>
                    ) : (
                      <input
                        value={projectForm[field]}
                        onChange={(e) => setProjectForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      />
                    )}
                  </label>
                ))}
                <div className="inline-actions">
                  <button type="submit">{projectEditorMode === 'edit' ? 'Update Project' : 'Create Project'}</button>
                  {projectEditorMode === 'edit' && <button type="button" className="muted" onClick={resetProjectEditor}>Cancel</button>}
                </div>
              </form>
            </article>

            <article className="enterprise-card table-card">
              <h3>Project Inventory</h3>
              <div className="scroll-area">
                {projects.map((project) => (
                  <div key={project.id} className="project-item">
                    <div>
                      <strong>{project.title}</strong>
                      <div className="muted-line">{project.category} · {project.status}</div>
                    </div>
                    <div className="inline-actions">
                      <button onClick={() => editProject(project)}>Edit</button>
                      <button className="danger" onClick={() => deleteProject(project.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeSection === 'content' && (
          <section className="admin-section-grid">
            <article className="enterprise-card form-card">
              <h3>Content Manager</h3>
              <div className="rich-grid">
                {Object.keys(content).map((key) => (
                  <label key={key}>
                    <span>{key.replaceAll('_', ' ')}</span>
                    <textarea rows={4} value={content[key] || ''} onChange={(e) => setContent((prev) => ({ ...prev, [key]: e.target.value }))} />
                  </label>
                ))}
              </div>
              <div className="inline-actions">
                <button onClick={saveContent}>Save Content</button>
              </div>
            </article>
          </section>
        )}

        {activeSection === 'media' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card form-card">
              <h3>Media Library Upload</h3>
              <form className="admin-form" onSubmit={addMedia}>
                <label><span>Name</span><input value={mediaForm.name} onChange={(e) => setMediaForm((prev) => ({ ...prev, name: e.target.value }))} required /></label>
                <label><span>Type</span>
                  <select value={mediaForm.type} onChange={(e) => setMediaForm((prev) => ({ ...prev, type: e.target.value }))}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="3d">3D Asset</option>
                  </select>
                </label>
                <label><span>URL</span><input value={mediaForm.url} onChange={(e) => setMediaForm((prev) => ({ ...prev, url: e.target.value }))} required /></label>
                <label><span>Folder</span><input value={mediaForm.folder} onChange={(e) => setMediaForm((prev) => ({ ...prev, folder: e.target.value }))} /></label>
                <label><span>Usage Location</span><input value={mediaForm.usage} onChange={(e) => setMediaForm((prev) => ({ ...prev, usage: e.target.value }))} /></label>
                <button type="submit">Upload Asset</button>
              </form>
            </article>

            <article className="enterprise-card table-card">
              <h3>Media Assets</h3>
              <div className="table-wrap">
                <table className="admin-table enterprise-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Folder</th>
                      <th>Usage</th>
                      <th>Preview</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediaItems.map((asset) => {
                      const id = asset._id || asset.id
                      return (
                        <tr key={id}>
                          <td>{asset.name}</td>
                          <td>{asset.type}</td>
                          <td>{asset.folder}</td>
                          <td>{asset.usage || '-'}</td>
                          <td><a href={asset.url} target="_blank" rel="noreferrer">Preview</a></td>
                          <td><button className="danger" onClick={() => deleteMedia(id)}>Delete</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {activeSection === 'system' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card table-card">
              <h3>System Health</h3>
              <div className="health-list">
                {healthPills.map((pill) => (
                  <div key={pill.label} className={`health-row ${STATUS_COLORS[String(pill.value).toLowerCase()] || ''}`}>
                    <span>{pill.label}</span>
                    <strong>{pill.value}</strong>
                  </div>
                ))}
                <div className="health-row"><span>CPU Usage</span><strong>{systemStatus.server_cpu ?? '-'}%</strong></div>
                <div className="health-row"><span>Memory Usage</span><strong>{systemStatus.memory_usage ?? '-'}%</strong></div>
                <div className="health-row"><span>Storage Usage</span><strong>{systemStatus.storage_usage ?? '-'}%</strong></div>
              </div>
            </article>

            <article className="enterprise-card table-card">
              <h3>Uptime Monitor History</h3>
              <div className="scroll-area">
                {healthHistory.map((item) => (
                  <div key={item._id || item.checked_at} className="health-item">
                    <span>{item.checked_at ? new Date(item.checked_at).toLocaleString() : '-'}</span>
                    <span>{item.status}</span>
                    <span>{String(item.db_connected)}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeSection === 'maintenance' && (
          <section className="admin-section-grid">
            <article className="enterprise-card form-card">
              <h3>Maintenance Control</h3>
              <label className="toggle-line">
                <span>Enable Maintenance Mode</span>
                <input type="checkbox" checked={!!maintenance.enabled} onChange={(e) => setMaintenance((prev) => ({ ...prev, enabled: e.target.checked }))} />
              </label>
              <label><span>Maintenance Message</span>
                <textarea rows={3} value={maintenance.message || ''} onChange={(e) => setMaintenance((prev) => ({ ...prev, message: e.target.value }))} />
              </label>
              <label><span>Schedule (ISO or readable text)</span>
                <input value={maintenance.schedule || ''} onChange={(e) => setMaintenance((prev) => ({ ...prev, schedule: e.target.value }))} />
              </label>
              <label className="toggle-line">
                <span>Allow Admin Bypass Login</span>
                <input type="checkbox" checked={!!maintenance.allow_admin_bypass} onChange={(e) => setMaintenance((prev) => ({ ...prev, allow_admin_bypass: e.target.checked }))} />
              </label>
              <div className="inline-actions">
                <button onClick={saveMaintenance}>Save Maintenance Policy</button>
                <button className="danger" onClick={() => setMaintenance((prev) => ({ ...prev, enabled: true, message: 'Emergency shutdown enabled by admin.' }))}>Emergency Shutdown</button>
              </div>
            </article>
          </section>
        )}

        {activeSection === 'ai' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card form-card">
              <h3>AI Configuration</h3>
              <label><span>Model</span>
                <select value={aiConfig.model} onChange={(e) => setAiConfig((prev) => ({ ...prev, model: e.target.value }))}>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                </select>
              </label>
              <label><span>Temperature</span>
                <input type="number" min="0" max="2" step="0.1" value={aiConfig.temperature} onChange={(e) => setAiConfig((prev) => ({ ...prev, temperature: Number(e.target.value) }))} />
              </label>
              <label><span>Token Limit</span>
                <input type="number" min="100" max="4000" value={aiConfig.token_limit} onChange={(e) => setAiConfig((prev) => ({ ...prev, token_limit: Number(e.target.value) }))} />
              </label>
              <label><span>System Prompt</span>
                <textarea rows={6} value={aiConfig.system_prompt || ''} onChange={(e) => setAiConfig((prev) => ({ ...prev, system_prompt: e.target.value }))} />
              </label>
              <label className="toggle-line"><span>Enable Voice</span><input type="checkbox" checked={!!aiConfig.voice_enabled} onChange={(e) => setAiConfig((prev) => ({ ...prev, voice_enabled: e.target.checked }))} /></label>
              <label className="toggle-line"><span>Enable Chat Memory</span><input type="checkbox" checked={!!aiConfig.chat_memory_enabled} onChange={(e) => setAiConfig((prev) => ({ ...prev, chat_memory_enabled: e.target.checked }))} /></label>
              <div className="inline-actions">
                <button onClick={saveAiConfig}>Save AI Config</button>
                <button className="muted" onClick={() => setAiConfig((prev) => ({ ...prev, chat_memory_enabled: false }))}>Reset Memory</button>
              </div>
            </article>

            <article className="enterprise-card form-card">
              <h3>Feature Toggles</h3>
              <div className="toggle-grid">
                {Object.keys(featureToggles).map((key) => (
                  <label key={key} className="toggle-line">
                    <span>{key}</span>
                    <input
                      type="checkbox"
                      checked={!!featureToggles[key]}
                      onChange={(e) => setFeatureToggles((prev) => ({ ...prev, [key]: e.target.checked }))}
                    />
                  </label>
                ))}
              </div>
              <button onClick={saveFeatureToggles}>Save Feature Toggles</button>
            </article>
          </section>
        )}

        {activeSection === 'analytics' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card chart-card">
              <h3>Visitor & Interaction Trend</h3>
              <Line data={lineData} options={{ plugins: { legend: { labels: { color: '#f2e6b8' } } }, scales: { x: { ticks: { color: '#a8a8a8' } }, y: { ticks: { color: '#a8a8a8' } } } }} />
            </article>
            <article className="enterprise-card chart-card">
              <h3>Conversion and Engagement</h3>
              <div className="metric-stack">
                <div><span>Unique Visitors</span><strong>{analytics.unique_visitors ?? '-'}</strong></div>
                <div><span>Resume Conversion Rate</span><strong>{analytics.resume_conversion_rate ?? '-'}%</strong></div>
                <div><span>Top Interacted Project</span><strong>{analytics.project_interest?.[0]?.name || '-'}</strong></div>
              </div>
              <div className="heatmap-placeholder">Engagement Heatmap · Coming from tracking module</div>
            </article>
          </section>
        )}

        {activeSection === 'security' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card form-card">
              <h3>Security Controls</h3>
              <label className="toggle-line"><span>2FA for Admin</span><input type="checkbox" checked={false} readOnly /></label>
              <label className="toggle-line"><span>Role-based Permissions</span><input type="checkbox" checked={true} readOnly /></label>
              <label className="toggle-line"><span>IP Block List Active</span><input type="checkbox" checked={security.ip_block_list?.[0] !== 'none'} readOnly /></label>
              <div className="metric-stack">
                <div><span>Blocked Users</span><strong>{security.blocked_users ?? 0}</strong></div>
                <div><span>Permission Profile</span><strong>{(security.permissions || []).join(', ') || '-'}</strong></div>
              </div>
            </article>

            <article className="enterprise-card table-card">
              <h3>Login Attempt Logs</h3>
              <div className="scroll-area">
                {(security.login_attempt_logs || []).map((log) => (
                  <div key={log._id || `${log.action}-${log.created_at}`} className="feed-item">
                    <strong>{log.action}</strong>
                    <span>{log.admin} · {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeSection === 'audit' && (
          <section className="admin-section-grid">
            <article className="enterprise-card table-card">
              <h3>Audit Trails</h3>
              <div className="table-wrap">
                <table className="admin-table enterprise-table">
                  <thead>
                    <tr>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Details</th>
                      <th>Timestamp</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((log) => (
                      <tr key={log._id || `${log.action}-${log.created_at}`}>
                        <td>{log.admin || 'admin'}</td>
                        <td>{log.action}</td>
                        <td className="cell-truncate">{JSON.stringify(log.meta || {})}</td>
                        <td>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
                        <td>{log.ip_address || 'not captured'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="admin-section-grid split-layout">
            <article className="enterprise-card form-card">
              <h3>Virtual Office Settings</h3>
              {Object.keys(officeSettings || {}).map((key) => {
                const value = officeSettings[key]
                if (typeof value === 'boolean') {
                  return (
                    <label key={key} className="toggle-line">
                      <span>{key}</span>
                      <input type="checkbox" checked={!!value} onChange={(e) => setOfficeSettings((prev) => ({ ...prev, [key]: e.target.checked }))} />
                    </label>
                  )
                }
                return (
                  <label key={key}>
                    <span>{key}</span>
                    <input value={value || ''} onChange={(e) => setOfficeSettings((prev) => ({ ...prev, [key]: e.target.value }))} />
                  </label>
                )
              })}
              <button onClick={saveOfficeSettings}>Save Virtual Office Settings</button>
            </article>

            <article className="enterprise-card form-card">
              <h3>Global Feature Toggles</h3>
              <div className="toggle-grid">
                {Object.keys(featureToggles).map((key) => (
                  <label key={key} className="toggle-line">
                    <span>{key}</span>
                    <input type="checkbox" checked={!!featureToggles[key]} onChange={(e) => setFeatureToggles((prev) => ({ ...prev, [key]: e.target.checked }))} />
                  </label>
                ))}
              </div>
              <button onClick={saveFeatureToggles}>Apply Feature Policy</button>
            </article>
          </section>
        )}
      </main>
    </div>
  )
}
