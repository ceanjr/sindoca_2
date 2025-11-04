'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Play, Pause, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'

interface VoiceRecorderProps {
  onSave: (blob: Blob, duration: number) => void
  maxDuration?: number // in seconds
}

export default function VoiceRecorder({ onSave, maxDuration = 120 }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [duration, setDuration] = useState(0)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1
          if (newDuration >= maxDuration) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Erro ao acessar microfone', {
        description: 'Verifique as permissões do navegador',
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }

  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setDuration((prev) => {
            const newDuration = prev + 1
            if (newDuration >= maxDuration) {
              stopRecording()
            }
            return newDuration
          })
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
      setIsPaused(!isPaused)
    }
  }

  const deleteRecording = () => {
    setAudioBlob(null)
    setAudioUrl('')
    setDuration(0)
    setPlaybackTime(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const togglePlayback = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(audioRef.current?.currentTime || 0)
      }
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setPlaybackTime(0)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSend = () => {
    if (audioBlob) {
      onSave(audioBlob, duration)
      deleteRecording()
      toast.success('Áudio enviado! 🎤')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-surface rounded-3xl p-6 shadow-soft-lg">
      <AnimatePresence mode="wait">
        {!isRecording && !audioBlob ? (
          // Initial State
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="text-textSecondary mb-6">
              Grave uma mensagem de voz especial
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-soft-md mx-auto"
            >
              <Mic size={32} />
            </motion.button>
            <p className="text-xs text-textSecondary mt-4">
              Máximo: {maxDuration}s
            </p>
          </motion.div>
        ) : isRecording ? (
          // Recording State
          <motion.div
            key="recording"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Waveform Animation */}
            <div className="flex items-center justify-center gap-1 h-20">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{
                    height: isPaused ? '20%' : ['20%', '100%', '20%'],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              <p className="text-4xl font-bold text-textPrimary">
                {formatTime(duration)}
              </p>
              <p className="text-sm text-textSecondary mt-1">
                {isPaused ? 'Pausado' : 'Gravando...'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePause}
                className="w-14 h-14 bg-surfaceAlt rounded-full flex items-center justify-center"
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={stopRecording}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-glow"
              >
                <Square size={28} fill="white" />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          // Playback State
          <motion.div
            key="playback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-2 bg-surfaceAlt rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(playbackTime / duration) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-textSecondary">
                <span>{formatTime(playbackTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={deleteRecording}
                className="w-14 h-14 bg-surfaceAlt rounded-full flex items-center justify-center text-red-500"
              >
                <Trash2 size={24} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={togglePlayback}
                className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-soft-md"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white"
              >
                <Send size={24} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
