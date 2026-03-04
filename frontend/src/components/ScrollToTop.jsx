import { useEffect, useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop({ children }) {
  const { pathname } = useLocation()

  // Prevent browser's native scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    // 1. Reset standard window/body scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    // 2. Reset custom wrapper scroll (since body is overflow: hidden)
    const portfolioWrapper = document.querySelector('.portfolio-wrapper')
    if (portfolioWrapper) {
      portfolioWrapper.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }

    // Secondary fallback to catch any late layout shifts from dynamic rendering
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      if (portfolioWrapper) {
        portfolioWrapper.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
    })
  }, [pathname])

  return children || null
}