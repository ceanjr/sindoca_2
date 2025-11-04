'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MapPin, Calendar, Camera, Music, Gift, Star } from 'lucide-react'

interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  type: 'meeting' | 'date' | 'milestone' | 'memory' | 'special'
  icon?: any
  color?: string
  images?: string[]
  location?: string
}

interface InteractiveTimelineProps {
  events: TimelineEvent[]
}

const eventIcons = {
  meeting: Heart,
  date: Calendar,
  milestone: Star,
  memory: Camera,
  special: Gift,
}

const eventColors = {
  meeting: 'bg-pink-500',
  date: 'bg-purple-500',
  milestone: 'bg-yellow-500',
  memory: 'bg-blue-500',
  special: 'bg-green-500',
}

export default function InteractiveTimeline({ events }: InteractiveTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getTimeSince = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffYears > 0) return `${diffYears} ${diffYears === 1 ? 'ano' : 'anos'} atrás`
    if (diffMonths > 0) return `${diffMonths} ${diffMonths === 1 ? 'mês' : 'meses'} atrás`
    if (diffDays > 0) return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} atrás`
    return 'Hoje'
  }

  return (
    <>
      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-primary opacity-30" />

        {/* Events */}
        <div className="space-y-8">
          {sortedEvents.map((event, index) => {
            const Icon = eventIcons[event.type]
            const gradientColor = eventColors[event.type]
            const isHovered = hoveredEvent === event.id

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
                className="relative pl-20"
              >
                {/* Timeline Dot */}
                <motion.div
                  animate={{
                    scale: isHovered ? 1.3 : 1,
                  }}
                  className={`absolute left-4 top-4 w-10 h-10 ${gradientColor} rounded-full flex items-center justify-center text-white shadow-soft-md z-10`}
                >
                  <Icon size={20} />
                </motion.div>

                {/* Event Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-surface rounded-3xl p-6 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 cursor-pointer border border-textPrimary/10"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-textPrimary mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-textSecondary flex items-center gap-2">
                        <Calendar size={14} />
                        {formatDate(event.date)}
                        <span className="text-xs opacity-70">
                          ({getTimeSince(event.date)})
                        </span>
                      </p>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-1 text-textSecondary text-sm">
                        <MapPin size={14} />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-textSecondary mb-4">{event.description}</p>

                  {/* Images Preview */}
                  {event.images && event.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                      {event.images.slice(0, 4).map((img, i) => (
                        <div
                          key={i}
                          className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden"
                        >
                          <img
                            src={img}
                            alt={`${event.title} ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {i === 3 && event.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                              +{event.images.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tag */}
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${gradientColor} text-white`}
                    >
                      <Icon size={12} />
                      {event.type === 'meeting' && 'Encontro'}
                      {event.type === 'date' && 'Date'}
                      {event.type === 'milestone' && 'Marco'}
                      {event.type === 'memory' && 'Memória'}
                      {event.type === 'special' && 'Especial'}
                    </span>
                  </div>
                </motion.div>

                {/* Connector Line to Next Event */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-8 bg-textPrimary/20" />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Empty State */}
        {sortedEvents.length === 0 && (
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-block mb-4 text-6xl"
            >
              📅
            </motion.div>
            <h3 className="text-2xl font-bold text-textPrimary mb-2">
              Nenhum evento ainda
            </h3>
            <p className="text-textSecondary">
              Adicione seus momentos especiais para criar sua linha do tempo
            </p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="float-right w-10 h-10 rounded-full bg-surfaceAlt flex items-center justify-center hover:bg-gray-300 transition-colors"
              >
                ×
              </button>

              {/* Content */}
              <div className="clear-both">
                <div
                  className={`w-16 h-16 ${
                    eventColors[selectedEvent.type]
                  } rounded-2xl flex items-center justify-center text-white mb-6`}
                >
                  {(() => {
                    const Icon = eventIcons[selectedEvent.type]
                    return <Icon size={32} />
                  })()}
                </div>

                <h2 className="text-3xl font-bold text-textPrimary mb-2">
                  {selectedEvent.title}
                </h2>

                <div className="flex flex-wrap gap-4 text-textSecondary mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{formatDate(selectedEvent.date)}</span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{selectedEvent.location}</span>
                    </div>
                  )}
                </div>

                <p className="text-textSecondary text-lg mb-6">
                  {selectedEvent.description}
                </p>

                {/* Full Images Grid */}
                {selectedEvent.images && selectedEvent.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEvent.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative aspect-video rounded-2xl overflow-hidden"
                      >
                        <img
                          src={img}
                          alt={`${selectedEvent.title} ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
