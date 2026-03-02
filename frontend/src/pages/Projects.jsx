import PageLayout from '../components/layout/PageLayout'
import '../index.css'

export default function Projects() {
    const projects = [
        {
            img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600',
            title: 'Neo-Tokyo VR City',
            cat: '3D Web Experience',
            desc: 'A futuristic virtual city tour built with React Three Fiber. Users can explore districts, interact with AI citizens, and purchase virtual real estate.'
        },
        {
            img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600',
            title: 'Quantum Dashboard',
            cat: 'SaaS Platform',
            desc: 'Real-time analytics dashboard for quantum computing simulations. Visualizes qubit states and entanglement metrics.'
        },
        {
            img: 'https://images.unsplash.com/photo-1558655146-d09347e0c766?auto=format&fit=crop&q=80&w=600',
            title: 'EcoTrack App',
            cat: 'Mobile Application',
            desc: 'Carbon footprint tracking app using React Native. Gamifies sustainable living with daily challenges and rewards.'
        },
        {
            img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
            title: 'AI Code Assistant',
            cat: 'Machine Learning',
            desc: 'Custom VS Code extension powered by GPT-4. suggest code improvements, document functions, and refactor legacy code.'
        },
        {
            img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=600',
            title: 'FinTech Secure',
            cat: 'Cybersecurity',
            desc: 'Enterprise-grade banking portal with biometric authentication and end-to-end encryption.'
        },
        {
            img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600',
            title: 'Brand Identity Gen',
            cat: 'Generative Design',
            desc: 'Automated brand identity generator using generative adversarial networks (GANs).'
        }
    ]

    return (
        <PageLayout title="Our Portfolio" subtitle="Selected Works">
            <div className="portfolio-filter" style={{ textAlign: 'center', marginBottom: '40px' }}>
                {['All', 'Web3', 'AI', 'Mobile', 'Design'].map(f => (
                    <button key={f} className={`filter-btn ${f === 'All' ? 'active' : ''}`} style={{
                        background: 'transparent', border: '1px solid #444', color: '#ccc',
                        margin: '0 5px', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer'
                    }}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid-cols gallery-grid">
                {projects.map((p, i) => (
                    <div key={i} className="card project-card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="project-img" style={{ height: '200px', overflow: 'hidden' }}>
                            <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="project-details" style={{ padding: '20px' }}>
                            <span className="p-cat" style={{ color: '#eebb44', fontSize: '0.8rem', fontWeight: 'bold' }}>{p.cat}</span>
                            <h3>{p.title}</h3>
                            <p>{p.desc}</p>
                            <button className="btn-cta" style={{ padding: '8px 16px', fontSize: '0.9rem', marginTop: '10px' }}>View Case Study</button>
                        </div>
                    </div>
                ))}
            </div>
        </PageLayout>
    )
}
