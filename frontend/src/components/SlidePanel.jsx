import { useState } from 'react'
import './SlidePanel.css'

export default function SlidePanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(null)

  const sections = {
    about: {
      title: 'About',
      content: 'Welcome to SAARKAAR. This is a virtual office experience designed to create a professional, human connection.'
    },
    journey: {
      title: 'Journey',
      content: 'A journey of growth, learning, and building meaningful solutions.'
    },
    projects: {
      title: 'Projects',
      content: 'Explore the portfolio of innovative projects and solutions.'
    },
    resume: {
      title: 'Resume',
      content: 'Download or view the professional resume tailored to your needs.'
    },
    contact: {
      title: 'Contact',
      content: 'Get in touch for collaborations, opportunities, or inquiries.'
    }
  }

  return (
    <>
      <div className={`slide-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>Explore</h2>
          <button className="close-button" onClick={() => setIsOpen(false)}>
            ×
          </button>
        </div>
        
        <div className="panel-content">
          {Object.entries(sections).map(([key, section]) => (
            <div
              key={key}
              className={`panel-section ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(activeSection === key ? null : key)}
            >
              <h3>{section.title}</h3>
              {activeSection === key && (
                <div className="section-content">
                  <p>{section.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {!isOpen && (
        <div className="panel-trigger" onClick={() => setIsOpen(true)}>
          <div className="trigger-handle">
            <span>→</span>
          </div>
        </div>
      )}
    </>
  )
}
