import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SOCIAL_PROFILES } from '../../data/socialProfiles'
import './SocialCarouselSection.css'

export default function SocialCarouselSection() {
  const scrollRef = useRef(null)
  const navigate = useNavigate()

  const scrollByAmount = (direction) => {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -360 : 360
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <section className="social-carousel-section" id="social-profiles">
      <div className="social-carousel-head">
        <div>
          <h2>Social Media Profiles</h2>
          <p>Unified handle: <strong>@sonu_saarkaar</strong> • Click any card to open in-app detailed profile view.</p>
        </div>
        <div className="social-carousel-actions">
          <button onClick={() => scrollByAmount('left')} aria-label="Scroll left">‹</button>
          <button onClick={() => scrollByAmount('right')} aria-label="Scroll right">›</button>
        </div>
      </div>

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
              <img src="/face_texture.png" alt="Sonu profile" className="social-avatar" />
              <div>
                <h3>{platform.name}</h3>
                <span>{platform.handle}</span>
              </div>
            </div>

            <p>{platform.headline}</p>

            <div className="social-chip-row">
              <span className="social-chip">@sonu_saarkaar</span>
              <span className="social-chip">Live Profile</span>
            </div>

            <button
              className="social-open-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/portfolio/social/${platform.id}`)
              }}
            >
              View Detailed Profile
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
