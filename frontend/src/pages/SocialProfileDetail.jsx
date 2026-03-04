import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SOCIAL_BY_ID } from '../data/socialProfiles'
import './SocialProfileDetail.css'

const PROFILE_PRESETS = {
  instagram: {
    name: 'sonu_saarkaar',
    title: 'AI Engineer | Virtual Office Creator',
    bioLine1: 'ALHAMDULILLAH! I\'M BORN AN UMMATI OF ﷺ',
    bioLine2: 'Building premium digital experiences with clarity ✦',
    followers: '678',
    following: '312',
    posts: '19',
    avatarUrl: '/profile/sonu-boss.png?v=2',
    highlights: ['+ Add New', 'Meeeh', 'bhanjaa', 'Frnds_Zone', 'love', '₹Show_off', 'Selfii', 'Reels'],
    postImages: [
      'https://picsum.photos/seed/saarkaar-01/900/900',
      'https://picsum.photos/seed/saarkaar-02/900/900',
      'https://picsum.photos/seed/saarkaar-03/900/900',
      'https://picsum.photos/seed/saarkaar-04/900/900',
      'https://picsum.photos/seed/saarkaar-05/900/900',
      'https://picsum.photos/seed/saarkaar-06/900/900',
      'https://picsum.photos/seed/saarkaar-07/900/900',
      'https://picsum.photos/seed/saarkaar-08/900/900',
      'https://picsum.photos/seed/saarkaar-09/900/900'
    ]
  },
  x: {
    name: 'sonu_saarkaar',
    title: 'Founder | AI Systems Builder',
    bioLine1: 'Short updates on product, AI, and architecture.',
    bioLine2: 'Ship fast. Think deep. Build meaningful.',
    followers: '420',
    following: '120',
    posts: '143',
    avatarUrl: '/profile/sonu-boss.png?v=2',
    highlights: ['+ Add New', 'Pinned', 'Media', 'Announcements', 'Threads', 'BuildLogs'],
    postImages: [
      'https://picsum.photos/seed/x-01/900/900',
      'https://picsum.photos/seed/x-02/900/900',
      'https://picsum.photos/seed/x-03/900/900',
      'https://picsum.photos/seed/x-04/900/900',
      'https://picsum.photos/seed/x-05/900/900',
      'https://picsum.photos/seed/x-06/900/900'
    ]
  },
  threads: {
    name: 'sonu_saarkaar',
    title: 'Designing Future-Ready Interfaces',
    bioLine1: 'Human-first conversations, tech-first execution.',
    bioLine2: 'Professional creator profile.',
    followers: '301',
    following: '210',
    posts: '86',
    avatarUrl: '/profile/sonu-boss.png?v=2',
    highlights: ['+ Add New', 'Ideas', 'Replies', 'Visuals', 'Notes', 'Launches'],
    postImages: [
      'https://picsum.photos/seed/threads-01/900/900',
      'https://picsum.photos/seed/threads-02/900/900',
      'https://picsum.photos/seed/threads-03/900/900',
      'https://picsum.photos/seed/threads-04/900/900',
      'https://picsum.photos/seed/threads-05/900/900',
      'https://picsum.photos/seed/threads-06/900/900'
    ]
  },
  default: {
    name: 'sonu_saarkaar',
    title: 'AI Engineer | Virtual Office Creator',
    bioLine1: 'Professional digital profile with premium presentation.',
    bioLine2: 'Focused on design, code quality, and product impact.',
    followers: '500+',
    following: '250+',
    posts: '24',
    avatarUrl: '/profile/sonu-boss.png?v=2',
    highlights: ['+ Add New', 'Work', 'Projects', 'Reels', 'Events', 'Gallery'],
    postImages: [
      'https://picsum.photos/seed/default-01/900/900',
      'https://picsum.photos/seed/default-02/900/900',
      'https://picsum.photos/seed/default-03/900/900',
      'https://picsum.photos/seed/default-04/900/900',
      'https://picsum.photos/seed/default-05/900/900',
      'https://picsum.photos/seed/default-06/900/900'
    ]
  }
}

const LIVE_PROFILE_URLS = {
  github: 'https://github.com/sonu_saarkaar',
  x: 'https://x.com/sonu_saarkaar',
  threads: 'https://www.threads.net/@sonu_saarkaar',
  instagram: 'https://www.instagram.com/sonu_saarkaar/',
  facebook: 'https://www.facebook.com/sonu_saarkaar',
  whatsapp: 'https://web.whatsapp.com/send?phone=919798299944',
  leetcode: 'https://leetcode.com/sonu_saarkaar/',
  website: 'https://saarkaar.in',
  gmail: 'https://mail.google.com/mail/?view=cm&fs=1&to=sonusaarkaar@gmail.com',
  phone: 'tel:+919798299944'
}

export default function SocialProfileDetail() {
  const { platform } = useParams()
  const navigate = useNavigate()
  const profile = SOCIAL_BY_ID[platform]
  const [selectedPost, setSelectedPost] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [formState, setFormState] = useState(null)

  const accent = '#3b82f6'

  const preset = useMemo(() => {
    return PROFILE_PRESETS[platform] || PROFILE_PRESETS.default
  }, [platform])

  const storageKey = useMemo(() => `social-profile-editor:${platform}`, [platform])

  useEffect(() => {
    if (!profile) return

    const initial = {
      ...preset,
      highlightsText: (preset.highlights || []).join(', '),
      profileUrl: LIVE_PROFILE_URLS[platform] || profile.profileUrl
    }

    try {
      const saved = window.localStorage.getItem(storageKey)
      if (saved) {
        setFormState({ ...initial, ...JSON.parse(saved) })
        return
      }
    } catch {
    }

    setFormState(initial)
  }, [platform, profile, preset, storageKey])

  useEffect(() => {
    if (!formState) return

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(formState))
    } catch {
    }
  }, [formState, storageKey])

  if (!profile || !formState) {
    return (
      <div className="social-ig-page">
        <div className="social-ig-not-found">
          <h2>Profile not found</h2>
          <button onClick={() => navigate('/portfolio')}>Back to Portfolio</button>
        </div>
      </div>
    )
  }

  const highlights = (formState.highlightsText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const onFieldChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div
      className="social-ig-page"
      style={{
        '--ig-accent': accent,
        '--ig-gradient': 'linear-gradient(145deg, #07090f 0%, #070a13 42%, #0c1220 100%)'
      }}
    >
      <div className="social-ig-shell">
        <header className="social-ig-topbar glass-card">
          <button className="icon-btn" onClick={() => navigate('/portfolio')} aria-label="Go back">←</button>
          <div className="topbar-user-block">
            <h1>{formState.name}</h1>
            <span className="verified-badge" title="Verified">✓</span>
          </div>
          <div className="topbar-icons">
            <button className="icon-btn" aria-label="Notifications">🔔</button>
            <button className="icon-btn" aria-label="Settings">⚙️</button>
          </div>
        </header>

        <section className="social-ig-profile glass-card">
          <div className="profile-avatar-wrap">
            <img src={formState.avatarUrl} alt="Profile" />
          </div>

          <div className="profile-content">
            <h2>{formState.name}</h2>
            <p className="profile-title">{formState.title}</p>
            <p className="profile-bio">{formState.bioLine1}</p>
            <p className="profile-bio">{formState.bioLine2}</p>

            <div className="profile-stats">
              <div><strong>{formState.posts}</strong><span>Posts</span></div>
              <div><strong>{formState.followers}</strong><span>Followers</span></div>
              <div><strong>{formState.following}</strong><span>Following</span></div>
            </div>

            <div className="profile-actions">
              <button type="button" onClick={() => setEditorOpen((prev) => !prev)}>Edit Profile</button>
              <button type="button" onClick={() => navigate('/admin')}>Admin Panel</button>
            </div>
          </div>
        </section>

        <section className="social-ig-highlights glass-card">
          <h3>Highlights</h3>
          <div className="highlights-row">
            {highlights.map((item) => (
              <article key={item} className="highlight-item" title={item}>
                <div className="highlight-ring">
                  <div className="highlight-core">{item.startsWith('+') ? '+' : item.charAt(0).toUpperCase()}</div>
                </div>
                <span>{item}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="social-ig-posts glass-card">
          <div className="posts-head">
            <h3>Posts</h3>
            <a href={formState.profileUrl} target="_blank" rel="noopener noreferrer">Open Original Profile ↗</a>
          </div>

          <div className="posts-grid">
            {formState.postImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className="post-card"
                onClick={() => setSelectedPost(image)}
                aria-label={`Open post ${index + 1}`}
              >
                <img src={image} alt={`Post ${index + 1}`} loading="lazy" />
                <span className="gallery-mark">▣</span>
              </button>
            ))}
          </div>
        </section>

        {editorOpen ? (
          <section className="social-editor glass-card">
            <h3>Edit Content</h3>
            <div className="editor-grid">
              <label>
                Username
                <input value={formState.name} onChange={(e) => onFieldChange('name', e.target.value)} />
              </label>
              <label>
                Title
                <input value={formState.title} onChange={(e) => onFieldChange('title', e.target.value)} />
              </label>
              <label className="wide">
                Bio Line 1
                <input value={formState.bioLine1} onChange={(e) => onFieldChange('bioLine1', e.target.value)} />
              </label>
              <label className="wide">
                Bio Line 2
                <input value={formState.bioLine2} onChange={(e) => onFieldChange('bioLine2', e.target.value)} />
              </label>
              <label>
                Posts Count
                <input value={formState.posts} onChange={(e) => onFieldChange('posts', e.target.value)} />
              </label>
              <label>
                Followers Count
                <input value={formState.followers} onChange={(e) => onFieldChange('followers', e.target.value)} />
              </label>
              <label>
                Following Count
                <input value={formState.following} onChange={(e) => onFieldChange('following', e.target.value)} />
              </label>
              <label>
                Avatar URL
                <input value={formState.avatarUrl} onChange={(e) => onFieldChange('avatarUrl', e.target.value)} />
              </label>
              <label className="wide">
                Highlights (comma separated)
                <input value={formState.highlightsText} onChange={(e) => onFieldChange('highlightsText', e.target.value)} />
              </label>
            </div>
          </section>
        ) : null}
      </div>

      {selectedPost ? (
        <div className="post-modal-backdrop" onClick={() => setSelectedPost(null)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPost(null)}>×</button>
            <img src={selectedPost} alt="Selected post preview" />
          </div>
        </div>
      ) : null}
    </div>
  )
}
