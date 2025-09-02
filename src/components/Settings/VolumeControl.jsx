// src/components/Settings/VolumeControl.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Volume2, 
  VolumeX, 
  Volume1,
  VolumeOff,
  Play,
  Pause,
  RotateCcw,
  Settings,
  TestTube2,
  Headphones,
  Speaker,
  Bell,
  Music,
  Clock,
  MessageSquare,
  Zap,
  Heart,
  TreePine,
  Coffee,
  Check,
  AlertTriangle,
  Mic,
  MicOff
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'

const VolumeControl = ({ showCard = true, className = '' }) => {
  const { settings, updateSettings } = useUser()
  const [isTesting, setIsTesting] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [audioContext, setAudioContext] = useState(null)
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('default')
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false)
  const [microphoneLevel, setMicrophoneLevel] = useState(0)

  // Audio elements for testing
  const audioRefs = useRef({
    soundscape: new Audio('/sounds/rain.mp3'),
    timer: new Audio('/sounds/session-complete.mp3'),
    notification: new Audio('/sounds/message.mp3'),
    ui: new Audio('/sounds/click.mp3'),
    focusBoost: new Audio('/sounds/breathing.mp3'),
    ambient: new Audio('/sounds/nature.mp3')
  })

  // Microphone analysis
  const microphoneRef = useRef(null)
  const analyserRef = useRef(null)

  // Volume categories with descriptions and test sounds
  const volumeCategories = [
    {
      id: 'master',
      name: 'Master Volume',
      description: 'Controls all app sounds',
      icon: Volume2,
      defaultValue: 0.8,
      color: 'text-primary',
      testSound: null,
      showMeter: true
    },
    {
      id: 'soundscape',
      name: 'Ambient Sounds',
      description: 'Background soundscapes and nature sounds',
      icon: TreePine,
      defaultValue: 0.5,
      color: 'text-green-500',
      testSound: 'soundscape',
      showMeter: true
    },
    {
      id: 'timer',
      name: 'Timer Alerts',
      description: 'Session complete and break notifications',
      icon: Clock,
      defaultValue: 0.7,
      color: 'text-blue-500',
      testSound: 'timer',
      showMeter: false
    },
    {
      id: 'notification',
      name: 'App Notifications',
      description: 'Messages, achievements, and system alerts',
      icon: Bell,
      defaultValue: 0.6,
      color: 'text-yellow-500',
      testSound: 'notification',
      showMeter: false
    },
    {
      id: 'ui',
      name: 'UI Sounds',
      description: 'Button clicks and interface feedback',
      icon: Zap,
      defaultValue: 0.3,
      color: 'text-purple-500',
      testSound: 'ui',
      showMeter: false
    },
    {
      id: 'focusBoost',
      name: 'Focus Boosts',
      description: 'Breathing exercises and wellness sounds',
      icon: Heart,
      defaultValue: 0.4,
      color: 'text-pink-500',
      testSound: 'focusBoost',
      showMeter: true
    }
  ]

  // Audio presets
  const audioPresets = [
    {
      id: 'silent',
      name: 'Silent Mode',
      description: 'All sounds off',
      icon: VolumeX,
      values: {
        master: 0,
        soundscape: 0,
        timer: 0,
        notification: 0,
        ui: 0,
        focusBoost: 0
      }
    },
    {
      id: 'minimal',
      name: 'Minimal Audio',
      description: 'Only essential notifications',
      icon: Volume1,
      values: {
        master: 0.5,
        soundscape: 0,
        timer: 0.4,
        notification: 0.3,
        ui: 0,
        focusBoost: 0
      }
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Good mix of all sounds',
      icon: Volume2,
      values: {
        master: 0.7,
        soundscape: 0.4,
        timer: 0.6,
        notification: 0.5,
        ui: 0.2,
        focusBoost: 0.3
      }
    },
    {
      id: 'immersive',
      name: 'Full Experience',
      description: 'All sounds enabled for complete immersion',
      icon: Headphones,
      values: {
        master: 0.8,
        soundscape: 0.7,
        timer: 0.7,
        notification: 0.6,
        ui: 0.4,
        focusBoost: 0.5
      }
    }
  ]

  const currentVolumes = settings?.volumes || {}

  useEffect(() => {
    // Initialize audio context
    if (typeof window !== 'undefined' && window.AudioContext) {
      setAudioContext(new (window.AudioContext || window.webkitAudioContext)())
    }

    // Get audio devices
    getAudioDevices()

    // Set up audio elements
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      audio.loop = key === 'soundscape' || key === 'ambient'
      audio.volume = 0.5
    })

    return () => {
      // Cleanup
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
      
      if (microphoneRef.current) {
        microphoneRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Update audio volumes when settings change
  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      const categoryVolume = currentVolumes[key] || volumeCategories.find(c => c.id === key)?.defaultValue || 0.5
      const masterVolume = currentVolumes.master || 0.8
      audio.volume = categoryVolume * masterVolume
    })
  }, [currentVolumes])

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
      setAudioDevices(audioOutputs)
    } catch (error) {
      console.error('Error getting audio devices:', error)
    }
  }

  const updateVolume = (categoryId, value) => {
    const newVolumes = {
      ...currentVolumes,
      [categoryId]: value
    }
    updateSettings({ volumes: newVolumes })
  }

  const toggleMute = (categoryId) => {
    const currentValue = currentVolumes[categoryId] || volumeCategories.find(c => c.id === categoryId)?.defaultValue || 0.5
    updateVolume(categoryId, currentValue > 0 ? 0 : volumeCategories.find(c => c.id === categoryId)?.defaultValue || 0.5)
  }

  const testSound = async (categoryId) => {
    const audio = audioRefs.current[categoryId]
    if (!audio) return

    setIsTesting(categoryId)
    
    try {
      // Stop any currently playing test sound
      Object.values(audioRefs.current).forEach(a => {
        if (a !== audio) {
          a.pause()
          a.currentTime = 0
        }
      })

      if (audio.paused) {
        await audio.play()
        
        // Auto-stop after 3 seconds for non-looping sounds
        if (!audio.loop) {
          setTimeout(() => {
            audio.pause()
            audio.currentTime = 0
            setIsTesting(null)
          }, 3000)
        }
      } else {
        audio.pause()
        audio.currentTime = 0
        setIsTesting(null)
      }
    } catch (error) {
      console.error('Error playing test sound:', error)
      setIsTesting(null)
    }
  }

  const stopAllTestSounds = () => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    setIsTesting(null)
  }

  const applyPreset = (preset) => {
    updateSettings({ volumes: preset.values })
  }

  const resetToDefaults = () => {
    const defaultVolumes = {}
    volumeCategories.forEach(category => {
      defaultVolumes[category.id] = category.defaultValue
    })
    updateSettings({ volumes: defaultVolumes })
  }

  const enableMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphoneRef.current = stream
      
      if (audioContext) {
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser
        
        setMicrophoneEnabled(true)
        startMicrophoneMonitoring()
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const disableMicrophone = () => {
    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop())
      microphoneRef.current = null
    }
    setMicrophoneEnabled(false)
    setMicrophoneLevel(0)
  }

  const startMicrophoneMonitoring = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const monitor = () => {
      if (!microphoneEnabled) return
      
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setMicrophoneLevel(average / 255)
      
      requestAnimationFrame(monitor)
    }
    
    monitor()
  }

  const getVolumeIcon = (volume, categoryId) => {
    if (volume === 0) return VolumeX
    if (volume < 0.3) return VolumeOff
    if (volume < 0.7) return Volume1
    return Volume2
  }

  const getVolumeColor = (volume) => {
    if (volume === 0) return 'text-gray-400'
    if (volume < 0.3) return 'text-yellow-500'
    if (volume < 0.7) return 'text-blue-500'
    return 'text-green-500'
  }

  const ContentComponent = () => (
    <div className="space-y-6">
      {/* Current Audio Status */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            {currentVolumes.master === 0 ? (
              <VolumeX className="h-8 w-8 text-white" />
            ) : (
              <Volume2 className="h-8 w-8 text-white" />
            )}
          </div>
          <h4 className="text-lg font-semibold text-text">
            {currentVolumes.master === 0 ? 'Audio Muted' : 'Audio Active'}
          </h4>
          <p className="text-sm text-text-secondary">
            Master Volume: {Math.round((currentVolumes.master || 0.8) * 100)}%
          </p>
        </motion.div>
      </div>

      {/* Quick Presets */}
      <div>
        <h5 className="font-medium text-text mb-3">Audio Presets</h5>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {audioPresets.map(preset => {
            const IconComponent = preset.icon
            
            return (
              <motion.button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                className="p-3 rounded-lg border border-card-border bg-background hover:border-primary/50 text-left transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent className="h-4 w-4 text-text-secondary mb-2" />
                <p className="font-medium text-sm text-text">{preset.name}</p>
                <p className="text-xs text-text-secondary">{preset.description}</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Volume Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-text">Volume Controls</h5>
          <div className="flex items-center space-x-2">
            <Button
              onClick={stopAllTestSounds}
              size="sm"
              variant="ghost"
              disabled={!isTesting}
            >
              Stop Tests
            </Button>
            <Button
              onClick={resetToDefaults}
              size="sm"
              variant="ghost"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {volumeCategories.map(category => {
          const IconComponent = category.icon
          const VolumeIconComponent = getVolumeIcon(currentVolumes[category.id] || category.defaultValue, category.id)
          const volume = currentVolumes[category.id] !== undefined ? currentVolumes[category.id] : category.defaultValue
          
          return (
            <motion.div
              key={category.id}
              className="p-4 border border-card-border rounded-lg bg-background"
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <IconComponent className={`h-5 w-5 ${category.color}`} />
                  <div>
                    <p className="font-medium text-sm text-text">{category.name}</p>
                    <p className="text-xs text-text-secondary">{category.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {category.testSound && (
                    <Button
                      onClick={() => testSound(category.testSound)}
                      size="sm"
                      variant="ghost"
                      disabled={volume === 0}
                    >
                      {isTesting === category.testSound ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => toggleMute(category.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <VolumeIconComponent className={`h-4 w-4 ${getVolumeColor(volume)}`} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <VolumeX className="h-4 w-4 text-text-secondary flex-shrink-0" />
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => updateVolume(category.id, parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                  
                  {/* Volume Meter */}
                  {category.showMeter && (
                    <div className="flex space-x-1 mt-2">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 w-full rounded ${
                            i < volume * 10 
                              ? volume > 0.8 && i >= 8 ? 'bg-red-400' :
                                volume > 0.6 && i >= 6 ? 'bg-yellow-400' : 
                                'bg-green-400'
                              : 'bg-card-border'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                <Volume2 className="h-4 w-4 text-text-secondary flex-shrink-0" />
                
                <span className="text-sm font-mono text-text-secondary w-10 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>

              {/* Master volume effect */}
              {category.id !== 'master' && (
                <div className="mt-2 text-xs text-text-secondary">
                  Effective: {Math.round(volume * (currentVolumes.master || 0.8) * 100)}%
                  {volume > 0 && (currentVolumes.master || 0.8) === 0 && (
                    <span className="text-yellow-600 ml-1">
                      (Muted by Master Volume)
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Advanced Options */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Advanced Audio Settings</span>
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <VolumeIconComponent className="h-4 w-4" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4"
            >
              {/* Audio Device Selection */}
              {audioDevices.length > 0 && (
                <div>
                  <h6 className="font-medium text-text mb-3 flex items-center">
                    <Speaker className="mr-2 h-4 w-4" />
                    Audio Output Device
                  </h6>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                  >
                    <option value="default">System Default</option>
                    {audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Audio Device ${device.deviceId.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Microphone Level Monitor */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h6 className="font-medium text-text flex items-center">
                    <Mic className="mr-2 h-4 w-4" />
                    Microphone Monitor
                  </h6>
                  <Button
                    onClick={microphoneEnabled ? disableMicrophone : enableMicrophone}
                    size="sm"
                    variant={microphoneEnabled ? 'secondary' : 'default'}
                  >
                    {microphoneEnabled ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Enable
                      </>
                    )}
                  </Button>
                </div>

                {microphoneEnabled && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-primary">Input Level:</span>
                      <div className="flex-1 flex space-x-1">
                        {[...Array(20)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-full rounded ${
                              i < microphoneLevel * 20 
                                ? microphoneLevel > 0.8 && i >= 16 ? 'bg-red-400' :
                                  microphoneLevel > 0.6 && i >= 12 ? 'bg-yellow-400' : 
                                  'bg-green-400'
                                : 'bg-card-border'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-primary w-10 text-right">
                        {Math.round(microphoneLevel * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-primary/80">
                      This helps you monitor your microphone input during study sessions
                    </p>
                  </div>
                )}
              </div>

              {/* Audio Quality Settings */}
              <div>
                <h6 className="font-medium text-text mb-3">Audio Quality</h6>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm">High Quality Audio</span>
                    <input
                      type="checkbox"
                      checked={settings?.highQualityAudio || false}
                      onChange={(e) => updateSettings({ highQualityAudio: e.target.checked })}
                      className="accent-primary"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm">Spatial Audio (if supported)</span>
                    <input
                      type="checkbox"
                      checked={settings?.spatialAudio || false}
                      onChange={(e) => updateSettings({ spatialAudio: e.target.checked })}
                      className="accent-primary"
                    />
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audio Tips */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <Headphones className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h6 className="font-medium text-primary mb-1">Audio Tips</h6>
            <div className="text-sm text-primary/80 space-y-1">
              <p>• Use headphones for the best ambient sound experience</p>
              <p>• Keep timer alerts audible but not distracting</p>
              <p>• Lower UI sounds if you find them annoying</p>
              <p>• Test sounds to find your perfect volume levels</p>
              {currentVolumes.master === 0 && (
                <p className="text-yellow-700">⚠️ Master volume is muted - no sounds will play</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!showCard) {
    return <div className={className}><ContentComponent /></div>
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text flex items-center">
              <Volume2 className="mr-2 h-5 w-5" />
              Audio & Sound Settings
            </h3>
            <p className="text-sm text-text-secondary">Control volume levels and audio preferences</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {isTesting && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
              >
                <Play className="h-3 w-3" />
                Testing Audio
              </motion.div>
            )}
          </div>
        </div>

        <ContentComponent />
      </div>
    </Card>
  )
}

export default VolumeControl
