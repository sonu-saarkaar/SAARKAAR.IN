import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchProjectById, submitFeedback, joinTeam } from '../services/api'
import { ARCHIVE_DATA_BY_ID, buildProjectDetailFromArchive } from '../data/archiveProjects'
import './ProjectDetail.css'

export default function ProjectDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)

    // Feedback State
    const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', feedback: '' })

    // Join State
    const [joinForm, setJoinForm] = useState({ name: '', role: '', link: '', message: '', resume: null })

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [id])

    useEffect(() => {
        const loadProject = async () => {
            setLoading(true)
            const archiveFallback = buildProjectDetailFromArchive(ARCHIVE_DATA_BY_ID[id])
            try {
                const data = await fetchProjectById(id)
                if (data) {
                    setProject({
                        ...archiveFallback,
                        ...data,
                        tech_stack: data.tech_stack || archiveFallback?.tech_stack || [],
                        features: data.features || archiveFallback?.features || [],
                        archive_sections: data.archive_sections || archiveFallback?.archive_sections || []
                    })
                } else {
                    setProject(archiveFallback || null)
                }
            } catch (error) {
                console.error('Failed to load project detail:', error)
                setProject(archiveFallback || null)
            } finally {
                setLoading(false)
            }
        }
        loadProject()
    }, [id])

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault()
        try {
            await submitFeedback(feedbackForm)
            alert('Thank you! Your feedback has been recorded.')
            setFeedbackForm({ name: '', email: '', feedback: '' })
        } catch (error) {
            console.error(error)
            alert('Failed to submit feedback. Please try again.')
        }
    }

    const handleJoinSubmit = async (e) => {
        e.preventDefault()

        const formData = new FormData()
        formData.append('full_name', joinForm.name)
        formData.append('role', joinForm.role)
        formData.append('message', joinForm.message)
        if (joinForm.link) formData.append('portfolio_link', joinForm.link)
        if (joinForm.resume) formData.append('resume', joinForm.resume)

        try {
            await joinTeam(formData)
            alert('Application submitted successfully! We will contact you.')
            setJoinForm({ name: '', role: '', link: '', message: '', resume: null })
        } catch (error) {
            console.error(error)
            alert('Failed to submit application. Please ensure you uploaded a valid resume (PDF/Doc).')
        }
    }

    if (loading) return <div className="loading-screen">Loading Innovation...</div>
    if (!project) return <div className="loading-screen" style={{ flexDirection: 'column' }}><p>Project Not Found</p><button onClick={() => navigate('/portfolio')} className="nav-back">Back to Lab</button></div>

    return (
        <div className="project-detail-container">
            {/* Navigation Bar */}
            <nav className="detail-nav">
                <button onClick={() => navigate('/portfolio')} className="nav-back">
                    ← Back to Lab
                </button>
                <div className="nav-title">SAARKAAR INNOVATION LAB</div>
            </nav>

            {/* Hero Section */}
            <header className="detail-hero" style={{ background: project.gradient || '#111' }}>
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    {project.badge && <span className="hero-badge">{project.badge}</span>}
                    <h1 className="hero-title">{project.title}</h1>
                    <p className="hero-tagline">{project.tagline}</p>

                    {(project.live_link || project.link) && (
                        <a
                            href={project.live_link || project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hero-live-btn"
                        >
                            Visit Live Project ↗
                        </a>
                    )}

                    <div className="hero-meta">
                        <span className="meta-item">Category: {project.category}</span>
                        <span className="meta-item">Status: {project.status}</span>
                        {project.timeline && <span className="meta-item">Timeline: {project.timeline}</span>}
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="detail-main">
                {/* Vision & Problem Statement */}
                <section className="detail-section grid-2">
                    <div className="content-card vision-card">
                        <h3>Our Vision</h3>
                        <p>{project.vision || project.description}</p>
                    </div>
                    <div className="content-card problem-card">
                        <h3>The Problem</h3>
                        <p>{project.problem_statement || project.problem || "Defining the core challenge."}</p>
                    </div>
                </section>

                {/* Solution Architecture */}
                <section className="detail-section">
                    <div className="content-card solution-card">
                        <h3>The Solution Architecture</h3>
                        <p>{project.solution || "Innovative architecture designed for scalability."}</p>
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="detail-section">
                    <h3>Technology Stack</h3>
                    <div className="tech-grid">
                        {(project.tech_stack || project.tech || []).map((t, i) => (
                            <span key={i} className="tech-badge">{t}</span>
                        ))}
                    </div>
                </section>

                {/* Key Features */}
                <section className="detail-section">
                    <h3>Key Features</h3>
                    <ul className="features-list">
                        {(project.features || []).map((f, i) => (
                            <li key={i} className="feature-item">
                                <span className="check-icon">✓</span> {f}
                            </li>
                        ))}
                    </ul>
                </section>

                {(project.archive_sections || []).length > 0 && (
                    <section className="detail-section">
                        <h3>Archives – Deployed Intelligence (Structured Details)</h3>
                        <div className="content-card">
                            {(project.archive_sections || []).map((section) => (
                                <div key={section.title} style={{ marginBottom: '1.2rem' }}>
                                    <h4 style={{ marginBottom: '0.4rem', color: '#eebb44' }}>{section.title}</h4>
                                    {section.content && <p style={{ marginBottom: section.points?.length ? '0.5rem' : '0' }}>{section.content}</p>}
                                    {section.points?.length > 0 && (
                                        <ul className="features-list" style={{ marginBottom: 0 }}>
                                            {section.points.map((point) => (
                                                <li key={point} className="feature-item">
                                                    <span className="check-icon">✓</span> {point}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {section.ctaLink && section.ctaLabel && (
                                        <a
                                            href={section.ctaLink}
                                            className="hero-live-btn"
                                            style={{ display: 'inline-block', marginTop: '0.65rem', padding: '8px 14px', fontSize: '0.86rem' }}
                                        >
                                            {section.ctaLabel} ↗
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Gallery */}
                <section className="detail-section">
                    <h3>Project Gallery</h3>
                    <div className="gallery-grid">
                        {(project.gallery && project.gallery.length > 0) ? (
                            project.gallery.map((img, i) => (
                                <img key={i} src={img} alt={`Gallery ${i}`} className="gallery-img" />
                            ))
                        ) : (
                            <>
                                <div className="gallery-item placeholder"><span>Visual Preview 1</span></div>
                                <div className="gallery-item placeholder"><span>Visual Preview 2</span></div>
                                <div className="gallery-item placeholder"><span>Visual Preview 3</span></div>
                            </>
                        )}
                    </div>
                </section>

                {/* Interactive Sections */}
                <div className="interactive-zone">

                    {/* Love This Idea */}
                    <section className="feedback-section">
                        <h2>💌 Love This Idea?</h2>
                        <div className="action-buttons">
                            <button className="action-btn love-btn" onClick={() => alert('Thanks for the support! ❤️')}>❤️ I Love This</button>
                            <button className="action-btn build-btn" onClick={() => document.getElementById('join-form').scrollIntoView({ behavior: 'smooth' })}>🚀 Let's Collaborate</button>
                        </div>

                        <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                            <h4>Leave Feedback</h4>
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={feedbackForm.name}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                                required
                                className="form-input"
                            />
                            <input
                                type="email"
                                placeholder="Your Email"
                                value={feedbackForm.email}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                                required
                                className="form-input"
                            />
                            <textarea
                                value={feedbackForm.feedback}
                                onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                                placeholder="Your thoughts on this project..."
                                required
                                className="form-input"
                                rows="4"
                            />
                            <button type="submit" className="form-submit">Submit Feedback</button>
                        </form>
                    </section>

                    {/* Join Team */}
                    <section className="join-section" id="join-form">
                        <h2>🤝 Join As Team Member</h2>
                        <p>Want to work on projects like this?</p>
                        <form onSubmit={handleJoinSubmit} className="join-form">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={joinForm.name}
                                onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                                required
                                className="form-input"
                            />
                            <input
                                type="text"
                                placeholder="Role Interested In"
                                value={joinForm.role}
                                onChange={(e) => setJoinForm({ ...joinForm, role: e.target.value })}
                                required
                                className="form-input"
                            />
                            <input
                                type="url"
                                placeholder="Portfolio Link (Optional)"
                                value={joinForm.link}
                                onChange={(e) => setJoinForm({ ...joinForm, link: e.target.value })}
                                className="form-input"
                            />

                            <div className="file-upload-group">
                                <label style={{ color: '#aaa', marginBottom: '5px', display: 'block', fontSize: '0.9rem' }}>Upload Resume (PDF/Doc)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setJoinForm({ ...joinForm, resume: e.target.files[0] })}
                                    accept=".pdf,.doc,.docx"
                                    className="form-input file-input"
                                />
                            </div>

                            <textarea
                                placeholder="Why do you want to join?"
                                value={joinForm.message}
                                onChange={(e) => setJoinForm({ ...joinForm, message: e.target.value })}
                                required
                                className="form-input"
                                rows="4"
                            />
                            <button type="submit" className="join-btn">Request to Join Team</button>
                        </form>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="detail-footer">
                <div className="social-links">
                    {['LinkedIn', 'Instagram', 'GitHub', 'Twitter', 'Email'].map((social, i) => (
                        <a key={i} href="#" className="social-icon">{social}</a>
                    ))}
                </div>
                <p>&copy; 2026 SAARKAAR.IN - Innovation Lab</p>
            </footer>
        </div>
    )
}
