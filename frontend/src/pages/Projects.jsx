import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/layout/PageLayout'
import { fetchProjects } from '../services/api'
import '../index.css'

export default function Projects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let mounted = true

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const data = await fetchProjects()
                if (mounted) {
                    setProjects(Array.isArray(data) ? data : [])
                }
            } catch (err) {
                if (mounted) {
                    setError(err?.response?.data?.detail || 'Failed to load projects. Please try again.')
                }
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [])

    return (
        <PageLayout title="Our Portfolio" subtitle="Selected Works">
            {loading && <div style={{ textAlign: 'center', opacity: 0.8 }}>Loading projects...</div>}
            {!loading && error && <div style={{ textAlign: 'center', color: '#f66' }}>{error}</div>}
            {!loading && !error && projects.length === 0 && (
                <div style={{ textAlign: 'center', opacity: 0.8 }}>No projects available yet.</div>
            )}

            {!loading && !error && projects.length > 0 && (
                <div className="grid-cols gallery-grid">
                    {projects.map((p) => (
                        <div key={p.id} className="card project-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="project-img" style={{ height: '200px', overflow: 'hidden' }}>
                                {p.images?.[0] ? (
                                    <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', background: '#1f1f1f' }} />
                                )}
                            </div>
                            <div className="project-details" style={{ padding: '20px' }}>
                                <span className="p-cat" style={{ color: '#eebb44', fontSize: '0.8rem', fontWeight: 'bold' }}>{p.status}</span>
                                <h3>{p.title}</h3>
                                <p>{p.description}</p>
                                <Link to={`/portfolio/${p.id}`}>
                                    <button className="btn-cta" style={{ padding: '8px 16px', fontSize: '0.9rem', marginTop: '10px' }}>View Case Study</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    )
}
