// src/components/Dashboard/BackgroundSelector.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Image, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Clock, 
  Palette,
  Sun,
  Moon,
  Cloud,
  TreePine,
  Coffee,
  BookOpen,
  Mountain,
  Waves
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'

const BackgroundSelector = ({ title = "Ambience" }) => {
  const { settings, updateSettings } = useUser()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElements, setAudioElements] = useState({})

  const backgrounds = [
    {
      id: 'forest',
      name: 'Peaceful Forest',
      description: 'Serene woodland setting',
      icon: TreePine,
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      timeOfDay: 'morning',
      color: '#4ade80',
      soundscape: 'nature'
    },
    {
      id: 'lake',
      name: 'Serene Lake',
      description: 'Calm waters and reflection',
      icon: Waves,
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      timeOfDay: 'afternoon',
      color: '#0ea5e9',
      soundscape: 'water'
    },
    {
      id: 'mountains',
      name: 'Mountain Vista',
      description: 'Majestic peaks and valleys',
      icon: Mountain,
      url: 'https://images.unsplash.com/photo-1464822759844-d150baec0494?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      timeOfDay: 'evening',
      color: '#8b5cf6',
      soundscape: 'wind'
    },
    {
      id: 'library',
      name: 'Cozy Library',
      description: 'Warm study atmosphere',
      icon: BookOpen,
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      timeOfDay: 'any',
      color: '#f59e0b',
      soundscape: 'cafe'
    },
    {
      id: 'cafe',
      name: 'Coffee Shop',
      description: 'Bustling café environment',
      icon: Coffee,
      url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      timeOfDay: 'any',
      color: '#a78bfa',
      soundscape: 'cafe'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and distraction-free',
      icon: Palette,
      url: null, // Solid color background
      timeOfDay: 'any',
      color: '#6b7280',
      soundscape: null
    }
  ]

  const soundscapes = [
    {
      id: 'rain',
      name: 'Gentle Rain',
      description: 'Soft rainfall sounds',
      icon: Cloud,
      url: '/sounds/rain.mp3'
    },
    {
      id: 'cafe',
      name: 'Coffee Shop',
      description: 'Ambient café atmosphere',
      icon: Coffee,
      url: '/sounds/cafe.mp3'
    },
    {
      id: 'nature',
      name: 'Forest Sounds',
      description: 'Birds and gentle wind',
      icon: TreePine,
      url: '/sounds/nature.mp3'
    },
    {
      id: 'piano',
      name: 'Soft Piano',
      description: 'Peaceful instrumental music',
      icon: '🎹',
      url: '/sounds/piano.mp3'
    },
    {
      id: 'water',
      name: 'Flowing Water',
      description: 'Gentle stream sounds',
      icon: Waves,
      url: '/sounds/water.mp3'
    },
    {
      id: 'wind',
      name: 'Mountain Breeze',
      description: 'Soft wind through trees',
      icon: '🌬️',
      url: '/sounds/wind.mp3'
    }
  ]

  // Update time every minute for adaptive backgrounds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Initialize audio elements
  useEffect(() => {
    const audioMap = {}
    soundscapes.forEach(sound => {
      if (sound.url) {
        const audio = new Audio(sound.url)
        audio.loop = true
        audio.volume = settings?.volumes?.soundscape || 0.5
        audioMap[sound.id] = audio
      }
    })
    setAudioElements(audioMap)

    return () => {
      // Cleanup audio elements
      Object.values(audioMap).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [])

  // Update audio volume when settings change
  useEffect(() => {
    Object.values(audioElements).forEach(audio => {
      audio.volume = settings?.volumes?.soundscape || 0.5
    })
  }, [settings?.volumes?.soundscape, audioElements])

  const getTimeOfDayIcon = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return Sun
    if (hour >= 12 && hour < 18) return Sun
    return Moon
  }

  const getTimeOfDay = () => {
    const hour = currentTime.getHours()
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    return 'evening'
  }

  const getAdaptiveBackground = () => {
    const timeOfDay = getTimeOfDay()
    return backgrounds.find(bg => bg.timeOfDay === timeOfDay) || backgrounds[0]
  }

  const selectBackground = (background) => {
    updateSettings({
      selectedBackground: background.id
    })

    // Update document background
    if (background.url) {
      document.body.style.backgroundImage = `url(${background.url})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundAttachment = 'fixed'
    } else {
      document.body.style.backgroundImage = 'none'
      document.body.style.backgroundColor = background.color
    }

    // Auto-suggest matching soundscape
    if (background.soundscape) {
      const matchingSoundscape = soundscapes.find(s => s.id === background.soundscape)
      if (matchingSoundscape) {
        selectSoundscape(matchingSoundscape)
      }
    }
  }

  const selectSoundscape = async (soundscape) => {
    // Stop current audio
    Object.values(audioElements).forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })

    updateSettings({
      selectedSoundscape: soundscape.id
    })

    // Play new soundscape
    if (soundscape.id && audioElements[soundscape.id]) {
      try {
        await audioElements[soundscape.id].play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Failed to play soundscape:', error)
      }
    } else {
      setIsPlaying(false)
    }
  }

  const toggleSoundscape = async () => {
    const currentSoundscape = settings?.selectedSoundscape
    if (!currentSoundscape || !audioElements[currentSoundscape]) return

    const audio = audioElements[currentSoundscape]
    
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Failed to play soundscape:', error)
      }
    }
  }

  const shuffleBackground = () => {
    const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)]
    selectBackground(randomBackground)
  }

  const useAdaptiveBackground = () => {
    const adaptiveBackground = getAdaptiveBackground()
    selectBackground(adaptiveBackground)
  }

  const selectedBackground = backgrounds.find(bg => bg.id === settings?.selectedBackground) || backgrounds[0]
  const selectedSoundscape = soundscapes.find(s => s.id === settings?.selectedSoundscape) || soundscapes[0]
  const TimeIcon = getTimeOfDayIcon()

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text flex items-center">
            <Image className="mr-2 h-5 w-5" />
            {title}
          </h3>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={useAdaptiveBackground}
              size="sm"
              variant="ghost"
              className="flex items-center"
              title="Use time-based background"
            >
              <TimeIcon className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={shuffleBackground}
              size="sm"
              variant="ghost"
              className="flex items-center"
              title="Random background"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Selection Display */}
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-lg bg-card-border h-32">
            {selectedBackground.url ? (
              <img
                src={selectedBackground.url}
                alt={selectedBackground.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: selectedBackground.color }}
              >
                <selectedBackground.icon className="h-12 w-12 text-white opacity-50" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className="absolute bottom-3 left-3 text-white">
              <p className="font-medium">{selectedBackground.name}</p>
              <p className="text-sm opacity-90">{selectedBackground.description}</p>
            </div>

            {/* Time indicator */}
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm rounded-full p-2">
              <TimeIcon className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Background Grid */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text mb-3">Backgrounds</h4>
          <div className="grid grid-cols-3 gap-2">
            {backgrounds.map((background) => {
              const Icon = background.icon
              const isSelected = selectedBackground.id === background.id
              
              return (
                <motion.button
                  key={background.id}
                  onClick={() => selectBackground(background)}
                  className={`relative overflow-hidden rounded-lg aspect-video transition-all ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                      : 'hover:scale-105'
                  }`}
                  whileHover={{ scale: isSelected ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {background.url ? (
                    <img
                      src={background.url}
                      alt={background.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: background.color }}
                    >
                      <Icon className="h-6 w-6 text-white opacity-70" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 bg-primary text-white rounded-full p-1"
                    >
                      <Icon className="h-3 w-3" />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Soundscape Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-text">Soundscapes</h4>
            <Button
              onClick={toggleSoundscape}
              size="sm"
              variant="ghost"
              className="flex items-center"
            >
              {isPlaying ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-text-secondary" />
              )}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {soundscapes.map((soundscape) => {
              const Icon = soundscape.icon
              const isSelected = selectedSoundscape.id === soundscape.id
              
              return (
                <motion.button
                  key={soundscape.id}
                  onClick={() => selectSoundscape(soundscape)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border bg-background hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {typeof Icon === 'string' ? (
                      <span className="text-lg">{Icon}</span>
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="font-medium text-sm">{soundscape.name}</span>
                  </div>
                  <p className="text-xs opacity-75">{soundscape.description}</p>
                  
                  {isSelected && isPlaying && (
                    <motion.div
                      className="flex items-center mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1 bg-current rounded-full"
                            style={{ height: '4px' }}
                            animate={{
                              height: ['4px', '12px', '4px'],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs ml-2">Playing</span>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Volume Control */}
          {selectedSoundscape && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-3 bg-background rounded-lg border border-card-border"
            >
              <div className="flex items-center space-x-2">
                <VolumeX className="h-4 w-4 text-text-secondary" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings?.volumes?.soundscape || 0.5}
                  onChange={(e) => updateSettings({
                    volumes: {
                      ...settings?.volumes,
                      soundscape: parseFloat(e.target.value)
                    }
                  })}
                  className="flex-1 accent-primary"
                />
                <Volume2 className="h-4 w-4 text-text-secondary" />
              </div>
              <p className="text-xs text-text-secondary mt-1 text-center">
                Volume: {Math.round((settings?.volumes?.soundscape || 0.5) * 100)}%
              </p>
            </motion.div>
          )}
        </div>

        {/* Adaptive Mode Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg"
        >
          <div className="flex items-center space-x-2 text-primary">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Adaptive Mode</span>
          </div>
          <p className="text-xs text-primary/80 mt-1">
            Backgrounds automatically change based on time of day. Current: {getTimeOfDay()}
          </p>
        </motion.div>
      </div>
    </Card>
  )
}

export default BackgroundSelector
