import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExperienceStore } from '../store/experienceStore'
import './SlidePanel.css'

export default function SlidePanel() {
  const showSlidePanel = useExperienceStore((state) => state.showSlidePanel)
  const setShowSlidePanel = useExperienceStore((state) => state.setShowSlidePanel)
  const navigate = useNavigate()

  const [showConfirm, setShowConfirm] = useState(false)

  // Step 1: User clicks "Switch to Portfolio" → show confirmation
  const handlePortfolioRequest = () => {
    setShowConfirm(true)
  }

  // Step 2a: User confirms → navigate
  const handleConfirm = () => {
    setShowConfirm(false)
    setShowSlidePanel(false)
    navigate('/portfolio')
  }

  // Step 2b: User cancels → go back to panel
  const handleCancel = () => {
    setShowConfirm(false)
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

        <button className="premium-portfolio-btn" onClick={handlePortfolioRequest}>
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

      {/* --- PORTFOLIO SWITCH CONFIRMATION --- */}
      {showConfirm && (
        <div className="sp-confirm-overlay" onClick={handleCancel}>
          <div className="sp-confirm-modal" onClick={(e) => e.stopPropagation()}>

            <div className="sp-confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>

            <h3 className="sp-confirm-title">Switch to Portfolio?</h3>
            <p className="sp-confirm-msg">
              You are about to leave the Virtual Office.
              Your session will be saved.
            </p>

            <div className="sp-confirm-actions">
              <button className="sp-cancel-btn" onClick={handleCancel}>
                Stay in Office
              </button>
              <button className="sp-proceed-btn" onClick={handleConfirm}>
                Go to Portfolio
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
