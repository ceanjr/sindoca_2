'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface Story {
  id: string
  author_id: string
  author_name: string
  author_avatar?: string
  content_url: string
  content_type: 'image' | 'video' | 'text'
  text_content?: string
  created_at: string
  expires_at: string
  views: string[]
  reactions: { user_id: string; emoji: string }[]
}

interface StoriesReelProps {
  workspaceId: string
  stories: Story[]
  onRefresh?: () => void
}

export default function StoriesReel({ workspaceId, stories, onRefresh }: StoriesReelProps) {
  const { user } = useAuth()
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Filter expired stories (24h)
  const activeStories = stories.filter(story => {
    const expiresAt = new Date(story.expires_at)
    return expiresAt > new Date()
  })

  // Group stories by author
  const groupedStories = activeStories.reduce((acc, story) => {
    const authorId = story.author_id
    if (!acc[authorId]) {
      acc[authorId] = {
        author_id: authorId,
        author_name: story.author_name,
        author_avatar: story.author_avatar,
        stories: [],
        hasUnviewed: false,
      }
    }
    acc[authorId].stories.push(story)
    // Check if user hasn't viewed this story
    if (!story.views.includes(user?.id || '')) {
      acc[authorId].hasUnviewed = true
    }
    return acc
  }, {} as Record<string, any>)

  const groupedStoriesArray = Object.values(groupedStories)

  // Auto-advance story after 5 seconds
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextStory()
          return 0
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [activeStoryIndex, isPaused])

  const handleNextStory = () => {
    if (activeStoryIndex === null) return

    const currentGroup = groupedStoriesArray[activeStoryIndex]
    const currentStoryInGroup = 0 // Simplificado - sempre mostra primeira story do grupo

    if (activeStoryIndex < groupedStoriesArray.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1)
      setProgress(0)
    } else {
      setActiveStoryIndex(null)
      setProgress(0)
    }
  }

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return

    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1)
      setProgress(0)
    }
  }

  const handleReaction = async (emoji: string) => {
    if (!user || activeStoryIndex === null) return

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }

    toast.success(`${emoji} enviado!`)

    // TODO: Save reaction to database
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const storyDate = new Date(date)
    const diffMs = now.getTime() - storyDate.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffHours > 0) return `${diffHours}h atrás`
    if (diffMinutes > 0) return `${diffMinutes}m atrás`
    return 'agora'
  }

  return (
    <>
      {/* Stories Preview Reel */}
      <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
        {groupedStoriesArray.map((group, index) => (
          <motion.button
            key={group.author_id}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveStoryIndex(index)
              setProgress(0)
            }}
            className="flex-shrink-0"
          >
            <div className="relative">
              {/* Avatar with gradient border */}
              <div
                className={`w-20 h-20 rounded-full p-1 ${
                  group.hasUnviewed
                    ? 'bg-primary'
                    : 'bg-gray-300'
                }`}
              >
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                  {group.author_avatar ? (
                    <img
                      src={group.author_avatar}
                      alt={group.author_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">💕</span>
                  )}
                </div>
              </div>

              {/* Story count badge */}
              {group.stories.length > 1 && (
                <div className="absolute bottom-0 right-0 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {group.stories.length}
                </div>
              )}
            </div>

            <p className="text-xs text-textPrimary mt-2 text-center truncate max-w-[80px]">
              {group.author_name}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 flex gap-1 p-4 z-10">
              {groupedStoriesArray[activeStoryIndex].stories.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white"
                    initial={{ width: '0%' }}
                    animate={{ width: i === 0 ? `${progress}%` : '0%' }}
                  />
                </div>
              ))}
            </div>

            {/* Story Header */}
            <div className="absolute top-6 left-0 right-0 p-4 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface">
                  {groupedStoriesArray[activeStoryIndex].author_avatar ? (
                    <img
                      src={groupedStoriesArray[activeStoryIndex].author_avatar}
                      alt={groupedStoriesArray[activeStoryIndex].author_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      💕
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {groupedStoriesArray[activeStoryIndex].author_name}
                  </p>
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <Clock size={12} />
                    {getTimeAgo(groupedStoriesArray[activeStoryIndex].stories[0].created_at)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveStoryIndex(null)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Story Content */}
            <div
              className="w-full h-full flex items-center justify-center"
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {groupedStoriesArray[activeStoryIndex].stories[0].content_type === 'image' ? (
                <img
                  src={groupedStoriesArray[activeStoryIndex].stories[0].content_url}
                  alt="Story"
                  className="max-w-full max-h-full object-contain"
                />
              ) : groupedStoriesArray[activeStoryIndex].stories[0].content_type === 'text' ? (
                <div className="max-w-2xl px-8 text-center">
                  <p className="text-white text-2xl font-medium">
                    {groupedStoriesArray[activeStoryIndex].stories[0].text_content}
                  </p>
                </div>
              ) : null}
            </div>

            {/* Navigation Areas */}
            <div className="absolute inset-0 flex">
              <button
                onClick={handlePrevStory}
                className="flex-1"
                aria-label="Previous story"
              />
              <button
                onClick={handleNextStory}
                className="flex-1"
                aria-label="Next story"
              />
            </div>

            {/* Reaction Bar */}
            <div className="absolute bottom-8 left-0 right-0 px-8">
              <div className="bg-white/10 backdrop-blur-md rounded-full p-4 flex items-center justify-around max-w-md mx-auto">
                {['❤️', '😍', '🔥', '👏', '😂'].map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileTap={{ scale: 1.3 }}
                    onClick={() => handleReaction(emoji)}
                    className="text-3xl hover:scale-110 transition-transform"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
