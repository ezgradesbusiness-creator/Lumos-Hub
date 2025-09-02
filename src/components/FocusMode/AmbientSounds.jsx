// src/components/FocusMode/AmbientSounds.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  RotateCcw,
  Settings,
  Download,
  Headphones,
  Cloud,
  TreePine,
  Coffee,
  Waves,
  Wind,
  Zap,
  Moon,
  Sun,
  Music,
  Heart,
  Eye,
  Brain
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'

const AmbientSounds = ({ compact = false, className = '' }) => {
  const { settings, updateSettings } = useUser()
  const [activeSounds, setActiveSounds] = useState([])
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showMixer, setShowMixer] = useState(false)
  const [audioElements, setAudioElements] = useState({})
  const [loadingStates, setLoadingStates] = useState({})
  const [currentPreset, setCurrentPreset] = useState('none')
  const audioContext = useRef(null)

  // Sound categories with individual volume controls
  const soundCategories = [
    {
      id: 'nature',
      name: 'Nature Sounds',
      icon: TreePine,
      color: 'text-green-500',
      sounds: [
        {
          id: 'rain',
          name: 'Gentle Rain',
          description: 'Light rainfall on leaves',
          icon: '🌧️',
          url: '/sounds/rain.mp3',
          volume: 0.6,
          loop: true
        },
        {
          id: 'forest',
          name: 'Forest Ambience',
          description: 'Birds and rustling leaves',
          icon: '🌲',
          url: '/sounds/forest.mp3',
          volume: 0.5,
          loop: true
        },
        {
          id: 'ocean',
          name: 'Ocean Waves',
          description: 'Gentle waves on shore',
          icon: '🌊',
          url: '/sounds/ocean.mp3',
          volume: 0.7,
          loop: true
        },
        {
          id: 'wind',
          name: 'Mountain Wind',
          description: 'Soft breeze through trees',
          icon: '💨',
          url: '/sounds/wind.mp3',
          volume: 0.4,
          loop: true
        },
        {
          id: 'thunder',
          name: 'Distant Thunder',
          description: 'Gentle rumbling storms',
          icon: '⛈️',
          url: '/sounds/thunder.mp3',
          volume: 0.3,
          loop: true
        }
      ]
    },
    {
      id: 'urban',
      name: 'Urban Ambience',
      icon: Coffee,
      color: 'text-amber-500',
      sounds: [
        {
          id: 'cafe',
          name: 'Coffee Shop',
          description: 'Bustling café atmosphere',
          icon: '☕',
          url: '/sounds/cafe.mp3',
          volume: 0.5,
          loop: true
        },
        {
          id: 'library',
          name: 'Quiet Library',
          description: 'Subtle page turning and whispers',
          icon: '📚',
          url: '/sounds/library.mp3',
          volume: 0.3,
          loop: true
        },
        {
          id: 'train',
          name: 'Train Journey',
          description: 'Rhythmic train on tracks',
          icon: '🚂',
          url: '/sounds/train.mp3',
          volume: 0.6,
          loop: true
        },
        {
          id: 'fireplace',
          name: 'Crackling Fire',
          description: 'Warm fireplace sounds',
          icon: '🔥',
          url: '/sounds/fireplace.mp3',
          volume: 0.5,
          loop: true
        }
      ]
    },
    {
      id: 'musical',
      name: 'Musical Tones',
      icon: Music,
      color: 'text-purple-500',
      sounds: [
        {
          id: 'piano',
          name: 'Soft Piano',
          description: 'Gentle piano melodies',
          icon: '🎹',
          url: '/sounds/piano.mp3',
          volume: 0.4,
          loop: true
        },
        {
          id: 'bells',
          name: 'Tibetan Bowls',
          description: 'Resonant singing bowls',
          icon: '🎎',
          url: '/sounds/bells.mp3',
          volume: 0.3,
          loop: true
        },
        {
          id: 'chimes',
          name: 'Wind Chimes',
          description: 'Gentle metallic tones',
          icon: '🎐',
          url: '/sounds/chimes.mp3',
          volume: 0.4,
          loop: true
        },
        {
          id: 'ambient',
          name: 'Ambient Drone',
          description: 'Deep atmospheric tones',
          icon: '〰️',
          url: '/sounds/ambient.mp3',
          volume: 0.5,
          loop: true
        }
      ]
    },
    {
      id: 'focus',
      name: 'Focus Enhancement',
      icon: Brain,
      color: 'text-blue-500',
      sounds: [
        {
          id: 'whitenoise',
          name: 'White Noise',
          description: 'Pure focus frequency',
          icon: '📶',
          url: '/sounds/whitenoise.mp3',
          volume: 0.4,
          loop: true
        },
        {
          id: 'brownnoise',
          name: 'Brown Noise',
          description: 'Deep, warm static',
          icon: '🟤',
          url: '/sounds/brownnoise.mp3',
          volume: 0.5,
          loop: true
        },
        {
          id: 'pinknoise',
          name: 'Pink Noise',
          description: 'Balanced frequency noise',
          icon: '🩷',
          url: '/sounds/pinknoise.mp3',
          volume: 0.4,
          loop: true
        },
        {
          id: 'binaural',
          name: 'Binaural Beats',
          description: 'Cognitive enhancement tones',
          icon: '🧠',
          url: '/sounds/binaural.mp3',
          volume: 0.3,
          loop: true
        }
      ]
    }
  ]

  // Preset combinations
  const presets = [
    {
      id: 'forest-rain',
      name: 'Forest Rain',
      description: 'Rain in a peaceful forest',
      icon: '🌲🌧️',
      sounds: [
        { id: 'rain', volume: 0.7 },
        { id: 'forest', volume: 0.4 }
      ]
    },
    {
      id: 'cozy-cafe',
      name: 'Cozy Café',
      description: 'Warm café with gentle rain',
      icon: '☕🌧️',
      sounds: [
        { id: 'cafe', volume: 0.6 },
        { id: 'rain', volume: 0.3 }
      ]
    },
    {
      id: 'ocean-breeze',
      name: 'Ocean Breeze',
      description: 'Waves with gentle wind',
      icon: '🌊💨',
      sounds: [
        { id: 'ocean', volume: 0.8 },
        { id: 'wind', volume: 0.3 }
      ]
    },
    {
      id: 'study-flow',
      name: 'Study Flow',
      description: 'Optimized for deep focus',
      icon: '🧠📚',
      sounds: [
        { id: 'whitenoise', volume: 0.3 },
        { id: 'piano', volume: 0.2 },
        { id: 'library', volume: 0.1 }
      ]
    },
    {
      id: 'meditation',
      name: 'Meditation',
      description: 'Peaceful mindfulness sounds',
      icon: '🧘‍♀️🎎',
      sounds: [
        { id: 'bells', volume: 0.4 },
        { id: 'ambient', volume: 0.3 },
        { id: 'wind', volume: 0.2 }
      ]
    }
  ]

  // Initialize audio elements
  useEffect(() => {
    const audioMap = {}
    soundCategories.forEach(category => {
      category.sounds.forEach(sound => {
        const audio = new Audio()
        audio.src = sound.url
        audio.loop = sound.loop
        audio.volume = 0
        audio.preload = 'metadata'
        
        // Add event listeners
        audio.addEventListener('loadstart', () => {
          setLoadingStates(prev => ({ ...prev, [sound.id]: 'loading' }))
        })
        
        audio.addEventListener('canplaythrough', () => {
          setLoadingStates(prev => ({ ...prev, [sound.id]: 'ready' }))
        })
        
        audio.addEventListener('error', () => {
          setLoadingStates(prev => ({ ...prev, [sound.id]: 'error' }))
        })
        
        audioMap[sound.id] = audio
      })
    })
    
    setAudioElements(audioMap)

    return () => {
      // Cleanup
      Object.values(audioMap).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [])

  // Update volumes when settings change
  useEffect(() => {
    Object.entries(audioElements).forEach(([soundId, audio]) => {
      const activeSound = activeSounds.find(s => s.id === soundId)
      if (activeSound && audio) {
        audio.volume = (activeSound.volume * masterVolume * (settings?.volumes?.soundscape || 1))
      }
    })
  }, [activeSounds, masterVolume, settings?.volumes?.soundscape, audioElements])

  const toggleSound = async (sound) => {
    const audio = audioElements[sound.id]
    if (!audio) return

    const isActive = activeSounds.some(s => s.id === sound.id)
    
    if (isActive) {
      // Remove from active sounds
      setActiveSounds(prev => prev.filter(s => s.id !== sound.id))
      audio.pause()
      audio.currentTime = 0
    } else {
      // Add to active sounds
      const newActiveSound = { ...sound }
      setActiveSounds(prev => [...prev, newActiveSound])
      
      try {
        audio.volume = sound.volume * masterVolume * (settings?.volumes?.soundscape || 1)
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Failed to play sound:', error)
        setActiveSounds(prev => prev.filter(s => s.id !== sound.id))
      }
    }
  }

  const updateSoundVolume = (soundId, volume) => {
    setActiveSounds(prev => 
      prev.map(sound => 
        sound.id === soundId ? { ...sound, volume } : sound
      )
    )
  }

  const togglePlayPause = async () => {
    if (isPlaying) {
      // Pause all sounds
      Object.values(audioElements).forEach(audio => {
        audio.pause()
      })
      setIsPlaying(false)
    } else {
      // Resume all active sounds
      const promises = activeSounds.map(async (sound) => {
        const audio = audioElements[sound.id]
        if (audio) {
          try {
            await audio.play()
          } catch (error) {
            console.error(`Failed to resume ${sound.id}:`, error)
          }
        }
      })
      
      await Promise.allSettled(promises)
      if (activeSounds.length > 0) {
        setIsPlaying(true)
      }
    }
  }

  const stopAllSounds = () => {
    Object.values(audioElements).forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    setActiveSounds([])
    setIsPlaying(false)
    setCurrentPreset('none')
  }

  const loadPreset = async (preset) => {
    // Stop current sounds
    stopAllSounds()
    
    // Load preset sounds
    const presetSounds = []
    for (const presetSound of preset.sounds) {
      const sound = soundCategories
        .flatMap(cat => cat.sounds)
        .find(s => s.id === presetSound.id)
      
      if (sound) {
        presetSounds.push({
          ...sound,
          volume: presetSound.volume
        })
      }
    }
    
    setActiveSounds(presetSounds)
    setCurrentPreset(preset.id)
    
    // Play all preset sounds
    const promises = presetSounds.map(async (sound) => {
      const audio = audioElements[sound.id]
      if (audio) {
        try {
          audio.volume = sound.volume * masterVolume * (settings?.volumes?.soundscape || 1)
          await audio.play()
        } catch (error) {
          console.error(`Failed to play preset sound ${sound.id}:`, error)
        }
      }
    })
    
    await Promise.allSettled(promises)
    if (presetSounds.length > 0) {
      setIsPlaying(true)
    }
  }

  const saveAsPreset = () => {
    if (activeSounds.length === 0) return
    
    const name = prompt('Preset name:')
    if (name) {
      const customPreset = {
        id: `custom-${Date.now()}`,
        name,
        description: 'Custom sound mix',
        icon: '🎛️',
        sounds: activeSounds.map(sound => ({
          id: sound.id,
          volume: sound.volume
        })),
        isCustom: true
      }
      
      // Save to localStorage
      const savedPresets = JSON.parse(localStorage.getItem('lumos-ambient-presets') || '[]')
      localStorage.setItem('lumos-ambient-presets', JSON.stringify([...savedPresets, customPreset]))
    }
  }

  const getSoundById = (soundId) => {
    return soundCategories
      .flatMap(cat => cat.sounds)
      .find(sound => sound.id === soundId)
  }

  const isActive = (soundId) => activeSounds.some(s => s.id === soundId)
  const getActiveSound = (soundId) => activeSounds.find(s => s.id === soundId)

  if (compact) {
    return (
      <Card className={`${className}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-text flex items-center">
              <Headphones className="mr-2 h-4 w-4" />
              Ambient Sounds
            </h4>
            
            <div className="flex items-center space-x-2">
              {isPlaying ? (
                <Button onClick={togglePlayPause} size="sm" variant="ghost">
                  <Pause className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={togglePlayPause} size="sm" variant="ghost" disabled={activeSounds.length === 0}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              
              <Button onClick={stopAllSounds} size="sm" variant="ghost" disabled={activeSounds.length === 0}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Sounds */}
          {activeSounds.length > 0 && (
            <div className="space-y-2 mb-4">
              {activeSounds.map(sound => (
                <div key={sound.id} className="flex items-center space-x-2">
                  <span className="text-sm">{sound.icon}</span>
                  <span className="text-sm text-text flex-1">{sound.name}</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={sound.volume}
                    onChange={(e) => updateSoundVolume(sound.id, parseFloat(e.target.value))}
                    className="w-16 accent-primary"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Master Volume */}
          <div className="flex items-center space-x-2">
            <VolumeX className="h-4 w-4 text-text-secondary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
            <Volume2 className="h-4 w-4 text-text-secondary" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text flex items-center">
              <Headphones className="mr-2 h-5 w-5" />
              Ambient Sounds
            </h3>
            <p className="text-sm text-text-secondary">Create your perfect focus environment</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={saveAsPreset}
              size="sm"
              variant="ghost"
              disabled={activeSounds.length === 0}
              title="Save current mix as preset"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={() => setShowMixer(!showMixer)}
              size="sm"
              variant="ghost"
              title="Show mixer controls"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text mb-3">Quick Presets</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {presets.map(preset => (
              <motion.button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  currentPreset === preset.id
                    ? 'border-primary bg-primary/10'
                    : 'border-card-border bg-background hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-lg">{preset.icon}</span>
                  <span className="font-medium text-sm text-text">{preset.name}</span>
                </div>
                <p className="text-xs text-text-secondary">{preset.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Sound Categories */}
        <div className="space-y-6">
          {soundCategories.map(category => {
            const CategoryIcon = category.icon
            
            return (
              <div key={category.id}>
                <h4 className={`text-sm font-medium mb-3 flex items-center ${category.color}`}>
                  <CategoryIcon className="mr-2 h-4 w-4" />
                  {category.name}
                </h4>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {category.sounds.map(sound => {
                    const active = isActive(sound.id)
                    const activeSound = getActiveSound(sound.id)
                    const loading = loadingStates[sound.id] === 'loading'
                    const error = loadingStates[sound.id] === 'error'
                    
                    return (
                      <motion.button
                        key={sound.id}
                        onClick={() => !loading && !error && toggleSound(sound)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          active
                            ? 'border-primary bg-primary/10'
                            : error
                            ? 'border-red-200 bg-red-50'
                            : 'border-card-border bg-background hover:border-primary/50'
                        } ${loading || error ? 'opacity-50 cursor-not-allowed' : ''}`}
                        whileHover={!loading && !error ? { scale: 1.02 } : {}}
                        whileTap={!loading && !error ? { scale: 0.98 } : {}}
                        disabled={loading || error}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{sound.icon}</span>
                          <span className="font-medium text-sm text-text">{sound.name}</span>
                          {loading && (
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          )}
                          {active && isPlaying && (
                            <motion.div
                              className="flex space-x-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 bg-primary rounded-full"
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
                            </motion.div>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mb-2">{sound.description}</p>
                        
                        {active && showMixer && (
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <VolumeX className="h-3 w-3 text-text-secondary" />
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={activeSound?.volume || 0}
                              onChange={(e) => updateSoundVolume(sound.id, parseFloat(e.target.value))}
                              className="flex-1 accent-primary"
                            />
                            <Volume2 className="h-3 w-3 text-text-secondary" />
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Master Controls */}
        <div className="mt-6 p-4 bg-background rounded-lg border border-card-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-text">Master Controls</h4>
            
            <div className="flex items-center space-x-2">
              {activeSounds.length > 0 && (
                <>
                  {isPlaying ? (
                    <Button onClick={togglePlayPause} size="sm">
                      <Pause className="mr-2 h-4 w-4" />
                      Pause All
                    </Button>
                  ) : (
                    <Button onClick={togglePlayPause} size="sm">
                      <Play className="mr-2 h-4 w-4" />
                      Play All
                    </Button>
                  )}
                  
                  <Button onClick={stopAllSounds} size="sm" variant="ghost">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Stop All
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Master Volume */}
          <div className="flex items-center space-x-3">
            <VolumeX className="h-4 w-4 text-text-secondary" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="flex-1 accent-primary"
            />
            <Volume2 className="h-4 w-4 text-text-secondary" />
            <span className="text-sm text-text-secondary w-12 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          {/* Active Sounds Count */}
          {activeSounds.length > 0 && (
            <div className="mt-3 text-center">
              <p className="text-xs text-text-secondary">
                {activeSounds.length} sound{activeSounds.length !== 1 ? 's' : ''} active
                {isPlaying && <span className="ml-2 text-primary">● Playing</span>}
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs text-primary/80">
            <strong>💡 Tip:</strong> Layer different sounds at low volumes for complex ambiences. 
            Save your favorite combinations as presets for quick access.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default AmbientSounds
