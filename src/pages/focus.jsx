// src/pages/focus.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Timer, 
  Volume2, 
  Users, 
  Eye,
  EyeOff,
  Settings,
  ArrowLeft,
  Minimize2,
  Maximize2,
  Coffee
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FocusTimer from '@/components/FocusMode/FocusTimer'
import AmbientSounds from '@/components/FocusMode/AmbientSounds'
import StudyTogetherRoom from '@/components/FocusMode/StudyTogetherRoom'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'
import { useTimer } from '@/hooks/useTimer'
import { useFocusBoost } from '@/hooks/useFocusBoost'

const FocusPage = () => {
  const navigate = useNavigate()
  const { user, settings } = useUser()
  const { isActive, currentSession, timeRemaining } = useTimer()
  const { activeBoost } = useFocusBoost()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [focusMode, setFocusMode] = useState('standard') // standard, minimal, zen

  // Focus modes
  const focusModes = {
    standard: {
      name: 'Standard Focus',
      description: 'Full interface with all tools',
      showTimer: true,
      showSidebar: true,
      showBackground: false
    },
    minimal: {
      name: 'Minimal Focus',
      description: 'Simplified interface, timer only',
      showTimer: true,
      showSidebar: false,
      showBackground: true
    },
    zen: {
      name: 'Zen Mode',
      description: 'Distraction-free environment',
      showTimer: false,
      showSidebar: false,
      showBackground: true
    }
  }

  // Handle fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault()
            toggleFullscreen()
            break
          case 'h':
            e.preventDefault()
            setShowSidebar(!showSidebar)
            break
          case '1':
            e.preventDefault()
            setFocusMode('standard')
            break
          case '2':
            e.preventDefault()
            setFocusMode('minimal')
            break
          case '3':
            e.preventDefault()
            setFocusMode('zen')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSidebar])

  const currentFocusMode = focusModes[focusMode]

  // Zen mode full-screen timer
  if (focusMode === 'zen') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Zen Timer */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {isActive && (
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl font-light text-text mb-8"
              >
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </motion.div>
            )}

            {currentSession && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xl text-text-secondary"
              >
                {currentSession.mode} session
              </p>
            )}

            {!isActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <p className="text-2xl text-text-secondary mb-8">Ready to focus</p>
                <p className="text-text-secondary">Press Space to start, Esc to exit Zen mode</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Zen Mode Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-4 bg-surface/80 backdrop-blur-md rounded-full px-6 py-3"
          >
            <Button
              onClick={() => setFocusMode('standard')}
              size="sm"
              variant="ghost"
            >
              Exit Zen
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      {!isFullscreen && (
        <div className="border-b border-card-border bg-surface/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Navigation */}
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="ghost"
                  size="sm"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>

                <div className="h-6 w-px bg-card-border" />

                <h1 className="text-xl font-semibold text-text flex items-center">
                  <Timer className="h-5 w-5 mr-2" />
                  Focus Mode
                </h1>

                {isActive && currentSession && (
                  <div className="hidden md:flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-text-secondary">
                      {currentSession.mode} session active
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                {/* Focus Mode Selector */}
                <select
                  value={focusMode}
                  onChange={(e) => setFocusMode(e.target.value)}
                  className="text-sm border border-card-border rounded px-2 py-1 bg-background"
                >
                  {Object.entries(focusModes).map(([key, mode]) => (
                    <option key={key} value={key}>
                      {mode.name}
                    </option>
                  ))}
                </select>

                <Button
                  onClick={() => setShowSidebar(!showSidebar)}
                  variant="ghost"
                  size="sm"
                >
                  {showSidebar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>

                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex ${isFullscreen ? 'h-screen' : 'min-h-[calc(100vh-4rem)]'}`}>
        {/* Main Timer Area */}
        <div className={`flex-1 ${showSidebar ? 'pr-80' : ''} transition-all duration-300`}>
          {focusMode === 'minimal' ? (
            <FocusTimer fullscreen className="h-full" />
          ) : (
            <div className="h-full flex flex-col">
              {/* Timer Section */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                  <FocusTimer />
                </div>
              </div>

              {/* Bottom Controls */}
              {!isFullscreen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="border-t border-card-border bg-surface/50 backdrop-blur-sm p-4"
                >
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Button
                        onClick={() => navigate('/break')}
                        variant="ghost"
                        size="sm"
                        disabled={isActive}
                      >
                        <Coffee className="h-4 w-4 mr-2" />
                        Take Break
                      </Button>
                    </div>

                    <div className="text-sm text-text-secondary">
                      Press Ctrl+F for fullscreen • Ctrl+H to toggle sidebar
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0, x: 320 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 320 }}
              transition={{ duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-surface border-l border-card-border overflow-y-auto z-10"
              style={{ top: isFullscreen ? 0 : '4rem' }}
            >
              <div className="p-6 space-y-6">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text">Focus Tools</h3>
                  <Button
                    onClick={() => setShowSidebar(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>

                {/* Ambient Sounds */}
                <div>
                  <AmbientSounds compact />
                </div>

                {/* Study Together */}
                <div>
                  <StudyTogetherRoom compact />
                </div>

                {/* Focus Boost */}
                {activeBoost && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <h4 className="font-medium text-primary mb-2">Active Focus Boost</h4>
                    <p className="text-sm text-primary/80">{activeBoost.name} in progress</p>
                  </motion.div>
                )}

                {/* Session Stats */}
                <div className="bg-background rounded-lg p-4">
                  <h4 className="font-medium text-text mb-3">Today's Progress</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Sessions</span>
                      <span className="text-text">0/4</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Focus Time</span>
                      <span className="text-text">0h 0m</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Streak</span>
                      <span className="text-text">0 days</span>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                <div className="text-sm text-text-secondary">
                  <h4 className="font-medium text-text mb-2">Focus Tips</h4>
                  <ul className="space-y-1">
                    <li>• Use ambient sounds to enhance concentration</li>
                    <li>• Take regular breaks to maintain focus</li>
                    <li>• Join study rooms for accountability</li>
                    <li>• Track your progress over time</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default FocusPage
