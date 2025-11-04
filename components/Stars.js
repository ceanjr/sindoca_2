'use client'

import { useEffect, useRef } from 'react'

export default function Stars() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create stars
    const starCount = 150
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div')
      star.className = 'absolute w-[3px] h-[3px] bg-white rounded-full animate-pulse'
      star.style.left = `${Math.random() * 100}%`
      star.style.top = `${Math.random() * 100}%`
      star.style.animationDelay = `${Math.random() * 3}s`
      star.style.animationDuration = `${2 + Math.random() * 2}s`
      star.style.opacity = `${0.2 + Math.random() * 0.8}`
      container.appendChild(star)
    }

    return () => {
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    />
  )
}
