// src/components/EndOfDaySummary/Summary.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar,
  Clock, 
  CheckCircle, 
  Target, 
  TrendingUp, 
  Award, 
  Star,
  BookOpen,
  Coffee,
  Zap,
  Heart,
  Sparkles,
  Sun,
  Moon,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'
import { sessionService } from '@/services/sessionService'
import { taskService } from '@/services/taskService'
import { format, startOfDay, endOfDay, differenceInMinutes } from 'date-fns'

const Summary = () => {
  const { user } = useUser()
  const [todayStats, setTodayStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)

  // Poetic summaries based on productivity level
  const poeticSummaries = {
    excellent: [
      "Like a candle that burns bright and steady, your focus today illuminated the path to achievement. Each moment of dedication became a brushstroke on the canvas of your growth.",
      "Today, you danced with time itself—each focused breath, each completed task, a note in the symphony of your becoming. The universe whispers: 'Well done, seeker of knowledge.'",
      "In the garden of your mind, you tended to each thought with care. Today's harvest is rich with the fruits of concentrated effort and mindful presence."
    ],
    good: [
      "Like morning dew that nourishes the earth, your steady efforts today have watered the seeds of tomorrow's success. Each small step forward is a victory worth celebrating.",
      "Today you showed that consistency is the gentle force that moves mountains. Your focused moments, like stars in the night sky, guide you toward your dreams.",
      "In the rhythm of work and rest, you found your flow today. Each task completed is a pebble in the river of your journey, creating ripples of progress."
    ],
    fair: [
      "Even the mightiest oak grows slowly, ring by ring. Today was another circle added to your wisdom. Tomorrow brings fresh possibilities for deeper focus.",
      "Like a student of life, you showed up today. Each moment of effort, however small, plants seeds in the soil of your potential. Keep nurturing your growth.",
      "Today you took steps on your path—some quick, some gentle. Remember, every journey has its valleys and peaks. You are exactly where you need to be."
    ],
    needs_improvement: [
      "Every sunset is a promise of a new dawn. Today may have been gentle with your goals, but tomorrow arrives with endless possibilities. Your potential remains boundless.",
      "Like a river that finds its way around obstacles, you too shall find your flow. Today was practice for tomorrow's symphony of focused intention.",
      "In the story of your growth, today was a chapter of rest and reflection. Sometimes the soul needs to wander before it can soar. Tomorrow awaits your return."
    ]
  }

  const motivationalQuotes = [
    "The expert in anything was once a beginner who refused to give up.",
    "Small steps daily lead to big changes yearly.",
    "Your future self is watching. Make them proud.",
    "Progress, not perfection, is the goal.",
    "Every moment is a fresh beginning.",
    "Focus is the art of knowing what to ignore.",
    "Consistency is the compound interest of self-improvement."
  ]

  const achievements = [
    { id: 'early_bird', name: 'Early Bird', description: 'Started studying before 9 AM', icon: '🌅', threshold: 'morning' },
    { id: 'deep_focus', name: 'Deep Focus Master', description: 'Completed 90-minute session', icon: '🧠', threshold: 90 },
    { id: 'consistency', name: 'Consistency Champion', description: 'Studied for 7 days straight', icon: '🔥', threshold: 7 },
    { id: 'task_crusher', name: 'Task Crusher', description: 'Completed 10+ tasks today', icon: '⚡', threshold: 10 },
    { id: 'marathon', name: 'Study Marathon', description: 'Total focus time over 4 hours', icon: '🏃', threshold: 240 },
    { id: 'perfectionist', name: 'Perfect Day', description: 'Completed all planned tasks', icon: '💎', threshold: 'perfect' },
    { id: 'night_owl', name: 'Night Owl', description: 'Studied past 10 PM', icon: '🦉', threshold: 'evening' }
  ]

  useEffect(() => {
    loadTodayStats()
  }, [])

  useEffect(() => {
    if (todayStats && !isLoading) {
      // Animate the summary revelation
      const timer = setTimeout(() => {
        setAnimationStep(prev => Math.min(prev + 1, 4))
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [todayStats, isLoading, animationStep])

  const loadTodayStats = async () => {
    try {
      setIsLoading(true)
      const today = new Date()
      const dayStart = startOfDay(today)
      const dayEnd = endOfDay(today)

      // Load sessions and tasks for today
      const sessions = await sessionService.getByDateRange(dayStart, dayEnd)
      const tasks = await taskService.getByDateRange(dayStart, dayEnd)
      
      // Calculate stats
      const completedSessions = sessions.filter(s => s.completed)
      const totalFocusTime = completedSessions.reduce((acc, session) => 
        acc + differenceInMinutes(new Date(session.endTime), new Date(session.startTime)), 0
      )
      
      const completedTasks = tasks.filter(t => t.completed)
      const totalTasks = tasks.length

      // Determine productivity level
      let productivityLevel = 'needs_improvement'
      if (totalFocusTime >= 240 && completedTasks.length >= 8) {
        productivityLevel = 'excellent'
      } else if (totalFocusTime >= 120 && completedTasks.length >= 5) {
        productivityLevel = 'good'
      } else if (totalFocusTime >= 60 || completedTasks.length >= 3) {
        productivityLevel = 'fair'
      }

      // Check achievements
      const earnedAchievements = checkAchievements(completedSessions, completedTasks, totalFocusTime, tasks)

      const stats = {
        date: today,
        totalFocusTime,
        completedSessions: completedSessions.length,
        totalSessions: sessions.length,
        completedTasks: completedTasks.length,
        totalTasks,
        productivityLevel,
        earnedAchievements,
        sessionsData: completedSessions,
        tasksData: completedTasks,
        streakDays: await calculateStreak(),
        weeklyProgress: await getWeeklyProgress()
      }

      setTodayStats(stats)
    } catch (error) {
      console.error('Error loading today stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAchievements = (sessions, tasks, totalFocusTime, allTasks) => {
    const earned = []
    
    // Early Bird - started before 9 AM
    if (sessions.some(s => new Date(s.startTime).getHours() < 9)) {
      earned.push(achievements.find(a => a.id === 'early_bird'))
    }
    
    // Deep Focus - 90+ minute session
    if (sessions.some(s => differenceInMinutes(new Date(s.endTime), new Date(s.startTime)) >= 90)) {
      earned.push(achievements.find(a => a.id === 'deep_focus'))
    }
    
    // Task Crusher - 10+ tasks
    if (tasks.length >= 10) {
      earned.push(achievements.find(a => a.id === 'task_crusher'))
    }
    
    // Marathon - 4+ hours focus
    if (totalFocusTime >= 240) {
      earned.push(achievements.find(a => a.id === 'marathon'))
    }
    
    // Perfect Day - all tasks completed
    if (allTasks.length > 0 && tasks.length === allTasks.length) {
      earned.push(achievements.find(a => a.id === 'perfectionist'))
    }
    
    // Night Owl - studied past 10 PM
    if (sessions.some(s => new Date(s.startTime).getHours() >= 22)) {
      earned.push(achievements.find(a => a.id === 'night_owl'))
    }
    
    return earned.filter(Boolean)
  }

  const calculateStreak = async () => {
    // This would calculate consecutive days of study
    // For demo, returning a random number between 1-30
    return Math.floor(Math.random() * 30) + 1
  }

  const getWeeklyProgress = async () => {
    // This would get the last 7 days of data
    // For demo, returning sample data
    return [
      { day: 'Mon', focusTime: 120, tasks: 5 },
      { day: 'Tue', focusTime: 90, tasks: 3 },
      { day: 'Wed', focusTime: 180, tasks: 7 },
      { day: 'Thu', focusTime: 150, tasks: 6 },
      { day: 'Fri', focusTime: 200, tasks: 8 },
      { day: 'Sat', focusTime: 60, tasks: 2 },
      { day: 'Sun', focusTime: todayStats?.totalFocusTime || 0, tasks: todayStats?.completedTasks || 0 }
    ]
  }

  const getProductivityEmoji = (level) => {
    const emojis = {
      excellent: '🌟',
      good: '⭐',
      fair: '🌙',
      needs_improvement: '🌱'
    }
    return emojis[level] || '🌱'
  }

  const getProductivityColor = (level) => {
    const colors = {
      excellent: 'text-yellow-500',
      good: 'text-blue-500',
      fair: 'text-purple-500',
      needs_improvement: 'text-green-500'
    }
    return colors[level] || 'text-green-500'
  }

  const getPoeticSummary = (level) => {
    const summaries = poeticSummaries[level] || poeticSummaries.needs_improvement
    return summaries[Math.floor(Math.random() * summaries.length)]
  }

  const shareProgress = () => {
    if (navigator.share && todayStats) {
      navigator.share({
        title: 'My Daily Progress - Lumos Hub',
        text: `Today I focused for ${Math.floor(todayStats.totalFocusTime / 60)}h ${todayStats.totalFocusTime % 60}m and completed ${todayStats.completedTasks} tasks! 🌟`,
        url: window.location.href
      })
    } else {
      setShowShareModal(true)
    }
  }

  const downloadReport = () => {
    if (!todayStats) return
    
    const report = {
      date: format(todayStats.date, 'yyyy-MM-dd'),
      summary: {
        totalFocusTime: todayStats.totalFocusTime,
        completedSessions: todayStats.completedSessions,
        completedTasks: todayStats.completedTasks,
        productivityLevel: todayStats.productivityLevel,
        achievements: todayStats.earnedAchievements.map(a => a.name)
      },
      sessions: todayStats.sessionsData,
      tasks: todayStats.tasksData
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumos-summary-${format(todayStats.date, 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-text-secondary">Gathering your day's journey...</p>
        </div>
      </Card>
    )
  }

  if (!todayStats) {
    return (
      <Card>
        <div className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary">No activity recorded for today.</p>
          <Button onClick={loadTodayStats} size="sm" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-6xl mr-4"
          >
            {getProductivityEmoji(todayStats.productivityLevel)}
          </motion.div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-primary">End of Day Summary</h1>
            <p className="text-text-secondary">
              {format(todayStats.date, 'EEEE, MMMM do, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button onClick={shareProgress} size="sm" variant="ghost">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={downloadReport} size="sm" variant="ghost">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: animationStep >= 1 ? 1 : 0, scale: animationStep >= 1 ? 1 : 0.9 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <div className="p-6 text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-3xl font-bold text-primary">
                {Math.floor(todayStats.totalFocusTime / 60)}h {todayStats.totalFocusTime % 60}m
              </p>
              <p className="text-sm text-text-secondary">Total Focus Time</p>
              <div className="mt-2 text-xs text-text-secondary">
                {todayStats.completedSessions}/{todayStats.totalSessions} sessions completed
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: animationStep >= 2 ? 1 : 0, scale: animationStep >= 2 ? 1 : 0.9 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <div className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-3xl font-bold text-secondary">{todayStats.completedTasks}</p>
              <p className="text-sm text-text-secondary">Tasks Completed</p>
              <div className="mt-2 text-xs text-text-secondary">
                {todayStats.totalTasks > 0 ? 
                  `${Math.round((todayStats.completedTasks / todayStats.totalTasks) * 100)}% completion rate` :
                  'No tasks planned today'
                }
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: animationStep >= 3 ? 1 : 0, scale: animationStep >= 3 ? 1 : 0.9 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card>
            <div className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-3xl font-bold text-accent">{todayStats.streakDays}</p>
              <p className="text-sm text-text-secondary">Day Streak</p>
              <div className="mt-2 text-xs text-text-secondary">
                Consecutive study days
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Achievements */}
      {todayStats.earnedAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: animationStep >= 4 ? 1 : 0, y: animationStep >= 4 ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Today's Achievements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {todayStats.earnedAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.2 }}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <p className="font-medium text-yellow-800">{achievement.name}</p>
                      <p className="text-xs text-yellow-600">{achievement.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Poetic Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: animationStep >= 4 ? 1 : 0, y: animationStep >= 4 ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-primary mr-2" />
              <h3 className="text-lg font-semibold text-text">Daily Reflection</h3>
              <Sparkles className="h-5 w-5 text-primary ml-2" />
            </div>
            
            <div className="text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className={`text-lg font-medium mb-4 ${getProductivityColor(todayStats.productivityLevel)}`}
              >
                {todayStats.productivityLevel.replace('_', ' ').toUpperCase()} DAY
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1.5 }}
                className="text-text-secondary leading-relaxed italic max-w-2xl mx-auto"
              >
                "{getPoeticSummary(todayStats.productivityLevel)}"
              </motion.div>
            </div>
            
            <div className="mt-6 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 1 }}
                className="text-sm text-primary font-medium"
              >
                {motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]}
              </motion.p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Weekly Progress Chart */}
      {todayStats.weeklyProgress && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              This Week's Journey
            </h3>
            
            <div className="grid grid-cols-7 gap-2">
              {todayStats.weeklyProgress.map((day, index) => (
                <div key={day.day} className="text-center">
                  <p className="text-xs text-text-secondary mb-2">{day.day}</p>
                  <motion.div
                    className="bg-primary/10 rounded-lg p-3 mb-2"
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    transition={{ delay: 1.5 + index * 0.1 }}
                  >
                    <div className="text-xs font-medium text-text">
                      {Math.floor(day.focusTime / 60)}h
                    </div>
                    <div className="text-xs text-text-secondary">
                      {day.tasks} tasks
                    </div>
                  </motion.div>
                  <motion.div
                    className="w-full bg-card-border rounded-full h-2"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 2 + index * 0.1 }}
                  >
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((day.focusTime / 240) * 100, 100)}%` }}
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tomorrow's Intention */}
      <Card>
        <div className="p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 0.8 }}
          >
            <Sun className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text mb-2">Tomorrow Awaits</h3>
            <p className="text-text-secondary mb-4">
              Set your intention for another day of growth and discovery.
            </p>
            <div className="flex justify-center space-x-2">
              <Button size="sm">Plan Tomorrow</Button>
              <Button size="sm" variant="ghost">View Goals</Button>
            </div>
          </motion.div>
        </div>
      </Card>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-surface rounded-xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-text mb-4">Share Your Progress</h3>
              <div className="bg-background p-4 rounded-lg mb-4 text-sm">
                Today I focused for {Math.floor(todayStats.totalFocusTime / 60)}h {todayStats.totalFocusTime % 60}m 
                and completed {todayStats.completedTasks} tasks with Lumos Hub! 🌟
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`Today I focused for ${Math.floor(todayStats.totalFocusTime / 60)}h ${todayStats.totalFocusTime % 60}m and completed ${todayStats.completedTasks} tasks with Lumos Hub! 🌟`)
                    setShowShareModal(false)
                  }}
                  className="flex-1"
                  size="sm"
                >
                  Copy Text
                </Button>
                <Button
                  onClick={() => setShowShareModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Summary
