import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../store/experienceStore'
import './SlidePanel.css'

export default function SlidePanel() {
  const showSlidePanel = useExperienceStore((state) => state.showSlidePanel)
  const setShowSlidePanel = useExperienceStore((state) => state.setShowSlidePanel)
  const navigate = useNavigate()

  const handlePortfolioSwitch = () => {
    setShowSlidePanel(false)
    navigate('/portfolio')
  }

  if (!showSlidePanel) return null

  return (
    <>
      <div
        className="menu-backdrop-minimal"
        onClick={() => setShowSlidePanel(false)}
      />

      <div className="premium-menu-card">
        <h2 className="menu-title">NAVIGATION</h2>
        <div className="menu-divider"></div>

        <button className="premium-portfolio-btn" onClick={handlePortfolioSwitch}>
          <span className="btn-glow"></span>
          <span className="btn-text">Switch to Portfolio</span>
          <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button className="menu-close-btn" onClick={() => setShowSlidePanel(false)}>
          Resume Experience
        </button>
      </div>
    </>
  )
}
