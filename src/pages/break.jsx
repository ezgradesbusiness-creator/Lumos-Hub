// src/pages/break.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coffee, 
  Heart, 
  GameController2, 
  TreePine, 
  Music,
  ArrowLeft,
  Timer,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StretchPrompts from '@/components/BreakMode/StretchPrompts'
import MiniGames from '@/components/BreakMode/MiniGames'
import YouTubePlayer from '@/components/BreakMode/YouTubePlayer'
import Button from '@/components/UI/Button'
import Card from '@/components/UI/Card'
import { useUser } from '@/context/UserContext'
import { useTimer } from '@/hooks/useTimer'

const BreakPage = () => {
  const navigate = useNavigate()
  const { user, settings } = useUser()
  const { isBreak, breakTimeRemaining, timeRemaining } = useTimer()
  const [activeMode, setActiveMode] = useState('wellness')
  const [breakTimer, setBreakTimer] = useState(300) // 5 minutes default
  const [isBreakActive, setIsBreakActive] = useState(false)

  // Break activity modes
  const breakModes = [
    {
      id: 'wellness',
      name: 'Wellness & Stretching',
      description: 'Physical exercises and breathing',
      icon: Heart,
      component: StretchPrompts,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50'
    },
    {
      id: 'games',
      name: 'Mini Games',
      description: 'Quick brain exercises and puzzles',
      icon: GameController2,
      component: MiniGames,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'music',
      name: 'Music & Podcasts',
      description: 'Relaxing audio content',
      icon: Music,
      component: YouTubePlayer,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'nature',
      name: 'Nature Sounds',
      description: 'Ambient soundscapes for relaxation',
      icon: TreePine,
      component: ({ className }) => (
        <Card className={className}>
          <div className="p-6 text-center">
            <TreePine className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">Nature Sounds</h3>
            <p className="text-text-secondary">Immerse yourself in calming nature soundscapes</p>
            <Button className="mt-4" onClick={() => navigate('/focus')}>
              Open Ambient Sounds
            </Button>
          </div>
        </Card>
      ),
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    }
  ]

  // Break timer effect
  useEffect(() => {
    let interval
    if (isBreakActive && breakTimer > 0) {
      interval = setInterval(() => {
        setBreakTimer(prev => {
          if (prev <= 1) {
            setIsBreakActive(false)
            // Show notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Break Complete!', {
                body: 'Time to get back to focused work!',
                icon: '/favicon.ico'
              })
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isBreakActive, breakTimer])

  const startBreakTimer = (duration = 300) => {
    setBreakTimer(duration)
    setIsBreakActive(true)
  }

  const toggleBreakTimer = () => {
    setIsBreakActive(!isBreakActive)
  }

  const resetBreakTimer = () => {
    setIsBreakActive(false)
    setBreakTimer(300)
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const ActiveComponent = breakModes.find(mode => mode.id === activeMode)?.component

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <div className="border-b border-card-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
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
                Back to Dashboard
              </Button>
            </div>

            {/* Break Timer */}
            <div className="flex items-center space-x-4">
              {(isBreak || isBreakActive) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2"
                >
                  <Timer className="h-4 w-4 text-primary" />
                  <span className="font-mono text-lg font-semibold text-primary">
                    {formatTime(isBreak ? timeRemaining : breakTimer)}
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      onClick={toggleBreakTimer}
                      size="sm"
                      variant="ghost"
                    >
                      {isBreakActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      onClick={resetBreakTimer}
                      size="sm"
                      variant="ghost"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Quick Break Timer Buttons */}
              {!isBreak && !isBreakActive && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-secondary">Quick break:</span>
                  <Button onClick={() => startBreakTimer(300)} size="sm" variant="ghost">
                    5m
                  </Button>
                  <Button onClick={() => startBreakTimer(900)} size="sm" variant="ghost">
                    15m
                  </Button>
                  <Button onClick={() => startBreakTimer(1800)} size="sm" variant="ghost">
                    30m
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <Coffee className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-text">Break Time</h1>
          </div>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Take a well-deserved break and recharge your mind and body. 
            Choose an activity that helps you relax and prepare for your next focus session.
          </p>
          
          {user && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-full text-sm">
              Welcome back, {user.name}! You've earned this break. 🌟
            </div>
          )}
        </motion.div>

        {/* Activity Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text mb-4">Choose Your Break Activity</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {breakModes.map((mode, index) => {
                  const IconComponent = mode.icon
                  const isActive = activeMode === mode.id
                  
                  return (
                    <motion.button
                      key={mode.id}
                      onClick={() => setActiveMode(mode.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isActive
                          ? 'border-primary bg-primary/10'
                          : 'border-card-border bg-background hover:border-primary/30'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      <div className={`${mode.bgColor} rounded-lg p-3 mb-3 w-fit`}>
                        <IconComponent className={`h-6 w-6 ${mode.color}`} />
                      </div>
                      
                      <h3 className={`font-semibold mb-1 ${isActive ? 'text-primary' : 'text-text'}`}>
                        {mode.name}
                      </h3>
                      
                      <p className="text-sm text-text-secondary">
                        {mode.description}
                      </p>
                      
                      {isActive && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          className="h-0.5 bg-primary mt-3 rounded-full"
                        />
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Active Component */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {ActiveComponent && <ActiveComponent />}
          </motion.div>
        </AnimatePresence>

        {/* Break Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
              <h3 className="text-lg font-semibold text-text mb-4">Break Time Tips</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-text mb-2">Physical Wellness</h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Stand up and stretch your body</li>
                    <li>• Do some light exercises or yoga</li>
                    <li>• Practice deep breathing exercises</li>
                    <li>• Stay hydrated with water or herbal tea</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-text mb-2">Mental Refresh</h4>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Step away from screens completely</li>
                    <li>• Practice mindfulness or meditation</li>
                    <li>• Listen to calming music or nature sounds</li>
                    <li>• Engage in light, fun activities</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default BreakPage
