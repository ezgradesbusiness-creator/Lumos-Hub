// src/pages/dashboard.jsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Coffee,
  Settings,
  User,
  Bell,
  Plus,
  CheckCircle,
  Flame,
  Trophy,
  Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import FocusTimer from '@/components/FocusMode/FocusTimer'
import TaskManager from '@/components/Dashboard/TaskManager'
import BackgroundSelector from '@/components/Dashboard/BackgroundSelector'
import StudyTogetherRoom from '@/components/FocusMode/StudyTogetherRoom'
import QuickNotes from '@/components/Dashboard/QuickNotes'
import Button from '@/components/UI/Button'
import Card from '@/components/UI/Card'
import { useUser } from '@/context/UserContext'
import { useTimer } from '@/hooks/useTimer'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, stats, settings } = useUser()
  const { currentSession, isActive, completedSessions } = useTimer()
  const [greeting, setGreeting] = useState('')
  const [todayGoal, setTodayGoal] = useState(4)
  const [completedToday, setCompletedToday] = useState(0)

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // Calculate today's completed sessions
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCompletedSessions = completedSessions.filter(
      session => new Date(session.startTime) >= today
    ).length
    setCompletedToday(todayCompletedSessions)
  }, [completedSessions])

  const progressPercentage = (completedToday / todayGoal) * 100

  const quickActions = [
    {
      name: 'Start Focus',
      description: 'Begin a focused work session',
      icon: Target,
      color: 'bg-primary',
      action: () => navigate('/focus')
    },
    {
      name: 'Take Break',
      description: 'Relax and recharge',
      icon: Coffee,
      color: 'bg-secondary',
      action: () => navigate('/break')
    },
    {
      name: 'View Chronicle',
      description: 'Check your progress',
      icon: BookOpen,
      color: 'bg-accent',
      action: () => navigate('/chronicle')
    },
    {
      name: 'Settings',
      description: 'Customize your experience',
      icon: Settings,
      color: 'bg-gray-500',
      action: () => navigate('/settings')
    }
  ]

  const todayStats = [
    {
      label: 'Sessions Today',
      value: completedToday,
      target: todayGoal,
      icon: Target,
      color: 'text-primary'
    },
    {
      label: 'Focus Time',
      value: `${Math.floor((stats?.totalFocusTime || 0) / 60)}h`,
      icon: Clock,
      color: 'text-secondary'
    },
    {
      label: 'Current Streak',
      value: `${stats?.currentStreak || 0} days`,
      icon: Flame,
      color: 'text-orange-500'
    },
    {
      label: 'Level',
      value: stats?.level || 1,
      icon: Trophy,
      color: 'text-yellow-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Top Bar */}
      <div className="border-b border-card-border bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-semibold text-text">Lumos Hub</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => navigate('/settings')}
                variant="ghost"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`}
                  alt={user?.name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-text hidden sm:block">
                  {user?.name || 'Guest'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">
                {greeting}, {user?.name || 'there'}! 👋
              </h1>
              <p className="text-text-secondary">
                {format(new Date(), 'EEEE, MMMM d, yyyy')} • Ready to focus and achieve your goals?
              </p>
            </div>

            {/* Daily Progress */}
            <div className="mt-4 sm:mt-0">
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">Daily Goal</span>
                    <span className="text-sm font-medium text-text">
                      {completedToday}/{todayGoal}
                    </span>
                  </div>
                  <div className="w-48 h-2 bg-card-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  {progressPercentage >= 100 && (
                    <p className="text-xs text-green-600 mt-1">🎉 Goal achieved!</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-text mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon
              
              return (
                <motion.button
                  key={action.name}
                  onClick={action.action}
                  className="p-6 bg-surface rounded-lg border border-card-border hover:border-primary/30 transition-all group text-left"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  
                  <h3 className="font-semibold text-text mb-1">{action.name}</h3>
                  <p className="text-sm text-text-secondary">{action.description}</p>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Today's Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-text mb-4">Today's Overview</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {todayStats.map((stat, index) => {
              const IconComponent = stat.icon
              
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                >
                  <Card>
                    <div className="p-4 text-center">
                      <IconComponent className={`h-8 w-8 ${stat.color} mx-auto mb-2`} />
                      <p className="text-2xl font-bold text-text mb-1">{stat.value}</p>
                      <p className="text-sm text-text-secondary">{stat.label}</p>
                      {stat.target && (
                        <div className="mt-2">
                          <div className="w-full h-1 bg-card-border rounded-full">
                            <div 
                              className="h-1 bg-primary rounded-full transition-all"
                              style={{ width: `${(stat.value / stat.target) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Session or Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {isActive && currentSession ? (
                <Card>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-text">Current Session</h3>
                      <Button onClick={() => navigate('/focus')} size="sm">
                        <Zap className="h-4 w-4 mr-2" />
                        Go to Focus Mode
                      </Button>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                        <span className="text-primary font-medium">
                          {currentSession.mode} session in progress
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-2">
                        Stay focused! You're doing great.
                      </p>
                    </div>
                  </div>
                </Card>
              ) : (
                <FocusTimer compact />
              )}
            </motion.div>

            {/* Task Manager */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <TaskManager compact />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Notes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <QuickNotes />
            </motion.div>

            {/* Study Together */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <StudyTogetherRoom compact />
            </motion.div>

            {/* Background Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <BackgroundSelector />
            </motion.div>
          </div>
        </div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card>
            <div className="p-6 text-center bg-gradient-to-r from-primary/5 to-secondary/5">
              <blockquote className="text-lg text-text-secondary italic mb-2">
                "The expert in anything was once a beginner who refused to give up."
              </blockquote>
              <p className="text-sm text-primary font-medium">— Helen Hayes</p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default DashboardPage
