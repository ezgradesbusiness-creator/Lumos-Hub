// src/components/FocusMode/FocusTimer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Settings,
  Clock,
  Coffee,
  Brain,
  Target,
  TrendingUp,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipForward,
  Plus,
  Minus,
  CheckCircle,
  Zap,
  Heart,
  Eye,
  AlertCircle
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { useTimer } from '@/hooks/useTimer'
import { useUser } from '@/context/UserContext'
import { useFocusBoost } from '@/hooks/useFocusBoost'
import { sessionService } from '@/services/sessionService'

const FocusTimer = ({ fullscreen = false, className = '' }) => {
  const { user, settings, updateSettings } = useUser()
  const { 
    timeRemaining, 
    isActive, 
    isPaused, 
    mode, 
    totalTime,
    currentSession,
    sessions,
    startTimer, 
    pauseTimer, 
    stopTimer,
    resetTimer,
    setMode,
    setCustomDuration
  } = useTimer()

  const [showSettings, setShowSettings] = useState(false)
  const [showSessionComplete, setShowSessionComplete] = useState(false)
  const [completedSession, setCompletedSession] = useState(null)
  const [timerNotifications, setTimerNotifications] = useState(true)
  const [autoStartBreaks, setAutoStartBreaks] = useState(true)
  const [sessionGoal, setSessionGoal] = useState(null)
  const [currentTask, setCurrentTask] = useState('')
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [todayStats, setTodayStats] = useState({ sessions: 0, totalTime: 0 })

  // Audio elements for notifications
  const audioRef = useRef({
    sessionComplete: new Audio('/sounds/session-complete.mp3'),
    breakTime: new Audio('/sounds/break-time.mp3'),
    tick: new Audio('/sounds/tick.mp3'),
    warning: new Audio('/sounds/warning.mp3')
  })

  const timerModes = [
    {
      id: 'pomodoro',
      name: 'Pomodoro',
      duration: settings?.pomodoroTime || 25,
      shortName: 'Pomodoro',
      icon: '🍅',
      color: 'text-red-500',
      description: 'Classic 25-minute focused work sessions',
      breakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4
    },
    {
      id: 'deep-work',
      name: 'Deep Work',
      duration: settings?.deepWorkTime || 90,
      shortName: 'Deep Work',
      icon: '🧠',
      color: 'text-blue-500',
      description: 'Extended 90-minute sessions for complex tasks',
      breakDuration: 15,
      longBreakDuration: 30,
      longBreakInterval: 2
    },
    {
      id: 'short-burst',
      name: 'Short Burst',
      duration: 15,
      shortName: 'Sprint',
      icon: '⚡',
      color: 'text-yellow-500',
      description: 'Quick 15-minute sprints for small tasks',
      breakDuration: 5,
      longBreakDuration: 10,
      longBreakInterval: 3
    },
    {
      id: 'custom',
      name: 'Custom',
      duration: 30,
      shortName: 'Custom',
      icon: '⚙️',
      color: 'text-purple-500',
      description: 'Set your own duration',
      breakDuration: 10,
      longBreakDuration: 20,
      longBreakInterval: 3
    }
  ]

  const currentTimerMode = timerModes.find(m => m.id === mode) || timerModes[0]

  // Load today's statistics
  useEffect(() => {
    loadTodayStats()
  }, [sessions])

  // Session completion handler
  useEffect(() => {
    if (timeRemaining === 0 && isActive) {
      handleSessionComplete()
    }
  }, [timeRemaining, isActive])

  // Notification sound effects
  useEffect(() => {
    if (timerNotifications) {
      // Play warning sound at 2 minutes remaining
      if (timeRemaining === 120 && isActive) {
        playSound('warning')
      }
      
      // Subtle tick sound every minute in last 5 minutes
      if (timeRemaining <= 300 && timeRemaining % 60 === 0 && isActive) {
        playSound('tick')
      }
    }
  }, [timeRemaining, isActive, timerNotifications])

  const loadTodayStats = async () => {
    try {
      const today = new Date()
      const todaySessions = await sessionService.getTodaySessions(today)
      
      const completedSessions = todaySessions.filter(s => s.completed)
      const totalMinutes = completedSessions.reduce((acc, session) => acc + session.duration, 0)
      
      setTodayStats({
        sessions: completedSessions.length,
        totalTime: totalMinutes
      })
    } catch (error) {
      console.error('Error loading today stats:', error)
    }
  }

  const playSound = (soundType) => {
    if (settings?.volumes?.timer && audioRef.current[soundType]) {
      audioRef.current[soundType].volume = settings.volumes.timer
      audioRef.current[soundType].play().catch(console.error)
    }
  }

  const handleSessionComplete = async () => {
    const session = {
      id: Date.now().toString(),
      mode,
      duration: Math.floor(totalTime / 60),
      startTime: currentSession?.startTime || new Date(),
      endTime: new Date(),
      completed: true,
      task: currentTask || `${currentTimerMode.name} Session`,
      userId: user?.id
    }

    setCompletedSession(session)
    setShowSessionComplete(true)
    
    // Save session to storage
    try {
      await sessionService.create(session)
    } catch (error) {
      console.error('Error saving session:', error)
    }

    // Play completion sound
    playSound('sessionComplete')
    
    // Update pomodoro count
    if (mode === 'pomodoro') {
      setPomodoroCount(prev => prev + 1)
    }

    // Auto-start break if enabled
    if (autoStartBreaks) {
      const breakDuration = shouldTakeLongBreak() 
        ? currentTimerMode.longBreakDuration 
        : currentTimerMode.breakDuration
      
      setTimeout(() => {
        if (showSessionComplete) {
          startBreak(breakDuration)
        }
      }, 3000)
    }

    // Show browser notification
    if (timerNotifications && Notification.permission === 'granted') {
      new Notification('Session Complete!', {
        body: `Your ${currentTimerMode.name} session is finished. Great work!`,
        icon: '/favicon.ico'
      })
    }
  }

  const shouldTakeLongBreak = () => {
    if (mode !== 'pomodoro') return false
    return pomodoroCount > 0 && pomodoroCount % currentTimerMode.longBreakInterval === 0
  }

  const startBreak = (duration) => {
    setMode('break')
    setCustomDuration(duration)
    playSound('breakTime')
    setShowSessionComplete(false)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    if (totalTime === 0) return 0
    return ((totalTime - timeRemaining) / totalTime) * 100
  }

  const getTimeColor = () => {
    const progress = getProgress()
    if (progress >= 90) return 'text-red-500'
    if (progress >= 75) return 'text-yellow-500'
    return 'text-primary'
  }

  const requestNotificationPermission = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }

  const skipToBreak = () => {
    if (isActive) {
      stopTimer()
      const breakDuration = shouldTakeLongBreak() 
        ? currentTimerMode.longBreakDuration 
        : currentTimerMode.breakDuration
      startBreak(breakDuration)
    }
  }

  const adjustTime = (minutes) => {
    if (!isActive) {
      const newDuration = Math.max(5, currentTimerMode.duration + minutes)
      setCustomDuration(newDuration)
      
      // Update timer mode duration
      const updatedMode = { ...currentTimerMode, duration: newDuration }
      updateSettings({
        [`${mode}Time`]: newDuration
      })
    }
  }

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl w-full">
          {/* Timer Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <span className="text-6xl mr-4">{currentTimerMode.icon}</span>
              <div className="text-left">
                <h1 className={`text-4xl font-bold ${currentTimerMode.color}`}>
                  {currentTimerMode.name}
                </h1>
                {currentTask && (
                  <p className="text-text-secondary text-lg">{currentTask}</p>
                )}
              </div>
            </div>

            {/* Progress Circle */}
            <div className="relative w-80 h-80 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-card-border"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className={getTimeColor()}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - getProgress() / 100) }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              
              {/* Time Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: isActive && !isPaused ? [1, 1.02, 1] : 1 }}
                  transition={{ duration: 1, repeat: isActive && !isPaused ? Infinity : 0 }}
                  className={`text-6xl font-bold ${getTimeColor()}`}
                >
                  {formatTime(timeRemaining)}
                </motion.div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-6">
              <Button
                onClick={resetTimer}
                size="lg"
                variant="ghost"
                className="h-16 w-16 rounded-full"
              >
                <RotateCcw className="h-6 w-6" />
              </Button>

              <Button
                onClick={isActive ? (isPaused ? startTimer : pauseTimer) : startTimer}
                size="lg"
                className="h-20 w-20 rounded-full text-lg"
              >
                {isActive ? (
                  isPaused ? <Play className="h-8 w-8 ml-1" /> : <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>

              <Button
                onClick={stopTimer}
                size="lg"
                variant="ghost"
                className="h-16 w-16 rounded-full"
                disabled={!isActive}
              >
                <Square className="h-6 w-6" />
              </Button>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 max-w-md mx-auto"
          >
            <div className="text-center p-4 bg-surface/50 backdrop-blur-sm rounded-lg">
              <p className="text-2xl font-bold text-primary">{todayStats.sessions}</p>
              <p className="text-sm text-text-secondary">Sessions</p>
            </div>
            <div className="text-center p-4 bg-surface/50 backdrop-blur-sm rounded-lg">
              <p className="text-2xl font-bold text-secondary">{Math.floor(todayStats.totalTime / 60)}h</p>
              <p className="text-sm text-text-secondary">Focus Time</p>
            </div>
            <div className="text-center p-4 bg-surface/50 backdrop-blur-sm rounded-lg">
              <p className="text-2xl font-bold text-accent">{pomodoroCount}</p>
              <p className="text-sm text-text-secondary">Pomodoros</p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className={className}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Focus Timer
              </h3>
              <p className="text-sm text-text-secondary">
                {isActive ? 'Session in progress' : 'Ready to focus'}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowSettings(true)}
                size="sm"
                variant="ghost"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              {!fullscreen && (
                <Button
                  onClick={() => window.location.href = '/focus'}
                  size="sm"
                  variant="ghost"
                  title="Open fullscreen"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {timerModes.map(timerMode => (
                <button
                  key={timerMode.id}
                  onClick={() => !isActive && setMode(timerMode.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === timerMode.id
                      ? 'bg-primary text-white'
                      : 'bg-background text-text-secondary hover:bg-card-border'
                  } ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isActive}
                >
                  <span>{timerMode.icon}</span>
                  <span>{timerMode.shortName}</span>
                  <span className="text-xs">({timerMode.duration}m)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Current Task Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="What are you working on?"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              disabled={isActive}
            />
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6">
            {/* Progress Bar */}
            <div className="w-full bg-card-border rounded-full h-2 mb-4">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Time */}
            <motion.div
              animate={{ 
                scale: isActive && !isPaused ? [1, 1.02, 1] : 1,
                color: timeRemaining <= 60 ? '#ef4444' : undefined
              }}
              transition={{ duration: 1, repeat: isActive && !isPaused ? Infinity : 0 }}
              className="text-5xl font-bold text-text mb-2"
            >
              {formatTime(timeRemaining)}
            </motion.div>

            <p className={`text-sm font-medium ${currentTimerMode.color}`}>
              {currentTimerMode.name} • {Math.floor(getProgress())}% complete
            </p>

            {/* Time Adjustment (when not active) */}
            {!isActive && mode === 'custom' && (
              <div className="flex items-center justify-center space-x-2 mt-3">
                <Button onClick={() => adjustTime(-5)} size="sm" variant="ghost">
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-text-secondary">Adjust time</span>
                <Button onClick={() => adjustTime(5)} size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Button
              onClick={resetTimer}
              size="sm"
              variant="ghost"
              disabled={!isActive && timeRemaining === totalTime}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              onClick={isActive ? (isPaused ? startTimer : pauseTimer) : startTimer}
              className="px-8"
            >
              {isActive ? (
                isPaused ? (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                )
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Focus
                </>
              )}
            </Button>

            <Button
              onClick={stopTimer}
              size="sm"
              variant="ghost"
              disabled={!isActive}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>

          {/* Secondary Actions */}
          {isActive && (
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Button
                onClick={skipToBreak}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                <SkipForward className="mr-1 h-3 w-3" />
                Skip to Break
              </Button>
            </div>
          )}

          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-background rounded-lg">
              <p className="text-lg font-bold text-primary">{todayStats.sessions}</p>
              <p className="text-xs text-text-secondary">Sessions</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-lg font-bold text-secondary">
                {Math.floor(todayStats.totalTime / 60)}h {todayStats.totalTime % 60}m
              </p>
              <p className="text-xs text-text-secondary">Focus Time</p>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-lg font-bold text-accent">{pomodoroCount}</p>
              <p className="text-xs text-text-secondary">Pomodoros</p>
            </div>
          </div>

          {/* Quick Tips */}
          {!isActive && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-xs text-primary/80">
                <strong>💡 Tip:</strong> {currentTimerMode.description}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Timer Settings"
      >
        <div className="space-y-6">
          {/* Timer Durations */}
          <div>
            <h4 className="font-medium text-text mb-3">Default Durations</h4>
            <div className="space-y-3">
              {timerModes.slice(0, -1).map(timerMode => (
                <div key={timerMode.id} className="flex items-center justify-between">
                  <span className="text-sm">{timerMode.name}</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => {
                        const newDuration = Math.max(5, timerMode.duration - 5)
                        updateSettings({ [`${timerMode.id}Time`]: newDuration })
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center text-sm">
                      {settings?.[`${timerMode.id}Time`] || timerMode.duration}m
                    </span>
                    <Button
                      onClick={() => {
                        const newDuration = timerMode.duration + 5
                        updateSettings({ [`${timerMode.id}Time`]: newDuration })
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h4 className="font-medium text-text mb-3">Notifications</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Sound notifications</span>
                <input
                  type="checkbox"
                  checked={timerNotifications}
                  onChange={(e) => {
                    setTimerNotifications(e.target.checked)
                    if (e.target.checked) {
                      requestNotificationPermission()
                    }
                  }}
                  className="accent-primary"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Auto-start breaks</span>
                <input
                  type="checkbox"
                  checked={autoStartBreaks}
                  onChange={(e) => setAutoStartBreaks(e.target.checked)}
                  className="accent-primary"
                />
              </label>

              <div className="flex items-center justify-between">
                <span className="text-sm">Timer volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings?.volumes?.timer || 0.7}
                  onChange={(e) => updateSettings({
                    volumes: {
                      ...settings?.volumes,
                      timer: parseFloat(e.target.value)
                    }
                  })}
                  className="w-20 accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Break Settings */}
          <div>
            <h4 className="font-medium text-text mb-3">Break Settings</h4>
            <div className="text-sm text-text-secondary">
              <p>Short break: {currentTimerMode.breakDuration} minutes</p>
              <p>Long break: {currentTimerMode.longBreakDuration} minutes</p>
              <p>Long break every: {currentTimerMode.longBreakInterval} sessions</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Session Complete Modal */}
      <AnimatePresence>
        {showSessionComplete && completedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface rounded-xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="h-10 w-10 text-green-600" />
              </motion.div>

              <h3 className="text-xl font-bold text-text mb-2">Session Complete!</h3>
              <p className="text-text-secondary mb-4">
                Great work! You completed a {Math.floor(completedSession.duration)} minute {completedSession.mode} session.
              </p>

              <div className="bg-background rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{completedSession.duration}m</p>
                    <p className="text-xs text-text-secondary">Duration</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-secondary">+{completedSession.duration * 2}</p>
                    <p className="text-xs text-text-secondary">XP Earned</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {shouldTakeLongBreak() ? (
                  <Button
                    onClick={() => startBreak(currentTimerMode.longBreakDuration)}
                    className="w-full"
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    Take Long Break ({currentTimerMode.longBreakDuration}m)
                  </Button>
                ) : (
                  <Button
                    onClick={() => startBreak(currentTimerMode.breakDuration)}
                    className="w-full"
                  >
                    <Coffee className="mr-2 h-4 w-4" />
                    Take Break ({currentTimerMode.breakDuration}m)
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    setShowSessionComplete(false)
                    resetTimer()
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Continue Working
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FocusTimer
