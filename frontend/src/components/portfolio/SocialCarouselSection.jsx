import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SOCIAL_PROFILES } from '../../data/socialProfiles'
import './SocialCarouselSection.css'

export default function SocialCarouselSection() {
  const scrollRef = useRef(null)
  const navigate = useNavigate()
  const [showLinktree, setShowLinktree] = useState(false)

  const scrollByAmount = (direction) => {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -400 : 400
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sonu Saarkaar | Links & Profiles',
          text: 'Check out Sonu Saarkaar\'s official social profiles and portfolio links.',
          url: window.location.href,
        })
      } catch (err) {
        setShowLinktree(true)
      }
    } else {
      setShowLinktree(true)
    }
  }

  return (
    <section className="social-carousel-section" id="social-profiles">
      <div className="social-carousel-head">
        <div>
          <h2>Social Media Profiles</h2>
          <p>Unified handle: <strong>@sonu_saarkaar</strong> • Connect across the digital ecosystem.</p>
        </div>
        <div className="social-carousel-actions">
          <button className="share-btn" onClick={() => setShowLinktree(true)} aria-label="Share Portfolio">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span>Share</span>
          </button>
          <button onClick={() => scrollByAmount('left')} aria-label="Scroll left">‹</button>
          <button onClick={() => scrollByAmount('right')} aria-label="Scroll right">›</button>
        </div>
      </div>

      <div className="social-carousel-track-container">
        <div className="social-carousel-track" ref={scrollRef}>
          {SOCIAL_PROFILES.map((platform) => (
            <article
              key={platform.id}
              className="social-card"
              style={{
                background: platform.theme.gradient,
                borderColor: platform.theme.soft
              }}
              onClick={() => navigate(`/portfolio/social/${platform.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/portfolio/social/${platform.id}`)
                }
              }}
            >
              <div className="social-card-header">
                <img
                  src={platform.avatarUrl || '/profile/sonu-boss.png?v=2'}
                  alt="Sonu Saarkaar profile"
                  className="social-avatar"
                  onError={(e) => {
                    e.currentTarget.src = '/face_texture.png'
                  }}
                />
                <div className="social-card-title">
                  <h3>{platform.name}</h3>
                  <span>{platform.handle}</span>
                </div>
              </div>

              <p className="social-card-headline">{platform.headline}</p>

              <div className="social-chip-row">
                <span className="social-chip">@sonu_saarkaar</span>
                <span className="social-chip">Live Profile</span>
              </div>

              <div className="social-card-actions">
                <button
                  className="social-open-btn primary"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/portfolio/social/${platform.id}`)
                  }}
                >
                  View Details
                </button>
                <a
                  className="social-open-btn secondary"
                  href={platform.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit Link ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {showLinktree && (
        <div className="linktree-modal-overlay" onClick={() => setShowLinktree(false)}>
          <div className="linktree-modal" onClick={(e) => e.stopPropagation()}>
            <button className="linktree-close-btn" onClick={() => setShowLinktree(false)}>✕</button>
            <div className="linktree-header">
              <img src="/profile/sonu-boss.png?v=2" alt="Profile" className="linktree-avatar" />
              <h3>Sonu Saarkaar</h3>
              <p>AI Systems Builder · Software Engineer</p>
              <div className="linktree-bio">Building premium digital experiences, AI tools, and scalable architectures.</div>
              <button className="linktree-share-trigger" onClick={handleShare}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Copy My Links
              </button>
            </div>

            <div className="linktree-links">
              {SOCIAL_PROFILES.map((p) => (
                <a key={p.id} href={p.profileUrl} target="_blank" rel="noopener noreferrer" className="linktree-btn" style={{ '--accent': p.theme.accent }}>
                  <span className="linktree-btn-icon">
                    <img src={p.avatarUrl || '/profile/sonu-boss.png?v=2'} alt={p.name} />
                  </span>
                  <span className="linktree-btn-text">{p.name}</span>
                  <span className="linktree-btn-arrow">➔</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
