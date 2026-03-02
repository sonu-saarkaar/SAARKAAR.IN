import { useNavigate } from 'react-router-dom'

export default function PageLayout({ title, subtitle, children }) {
    const navigate = useNavigate()

    return (
        <div className="page-layout">
            {/* Minimal Sticky Nav */}
            <div className="temp-nav">
                <div onClick={() => navigate('/')} className="logo">SAARKAAR.IN</div>
                <button onClick={() => navigate('/')} className="back-btn">
                    ← Back to Office
                </button>
            </div>

            <main className="page-container">
                <header className="section-head">
                    <div className="sub">{subtitle}</div>
                    <h1>{title}</h1>
                </header>
                {children}
            </main>
        </div>
    )
}
