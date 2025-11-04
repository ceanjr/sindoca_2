'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  disabled?: boolean
}

export default function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [canPull, setCanPull] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const maxPull = 150

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || isRefreshing) return

      // Only allow pull if at top of page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        pulling.current = true
        setCanPull(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!pulling.current || !canPull || disabled || isRefreshing) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      if (distance > 0) {
        // Prevent default scroll behavior
        e.preventDefault()

        // Apply resistance curve (gets harder to pull)
        const resistance = 0.5
        const adjustedDistance = Math.min(distance * resistance, maxPull)
        setPullDistance(adjustedDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!pulling.current || disabled) return

      pulling.current = false
      setCanPull(false)

      if (pullDistance >= maxPull * 0.8) {
        // Trigger refresh
        setIsRefreshing(true)
        setPullDistance(maxPull * 0.5)

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50)
        }

        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh error:', error)
        } finally {
          setIsRefreshing(false)
          setPullDistance(0)
        }
      } else {
        // Reset
        setPullDistance(0)
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, canPull, disabled, isRefreshing, onRefresh])

  const pullProgress = Math.min((pullDistance / (maxPull * 0.8)) * 100, 100)
  const showIndicator = pullDistance > 0 || isRefreshing

  return (
    <div className="relative">
      {/* Pull Indicator */}
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              transform: `translateY(${Math.min(pullDistance, maxPull * 0.5)}px)`,
            }}
            className="fixed top-0 left-0 right-0 z-50 flex justify-center"
          >
            <div className="bg-surface/90 backdrop-blur-md rounded-full px-6 py-3 shadow-soft-lg flex items-center gap-3 mt-4">
              <motion.div
                animate={{
                  rotate: isRefreshing ? 360 : pullProgress * 3.6,
                }}
                transition={{
                  duration: isRefreshing ? 1 : 0,
                  repeat: isRefreshing ? Infinity : 0,
                  ease: 'linear',
                }}
              >
                <RefreshCw
                  size={24}
                  className={isRefreshing ? 'text-primary' : 'text-textSecondary'}
                />
              </motion.div>

              <div className="text-sm font-medium text-textPrimary">
                {isRefreshing
                  ? 'Atualizando...'
                  : pullProgress >= 100
                  ? 'Solte para atualizar'
                  : 'Puxe para atualizar'}
              </div>

              {/* Progress Ring */}
              {!isRefreshing && (
                <svg className="w-8 h-8 -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-surfaceAlt"
                  />
                  <motion.circle
                    cx="16"
                    cy="16"
                    r="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-primary"
                    strokeDasharray={`${2 * Math.PI * 14}`}
                    strokeDashoffset={`${2 * Math.PI * 14 * (1 - pullProgress / 100)}`}
                  />
                </svg>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        style={{
          transform: showIndicator
            ? `translateY(${Math.min(pullDistance * 0.3, 30)}px)`
            : 'translateY(0)',
          transition: pulling.current ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
