import PageLayout from '../components/layout/PageLayout'

export default function About() {
    return (
        <PageLayout title="About SAARKAAR" subtitle="Who We Are">
            <div className="about-content">
                <h2 className="section-head" style={{ textAlign: 'left', fontSize: '2rem' }}>Building the Future of Digital Interaction</h2>
                <p className="lead" style={{ fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '40px' }}>
                    Founded in 2024, SAARKAAR.IN is a premier digital agency specializing in immersive web technologies. We don't just build websites; we construct virtual environments where brands come alive.
                </p>

                <div className="grid-cols stats-grid" style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <div className="stat-card card">
                        <h3 style={{ color: '#eebb44', fontSize: '3rem' }}>50+</h3>
                        <p>Projects Delivered</p>
                    </div>
                    <div className="stat-card card">
                        <h3 style={{ color: '#eebb44', fontSize: '3rem' }}>12</h3>
                        <p>Global Partners</p>
                    </div>
                    <div className="stat-card card">
                        <h3 style={{ color: '#eebb44', fontSize: '3rem' }}>98%</h3>
                        <p>Client Satisfaction</p>
                    </div>
                </div>

                <h3 style={{ fontSize: '1.8rem', marginBottom: '30px' }}>Meet the Leadership</h3>
                <div className="grid-cols team-grid">
                    <div className="card team-card">
                        <div className="team-img" style={{ height: '250px', background: '#333', marginBottom: '15px' }}></div>
                        <h3>Sonu Bhai</h3>
                        <p style={{ color: '#eebb44' }}>Founder & CEO</p>
                        <p>Visionary leader with a decade of experience in full-stack development and 3D graphics.</p>
                    </div>
                    <div className="card team-card">
                        <div className="team-img" style={{ height: '250px', background: '#333', marginBottom: '15px' }}></div>
                        <h3>Technical Lead</h3>
                        <p style={{ color: '#eebb44' }}>CTO</p>
                        <p>Architecting scalable solutions and pushing the boundaries of WebGL performance.</p>
                    </div>
                </div>
            </div>
        </PageLayout>
    )
}
