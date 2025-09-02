// src/hooks/useFocusBoost.js
import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@/context/UserContext'

const useFocusBoost = () => {
  const { settings, updateSettings } = useUser()
  const [activeBoost, setActiveBoost] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentPhase, setCurrentPhase] = useState('prepare')
  const [sessionCount, setSessionCount] = useState(0)
  const [audioContext, setAudioContext] = useState(null)
  
  const intervalRef = useRef(null)
  const audioRef = useRef({})
  const animationRef = useRef(null)

  // Focus boost types with configurations
  const focusBoosts = {
    breathing: {
      name: '4-7-8 Breathing',
      description: 'Calming breathwork to enhance focus',
      icon: '🫁',
      duration: 240, // 4 minutes
      phases: [
        { name: 'inhale', duration: 4000, instruction: 'Breathe in slowly through your nose' },
        { name: 'hold', duration: 7000, instruction: 'Hold your breath gently' },
        { name: 'exhale', duration: 8000, instruction: 'Exhale slowly through your mouth' },
        { name: 'pause', duration: 1000, instruction: 'Rest and prepare for next breath' }
      ],
      benefits: ['Reduces anxiety', 'Improves focus', 'Calms nervous system'],
      soundUrl: '/sounds/breathing-guide.mp3'
    },
    
    boxBreathing: {
      name: 'Box Breathing',
      description: 'Navy SEAL technique for mental clarity',
      icon: '⬜',
      duration: 300, // 5 minutes
      phases: [
        { name: 'inhale', duration: 4000, instruction: 'Inhale for 4 counts' },
        { name: 'hold1', duration: 4000, instruction: 'Hold for 4 counts' },
        { name: 'exhale', duration: 4000, instruction: 'Exhale for 4 counts' },
        { name: 'hold2', duration: 4000, instruction: 'Hold for 4 counts' }
      ],
      benefits: ['Enhances concentration', 'Reduces stress', 'Improves performance'],
      soundUrl: '/sounds/box-breathing.mp3'
    },

    meditation: {
      name: 'Micro Meditation',
      description: 'Short mindfulness practice',
      icon: '🧘',
      duration: 180, // 3 minutes
      phases: [
        { name: 'settle', duration: 30000, instruction: 'Find a comfortable position and close your eyes' },
        { name: 'breathe', duration: 60000, instruction: 'Focus on your natural breath' },
        { name: 'observe', duration: 60000, instruction: 'Notice thoughts without judgment' },
        { name: 'return', duration: 30000, instruction: 'Gently return your focus to breathing' }
      ],
      benefits: ['Increases awareness', 'Reduces mental clutter', 'Improves focus'],
      soundUrl: '/sounds/meditation-bell.mp3'
    },

    energizer: {
      name: 'Energy Boost',
      description: 'Quick physical activation',
      icon: '⚡',
      duration: 120, // 2 minutes
      phases: [
        { name: 'warmup', duration: 20000, instruction: 'Roll your shoulders and neck' },
        { name: 'stretch', duration: 40000, instruction: 'Stand and stretch your arms overhead' },
        { name: 'movement', duration: 40000, instruction: 'Do gentle jumping jacks or march in place' },
        { name: 'cool', duration: 20000, instruction: 'Take three deep breaths and shake out your limbs' }
      ],
      benefits: ['Increases alertness', 'Improves circulation', 'Boosts energy'],
      soundUrl: '/sounds/energizer.mp3'
    },

    visualization: {
      name: 'Success Visualization',
      description: 'Mental rehearsal for peak performance',
      icon: '🎯',
      duration: 360, // 6 minutes
      phases: [
        { name: 'relax', duration: 60000, instruction: 'Close your eyes and relax your body' },
        { name: 'visualize', duration: 180000, instruction: 'Imagine completing your task successfully' },
        { name: 'embody', duration: 60000, instruction: 'Feel the satisfaction and confidence' },
        { name: 'anchor', duration: 60000, instruction: 'Create a mental anchor for this feeling' }
      ],
      benefits: ['Improves confidence', 'Enhances motivation', 'Increases success rates'],
      soundUrl: '/sounds/visualization.mp3'
    },

    progressive: {
      name: 'Progressive Relaxation',
      description: 'Release tension from body and mind',
      icon: '🌊',
      duration: 420, // 7 minutes
      phases: [
        { name: 'feet', duration: 60000, instruction: 'Tense and release your feet' },
        { name: 'legs', duration: 60000, instruction: 'Tense and release your legs' },
        { name: 'core', duration: 60000, instruction: 'Tense and release your core' },
        { name: 'arms', duration: 60000, instruction: 'Tense and release your arms' },
        { name: 'face', duration: 60000, instruction: 'Tense and release your face' },
        { name: 'whole', duration: 60000, instruction: 'Tense your whole body, then release' },
        { name: 'rest', duration: 60000, instruction: 'Rest in complete relaxation' }
      ],
      benefits: ['Reduces physical tension', 'Promotes deep relaxation', 'Improves mind-body awareness'],
      soundUrl: '/sounds/progressive-relaxation.mp3'
    }
  }

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      setAudioContext(new (window.AudioContext || window.webkitAudioContext)())
    }

    // Preload audio files
    Object.entries(focusBoosts).forEach(([key, boost]) => {
      if (boost.soundUrl) {
        const audio = new Audio(boost.soundUrl)
        audio.preload = 'metadata'
        audio.loop = false
        audio.volume = (settings?.volumes?.focusBoost || 0.4)
        audioRef.current[key] = audio
      }
    })

    return () => {
      Object.values(audioRef.current).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [settings?.volumes?.focusBoost])

  // Start a focus boost session
  const startFocusBoost = useCallback(async (boostType) => {
    const boost = focusBoosts[boostType]
    if (!boost) return

    setActiveBoost(boost)
    setIsActive(true)
    setProgress(0)
    setCurrentPhase('prepare')

    // Play introduction sound
    const audio = audioRef.current[boostType]
    if (audio && settings?.volumes?.focusBoost > 0) {
      try {
        await audio.play()
      } catch (error) {
        console.warn('Could not play focus boost audio:', error)
      }
    }

    // Start the session phases
    runBoostSession(boost)
  }, [settings?.volumes?.focusBoost])

  // Run the boost session through its phases
  const runBoostSession = useCallback((boost) => {
    let currentPhaseIndex = 0
    let phaseStartTime = Date.now()
    let sessionStartTime = Date.now()

    const updateProgress = () => {
      if (!isActive) return

      const now = Date.now()
      const sessionElapsed = now - sessionStartTime
      const sessionProgress = Math.min((sessionElapsed / (boost.duration * 1000)) * 100, 100)
      
      setProgress(sessionProgress)

      // Check if current phase is complete
      const currentPhaseConfig = boost.phases[currentPhaseIndex]
      const phaseElapsed = now - phaseStartTime
      
      if (phaseElapsed >= currentPhaseConfig.duration) {
        currentPhaseIndex++
        phaseStartTime = now
        
        if (currentPhaseIndex < boost.phases.length) {
          setCurrentPhase(boost.phases[currentPhaseIndex].name)
        } else {
          // Session complete
          completeFocusBoost()
          return
        }
      }

      animationRef.current = requestAnimationFrame(updateProgress)
    }

    setCurrentPhase(boost.phases[0].name)
    animationRef.current = requestAnimationFrame(updateProgress)
  }, [isActive])

  // Complete the focus boost session
  const completeFocusBoost = useCallback(() => {
    setIsActive(false)
    setProgress(100)
    setSessionCount(prev => prev + 1)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Update user stats
    updateSettings({
      ...settings,
      focusBoostSessions: (settings.focusBoostSessions || 0) + 1,
      lastFocusBoost: new Date().toISOString()
    })

    // Play completion sound
    playCompletionSound()

    // Show completion notification
    setTimeout(() => {
      setActiveBoost(null)
      setCurrentPhase('prepare')
      setProgress(0)
    }, 3000)
  }, [settings, updateSettings])

  // Stop the current focus boost
  const stopFocusBoost = useCallback(() => {
    setIsActive(false)
    setActiveBoost(null)
    setCurrentPhase('prepare')
    setProgress(0)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Stop audio
    Object.values(audioRef.current).forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }, [])

  // Pause/resume focus boost
  const togglePause = useCallback(() => {
    setIsActive(prev => !prev)
    
    // Pause/resume audio
    if (activeBoost) {
      const audio = audioRef.current[Object.keys(focusBoosts).find(
        key => focusBoosts[key] === activeBoost
      )]
      
      if (audio) {
        if (isActive) {
          audio.pause()
        } else {
          audio.play().catch(console.warn)
        }
      }
    }
  }, [activeBoost, isActive])

  // Play completion sound
  const playCompletionSound = useCallback(() => {
    if (settings?.volumes?.focusBoost > 0) {
      const audio = new Audio('/sounds/focus-complete.mp3')
      audio.volume = settings.volumes.focusBoost
      audio.play().catch(console.warn)
    }
  }, [settings?.volumes?.focusBoost])

  // Get current phase instructions
  const getCurrentInstruction = useCallback(() => {
    if (!activeBoost || !currentPhase) return ''
    
    const phase = activeBoost.phases.find(p => p.name === currentPhase)
    return phase?.instruction || ''
  }, [activeBoost, currentPhase])

  // Get recommended boost based on time of day
  const getRecommendedBoost = useCallback(() => {
    const hour = new Date().getHours()
    
    if (hour >= 6 && hour < 9) {
      return 'energizer' // Morning energy boost
    } else if (hour >= 9 && hour < 12) {
      return 'breathing' // Morning focus
    } else if (hour >= 12 && hour < 14) {
      return 'meditation' // Lunch break mindfulness
    } else if (hour >= 14 && hour < 17) {
      return 'visualization' // Afternoon motivation
    } else if (hour >= 17 && hour < 20) {
      return 'progressive' // Evening wind-down
    } else {
      return 'boxBreathing' // Late night/early morning calm
    }
  }, [])

  // Get user's focus boost history
  const getFocusBoostHistory = useCallback(() => {
    return {
      totalSessions: settings?.focusBoostSessions || 0,
      lastSession: settings?.lastFocusBoost ? new Date(settings.lastFocusBoost) : null,
      favoriteBoost: settings?.favoriteFocusBoost || null,
      currentStreak: calculateCurrentStreak(),
      weeklyGoal: settings?.weeklyFocusBoosts || 7,
      weeklyProgress: getWeeklyProgress()
    }
  }, [settings])

  const calculateCurrentStreak = useCallback(() => {
    // This would calculate based on stored session data
    // For now, return a placeholder
    return settings?.focusBoostStreak || 0
  }, [settings])

  const getWeeklyProgress = useCallback(() => {
    // This would calculate weekly progress from stored data
    // For now, return a placeholder
    return settings?.weeklyFocusBoosts || 0
  }, [settings])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    // State
    focusBoosts,
    activeBoost,
    isActive,
    progress,
    currentPhase,
    sessionCount,
    
    // Actions
    startFocusBoost,
    stopFocusBoost,
    togglePause,
    
    // Utilities
    getCurrentInstruction,
    getRecommendedBoost,
    getFocusBoostHistory,
    
    // Computed values
    timeRemaining: activeBoost ? Math.max(0, activeBoost.duration - (progress / 100) * activeBoost.duration) : 0,
    isCompleted: progress >= 100,
    canStart: !activeBoost || !isActive
  }
}

export default useFocusBoost
