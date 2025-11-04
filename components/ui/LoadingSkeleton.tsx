'use client'

import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'avatar' | 'image' | 'button' | 'custom'
  width?: string
  height?: string
  className?: string
  count?: number
}

export default function LoadingSkeleton({
  variant = 'card',
  width,
  height,
  className = '',
  count = 1,
}: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case 'avatar':
        return (
          <div className={`w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 ${className}`} />
        )

      case 'text':
        return (
          <div
            className={`h-4 bg-gray-200 dark:bg-gray-700 rounded ${className}`}
            style={{ width: width || '100%' }}
          />
        )

      case 'image':
        return (
          <div
            className={`bg-gray-200 dark:bg-gray-700 rounded-2xl ${className}`}
            style={{
              width: width || '100%',
              height: height || '200px',
            }}
          />
        )

      case 'button':
        return (
          <div
            className={`h-12 bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}
            style={{ width: width || '120px' }}
          />
        )

      case 'card':
        return (
          <div className={`bg-surface rounded-3xl p-6 shadow-soft-lg ${className}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            </div>
          </div>
        )

      case 'custom':
        return (
          <div
            className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
            style={{
              width: width || '100%',
              height: height || '100px',
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="animate-pulse"
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </>
  )
}

// Pre-built skeleton components
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return <LoadingSkeleton variant="card" count={count} />
}

export function GallerySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} variant="image" height="250px" />
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-6">
      <LoadingSkeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" width="60%" />
        <LoadingSkeleton variant="text" width="40%" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <LoadingSkeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="70%" />
            <LoadingSkeleton variant="text" width="50%" />
          </div>
        </div>
      ))}
    </div>
  )
}
