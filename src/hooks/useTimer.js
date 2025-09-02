// src/hooks/useTimer.js
import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@/context/UserContext'
import { sessionService } from '@/services/sessionService'

const useTimer = () => {
  const { user, settings, updateStats } = useUser()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [mode, setMode] = useState('pomodoro')
  const [currentSession, setCurrentSession] = useState(null)
  const [completedSessions, setCompletedSessions] = useState([])
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0)
  const [isBreak, setIsBreak] = useState(false)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)

  const intervalRef = useRef(null)
  const startTimeRef = useRef(null)
  const pausedTimeRef = useRef(0)
  const audioRef = useRef({})

  // Timer modes configuration
  const timerModes = {
    pomodoro: {
      name: 'Pomodoro',
      workDuration: settings?.pomodoroTime || 25,
      shortBreak: 5,
      longBreak: 15,
      longBreakInterval: 4,
      color: '#ef4444'
    },
    deepWork: {
      name: 'Deep Work',
      workDuration: settings?.deepWorkTime || 90,
      shortBreak: 15,
      longBreak: 30,
      longBreakInterval: 2,
      color: '#3b82f6'
    },
    custom: {
      name: 'Custom',
      workDuration: 30,
      shortBreak: 10,
      longBreak: 20,
      longBreakInterval: 3,
      color: '#8b5cf6'
    }
  }

  // Initialize audio elements
  useEffect(() => {
    audioRef.current = {
      tick: new Audio('/sounds/tick.mp3'),
      sessionComplete: new Audio('/sounds/session-complete.mp3'),
      breakStart: new Audio('/sounds/break-start.mp3'),
      warning: new Audio('/sounds/warning.mp3')
    }

    Object.values(audioRef.current).forEach(audio => {
      audio.volume = settings?.volumes?.timer || 0.7
      audio.preload = 'metadata'
    })

    return () => {
      Object.values(audioRef.current).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [settings?.volumes?.timer])

  // Main timer effect
  useEffect(() => {
    if (isActive && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete()
            return 0
          }
          
          // Play warning sound at 2 minutes remaining
          if (prev === 120 && settings?.timerNotifications) {
            playSound('warning')
          }
          
          // Play tick sound every minute in last 5 minutes
          if (prev <= 300 && prev % 60 === 0 && settings?.timerNotifications) {
            playSound('tick')
          }
          
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, isPaused, timeRemaining, settings?.timerNotifications])

  // Start timer
  const startTimer = useCallback((customDuration = null, customMode = null) => {
    const selectedMode = customMode || mode
    const currentModeConfig = timerModes[selectedMode]
    const duration = customDuration || (currentModeConfig.workDuration * 60)

    setTotalTime(duration)
    setTimeRemaining(duration)
    setIsActive(true)
    setIsPaused(false)
    setMode(selectedMode)
    startTimeRef.current = Date.now()
    pausedTimeRef.current = 0

    // Create session record
    const session = {
      id: Date.now().toString(),
      mode: selectedMode,
      duration: Math.floor(duration / 60),
      startTime: new Date(),
      targetDuration: duration,
      userId: user?.id,
      completed: false
    }

    setCurrentSession(session)

    // Show browser notification
    if (settings?.timerNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`${currentModeConfig.name} session started`, {
        body: `${Math.floor(duration / 60)} minute focus session`,
        icon: '/favicon.ico'
      })
    }
  }, [mode, user?.id, settings?.timerNotifications])

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (isActive) {
      setIsPaused(true)
      pausedTimeRef.current += Date.now() - startTimeRef.current
    }
  }, [isActive])

  // Resume timer
  const resumeTimer = useCallback(() => {
    if (isPaused) {
      setIsPaused(false)
      startTimeRef.current = Date.now()
    }
  }, [isPaused])

  // Stop timer
  const stopTimer = useCallback(() => {
    setIsActive(false)
    setIsPaused(false)
    
    if (currentSession && !currentSession.completed) {
      // Save incomplete session
      const incompleteSession = {
        ...currentSession,
        endTime: new Date(),
        completed: false,
        actualDuration: Math.floor((totalTime - timeRemaining) / 60)
      }
      
      saveSession(incompleteSession)
    }
    
    setCurrentSession(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [currentSession, totalTime, timeRemaining])

  // Reset timer
  const resetTimer = useCallback(() => {
    setIsActive(false)
    setIsPaused(false)
    setTimeRemaining(0)
    setTotalTime(0)
    setCurrentSession(null)
    setIsBreak(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    setIsActive(false)
    playSound(isBreak ? 'breakStart' : 'sessionComplete')

    if (!isBreak && currentSession) {
      // Complete work session
      const completedSession = {
        ...currentSession,
        endTime: new Date(),
        completed: true,
        actualDuration: currentSession.duration
      }

      setCompletedSessions(prev => [...prev, completedSession])
      await saveSession(completedSession)

      // Update statistics
      await updateSessionStats(completedSession)

      // Handle Pomodoro cycle counting
      if (mode === 'pomodoro') {
        const newPomodoroCount = pomodoroCount + 1
        setPomodoroCount(newPomodoroCount)
        
        if (newPomodoroCount % timerModes.pomodoro.longBreakInterval === 0) {
          setCycleCount(prev => prev + 1)
        }
      }

      // Auto-start break if enabled
      if (settings?.autoStartBreaks) {
        const shouldTakeLongBreak = mode === 'pomodoro' && 
          (pomodoroCount + 1) % timerModes.pomodoro.longBreakInterval === 0
        
        const breakDuration = shouldTakeLongBreak 
          ? timerModes[mode].longBreak 
          : timerModes[mode].shortBreak

        setTimeout(() => startBreak(breakDuration), 2000)
      }

      // Show completion notification
      if (settings?.timerNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Session Complete!', {
          body: `Great work! You completed a ${currentSession.duration} minute session.`,
          icon: '/favicon.ico'
        })
      }
    } else if (isBreak) {
      // Complete break
      setIsBreak(false)
      setBreakTimeRemaining(0)
      
      if (settings?.timerNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Break Complete!', {
          body: 'Ready to get back to work?',
          icon: '/favicon.ico'
        })
      }
    }

    setCurrentSession(null)
  }, [isBreak, currentSession, mode, pomodoroCount, settings?.autoStartBreaks, settings?.timerNotifications])

  // Start break
  const startBreak = useCallback((duration) => {
    setIsBreak(true)
    setTimeRemaining(duration * 60)
    setTotalTime(duration * 60)
    setIsActive(true)
    setIsPaused(false)
    playSound('breakStart')
  }, [])

  // Save session to database
  const saveSession = useCallback(async (session) => {
    try {
      await sessionService.create(session)
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }, [])

  // Update session statistics
  const updateSessionStats = useCallback(async (session) => {
    try {
      const newStats = {
        totalSessions: (completedSessions.length + 1),
        totalFocusTime: completedSessions.reduce((acc, s) => acc + s.actualDuration, 0) + session.actualDuration,
        lastSessionDate: new Date().toISOString(),
        averageSessionLength: Math.round(
          (completedSessions.reduce((acc, s) => acc + s.actualDuration, 0) + session.actualDuration) / 
          (completedSessions.length + 1)
        )
      }

      updateStats(newStats)
    } catch (error) {
      console.error('Error updating stats:', error)
    }
  }, [completedSessions, updateStats])

  // Play sound effect
  const playSound = useCallback((soundType) => {
    if (settings?.volumes?.timer > 0 && audioRef.current[soundType]) {
      const audio = audioRef.current[soundType]
      audio.currentTime = 0
      audio.play().catch(console.error)
    }
  }, [settings?.volumes?.timer])

  // Set custom duration
  const setCustomDuration = useCallback((minutes) => {
    if (!isActive) {
      const duration = minutes * 60
      setTotalTime(duration)
      setTimeRemaining(duration)
    }
  }, [isActive])

  // Get progress percentage
  const getProgress = useCallback(() => {
    if (totalTime === 0) return 0
    return ((totalTime - timeRemaining) / totalTime) * 100
  }, [totalTime, timeRemaining])

  // Get next break type
  const getNextBreakType = useCallback(() => {
    if (mode !== 'pomodoro') return 'break'
    return (pomodoroCount + 1) % timerModes.pomodoro.longBreakInterval === 0 ? 'long' : 'short'
  }, [mode, pomodoroCount])

  // Get session summary
  const getSessionSummary = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaySessions = completedSessions.filter(
      session => new Date(session.startTime) >= today
    )

    return {
      today: {
        sessions: todaySessions.length,
        totalTime: todaySessions.reduce((acc, s) => acc + s.actualDuration, 0),
        averageLength: todaySessions.length > 0 
          ? Math.round(todaySessions.reduce((acc, s) => acc + s.actualDuration, 0) / todaySessions.length)
          : 0
      },
      total: {
        sessions: completedSessions.length,
        totalTime: completedSessions.reduce((acc, s) => acc + s.actualDuration, 0)
      },
      pomodoros: pomodoroCount,
      cycles: cycleCount
    }
  }, [completedSessions, pomodoroCount, cycleCount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    // Timer state
    timeRemaining,
    totalTime,
    isActive,
    isPaused,
    mode,
    currentSession,
    isBreak,
    breakTimeRemaining,
    
    // Session data
    completedSessions,
    pomodoroCount,
    cycleCount,
    
    // Timer controls
    startTimer,
    pauseTimer: isPaused ? resumeTimer : pauseTimer,
    stopTimer,
    resetTimer,
    setMode,
    setCustomDuration,
    
    // Break controls
    startBreak,
    
    // Utilities
    getProgress,
    getNextBreakType,
    getSessionSummary,
    
    // Timer modes
    timerModes,
    currentModeConfig: timerModes[mode],
    
    // Computed values
    isRunning: isActive && !isPaused,
    formattedTime: formatTime(timeRemaining),
    formattedTotalTime: formatTime(totalTime),
    progressPercentage: getProgress()
  }
}

// Helper function to format time
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export default useTimer
