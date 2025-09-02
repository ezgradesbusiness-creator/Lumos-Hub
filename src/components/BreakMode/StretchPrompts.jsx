// src/components/BreakMode/StretchPrompts.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw,
  Heart,
  Timer,
  Zap,
  CheckCircle,
  Wind
} from 'lucide-react'
import Button from '@/components/UI/Button'
import Card from '@/components/UI/Card'

const StretchPrompts = () => {
  const [activeExercise, setActiveExercise] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedExercises, setCompletedExercises] = useState([])
  const [breathingCount, setBreathingCount] = useState(0)
  const [breathingPhase, setBreathingPhase] = useState('inhale') // inhale, hold, exhale

  const exercises = [
    {
      id: 'neck-rolls',
      name: 'Neck Rolls',
      description: 'Gentle neck and shoulder relief',
      icon: '🦴',
      duration: 60,
      category: 'neck',
      difficulty: 'Easy',
      steps: [
        'Sit up straight with shoulders relaxed',
        'Slowly roll your head to the right',
        'Roll your head back gently',
        'Roll your head to the left',
        'Roll your head forward',
        'Repeat in the opposite direction'
      ]
    },
    {
      id: 'shoulder-shrugs',
      name: 'Shoulder Shrugs',
      description: 'Release shoulder tension',
      icon: '💪',
      duration: 45,
      category: 'shoulders',
      difficulty: 'Easy',
      steps: [
        'Sit or stand with arms at your sides',
        'Lift your shoulders up toward your ears',
        'Hold for 3 seconds',
        'Roll shoulders back and down',
        'Repeat 10 times'
      ]
    },
    {
      id: 'wrist-circles',
      name: 'Wrist Circles',
      description: 'Combat typing strain',
      icon: '🤲',
      duration: 30,
      category: 'wrists',
      difficulty: 'Easy',
      steps: [
        'Extend arms in front of you',
        'Make circles with your wrists',
        'Circle 10 times clockwise',
        'Circle 10 times counterclockwise',
        'Flex and point your fingers'
      ]
    },
    {
      id: 'spinal-twist',
      name: 'Seated Spinal Twist',
      description: 'Improve spine mobility',
      icon: '🌀',
      duration: 90,
      category: 'spine',
      difficulty: 'Medium',
      steps: [
        'Sit tall with feet flat on floor',
        'Place right hand on left knee',
        'Place left hand behind you',
        'Gently twist to the left',
        'Hold for 15 seconds',
        'Repeat on the other side'
      ]
    },
    {
      id: 'chest-stretch',
      name: 'Chest Opener',
      description: 'Counter forward posture',
      icon: '🫸',
      duration: 60,
      category: 'chest',
      difficulty: 'Easy',
      steps: [
        'Stand or sit up straight',
        'Clasp hands behind your back',
        'Straighten arms and lift hands up',
        'Open chest and squeeze shoulder blades',
        'Hold for 20 seconds',
        'Release and repeat'
      ]
    },
    {
      id: 'eye-exercises',
      name: 'Eye Relief',
      description: 'Reduce screen eye strain',
      icon: '👁️',
      duration: 75,
      category: 'eyes',
      difficulty: 'Easy',
      steps: [
        'Look away from your screen',
        'Focus on something 20 feet away',
        'Look up and down slowly',
        'Look left and right slowly',
        'Make large circles with your eyes',
        'Blink rapidly 10 times'
      ]
    },
    {
      id: 'breathing',
      name: 'Box Breathing',
      description: '4-4-4-4 breathing pattern',
      icon: '🫁',
      duration: 120,
      category: 'breathing',
      difficulty: 'Easy',
      steps: [
        'Sit comfortably with straight spine',
        'Inhale slowly for 4 counts',
        'Hold your breath for 4 counts',
        'Exhale slowly for 4 counts',
        'Hold empty lungs for 4 counts',
        'Repeat the cycle'
      ]
    }
  ]

  const quickBoosts = [
    {
      id: 'power-pose',
      name: '2-Minute Power Pose',
      description: 'Boost confidence and energy',
      icon: '💪',
      duration: 120
    },
    {
      id: 'desk-pushups',
      name: 'Desk Push-ups',
      description: 'Quick strength boost',
      icon: '🏃',
      duration: 60
    },
    {
      id: 'calf-raises',
      name: 'Calf Raises',
      description: 'Improve circulation',
      icon: '🦵',
      duration: 45
    },
    {
      id: 'deep-breathing',
      name: 'Deep Breathing',
      description: 'Instant stress relief',
      icon: '🫁',
      duration: 90
    }
  ]

  // Timer effect
  useEffect(() => {
    let interval
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            if (activeExercise) {
              setCompletedExercises(prev => [...prev, activeExercise.id])
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeRemaining, activeExercise])

  // Breathing animation effect
  useEffect(() => {
    let breathingInterval
    if (activeExercise?.id === 'breathing' && isRunning) {
      breathingInterval = setInterval(() => {
        const phases = ['inhale', 'hold1', 'exhale', 'hold2']
        setBreathingPhase(prev => {
          const currentIndex = phases.indexOf(prev)
          const nextIndex = (currentIndex + 1) % phases.length
          
          if (nextIndex === 0) {
            setBreathingCount(prevCount => prevCount + 1)
          }
          
          return phases[nextIndex]
        })
      }, 4000) // 4 seconds per phase
    }
    return () => clearInterval(breathingInterval)
  }, [activeExercise?.id, isRunning])

  const startExercise = (exercise) => {
    setActiveExercise(exercise)
    setTimeRemaining(exercise.duration)
    setCurrentStep(0)
    setIsRunning(true)
    
    if (exercise.id === 'breathing') {
      setBreathingCount(0)
      setBreathingPhase('inhale')
    }
  }

  const pauseExercise = () => {
    setIsRunning(false)
  }

  const resumeExercise = () => {
    setIsRunning(true)
  }

  const stopExercise = () => {
    setActiveExercise(null)
    setTimeRemaining(0)
    setIsRunning(false)
    setCurrentStep(0)
    setBreathingCount(0)
  }

  const nextStep = () => {
    if (activeExercise && currentStep < activeExercise.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getBreathingInstruction = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'Breathe In'
      case 'hold1':
        return 'Hold'
      case 'exhale':
        return 'Breathe Out'
      case 'hold2':
        return 'Hold'
      default:
        return 'Breathe'
    }
  }

  const getBreathingColor = () => {
    switch (breathingPhase) {
      case 'inhale':
        return 'text-blue-500'
      case 'hold1':
      case 'hold2':
        return 'text-purple-500'
      case 'exhale':
        return 'text-green-500'
      default:
        return 'text-primary'
    }
  }

  // If an exercise is active, show the exercise interface
  if (activeExercise) {
    return (
      <Card>
        <div className="p-6">
          {/* Exercise Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{activeExercise.icon}</span>
              <div>
                <h3 className="font-semibold text-text">{activeExercise.name}</h3>
                <p className="text-sm text-text-secondary">{activeExercise.description}</p>
              </div>
            </div>
            
            <Button onClick={stopExercise} size="sm" variant="ghost">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
              className="text-4xl font-bold text-primary mb-2"
            >
              {formatTime(timeRemaining)}
            </motion.div>
            
            <div className="flex justify-center space-x-2">
              {!isRunning ? (
                <Button onClick={resumeExercise} className="flex items-center">
                  <Play className="mr-2 h-4 w-4" />
                  {timeRemaining === activeExercise.duration ? 'Start' : 'Resume'}
                </Button>
              ) : (
                <Button onClick={pauseExercise} variant="secondary" className="flex items-center">
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
            </div>
          </div>

          {/* Special Breathing Interface */}
          {activeExercise.id === 'breathing' && (
            <div className="text-center mb-6">
              <motion.div
                animate={{
                  scale: breathingPhase === 'inhale' ? 1.2 : 
                        breathingPhase === 'exhale' ? 0.8 : 1
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center"
              >
                <Wind className="h-12 w-12 text-white" />
              </motion.div>
              
              <p className={`text-xl font-medium ${getBreathingColor()} mb-2`}>
                {getBreathingInstruction()}
              </p>
              
              <p className="text-sm text-text-secondary">
                Cycle {breathingCount + 1} • {Math.floor(breathingCount / 4) + 1} complete rounds
              </p>
            </div>
          )}

          {/* Exercise Steps */}
          {activeExercise.id !== 'breathing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-text">Steps</h4>
                <span className="text-sm text-text-secondary">
                  {currentStep + 1} of {activeExercise.steps.length}
                </span>
              </div>
              
              <div className="space-y-2">
                {activeExercise.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg flex items-center space-x-3 ${
                      index === currentStep
                        ? 'bg-primary/10 border border-primary/20'
                        : index < currentStep
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-background border border-card-border'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      index < currentStep
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                        ? 'bg-primary text-white'
                        : 'bg-card-border text-text-secondary'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      index === currentStep ? 'text-text font-medium' : 'text-text-secondary'
                    }`}>
                      {step}
                    </p>
                  </motion.div>
                ))}
              </div>
              
              {currentStep < activeExercise.steps.length - 1 && (
                <div className="text-center">
                  <Button onClick={nextStep} size="sm" variant="ghost">
                    <SkipForward className="mr-2 h-4 w-4" />
                    Next Step
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Completion Message */}
          {timeRemaining === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="font-medium text-green-800">Exercise Complete!</p>
              <p className="text-sm text-green-600">Great job taking care of your health.</p>
            </motion.div>
          )}
        </div>
      </Card>
    )
  }

  // Main exercise selection interface
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-text mb-2 flex items-center justify-center">
          <Activity className="mr-2 h-6 w-6" />
          Wellness & Stretching
        </h3>
        <p className="text-text-secondary">Take care of your body while you take breaks</p>
      </div>

      {/* Quick Boosts */}
      <div>
        <h4 className="font-medium text-text mb-3 flex items-center">
          <Zap className="mr-2 h-4 w-4" />
          Quick Energy Boosts
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {quickBoosts.map(boost => (
            <motion.div
              key={boost.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                className="w-full p-3 h-auto flex flex-col items-center text-center"
                onClick={() => startExercise({ ...boost, steps: [`Perform ${boost.name} for ${boost.duration} seconds`] })}
              >
                <span className="text-2xl mb-1">{boost.icon}</span>
                <span className="text-sm font-medium">{boost.name}</span>
                <span className="text-xs text-text-secondary">{boost.duration}s</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Exercises */}
      <div>
        <h4 className="font-medium text-text mb-3">Guided Exercises</h4>
        <div className="space-y-2">
          {exercises.map(exercise => (
            <motion.div
              key={exercise.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                <div className="p-4" onClick={() => startExercise(exercise)}>
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{exercise.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-text">{exercise.name}</h5>
                        <div className="flex items-center space-x-2 text-xs text-text-secondary">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {exercise.difficulty}
                          </span>
                          <span className="flex items-center">
                            <Timer className="h-3 w-3 mr-1" />
                            {exercise.duration}s
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{exercise.description}</p>
                      
                      {completedExercises.includes(exercise.id) && (
                        <div className="flex items-center mt-2 text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Completed today</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <Card>
        <div className="p-4">
          <h4 className="font-medium text-text mb-3 flex items-center">
            <Heart className="mr-2 h-4 w-4" />
            Today's Wellness
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{completedExercises.length}</p>
              <p className="text-xs text-text-secondary">Exercises Done</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">
                {Math.floor(completedExercises.length * 1.5)}
              </p>
              <p className="text-xs text-text-secondary">Minutes Active</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent">
                {completedExercises.length >= 3 ? '🔥' : '⭐'}
              </p>
              <p className="text-xs text-text-secondary">
                {completedExercises.length >= 3 ? 'On Fire!' : 'Good Start'}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default StretchPrompts
