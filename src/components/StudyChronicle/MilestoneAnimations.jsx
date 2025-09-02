// src/components/StudyChronicle/MilestoneAnimations.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Star, 
  Award, 
  Crown,
  Zap,
  Target,
  Flame,
  Heart,
  Brain,
  BookOpen,
  Clock,
  TrendingUp,
  Sparkles,
  Gift,
  Party,
  Medal,
  Gem,
  Rocket,
  Mountain,
  Sunrise,
  Coffee,
  TreePine,
  Waves
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'
import confetti from 'canvas-confetti'

const MilestoneAnimations = ({ className = '' }) => {
  const { user } = useUser()
  const [activeMilestone, setActiveMilestone] = useState(null)
  const [recentAchievements, setRecentAchievements] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [userStats, setUserStats] = useState({
    totalSessions: 45,
    totalFocusTime: 2340, // minutes
    currentStreak: 7,
    longestStreak: 12,
    level: 8,
    xp: 1240,
    nextLevelXP: 1500
  })

  const animationRef = useRef(null)

  // Milestone definitions with thresholds and rewards
  const milestones = [
    {
      id: 'first-session',
      name: 'First Steps',
      description: 'Completed your first focus session',
      icon: Sunrise,
      threshold: { sessions: 1 },
      reward: { xp: 50, badge: 'Beginner' },
      rarity: 'common',
      animation: 'bounce'
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Started a session before 8 AM',
      icon: Coffee,
      threshold: { earlyMorning: 1 },
      reward: { xp: 75, badge: 'Morning Person' },
      rarity: 'common',
      animation: 'fadeIn'
    },
    {
      id: 'night-owl',
      name: 'Night Owl',
      description: 'Completed a session after 10 PM',
      icon: Star,
      threshold: { lateNight: 1 },
      reward: { xp: 75, badge: 'Night Warrior' },
      rarity: 'common',
      animation: 'slideUp'
    },
    {
      id: 'consistency-king',
      name: 'Consistency King',
      description: '7-day study streak',
      icon: Flame,
      threshold: { streak: 7 },
      reward: { xp: 200, badge: 'Consistent' },
      rarity: 'uncommon',
      animation: 'flame'
    },
    {
      id: 'deep-thinker',
      name: 'Deep Thinker',
      description: 'Completed 10 deep work sessions',
      icon: Brain,
      threshold: { deepWorkSessions: 10 },
      reward: { xp: 300, badge: 'Deep Worker' },
      rarity: 'uncommon',
      animation: 'pulse'
    },
    {
      id: 'marathon-runner',
      name: 'Marathon Runner',
      description: 'Single session over 2 hours',
      icon: Mountain,
      threshold: { longestSession: 120 },
      reward: { xp: 250, badge: 'Endurance Master' },
      rarity: 'rare',
      animation: 'shake'
    },
    {
      id: 'century-club',
      name: 'Century Club',
      description: '100 completed sessions',
      icon: Trophy,
      threshold: { sessions: 100 },
      reward: { xp: 500, badge: 'Centurion' },
      rarity: 'rare',
      animation: 'explode'
    },
    {
      id: 'time-master',
      name: 'Time Master',
      description: '100 hours of total focus time',
      icon: Clock,
      threshold: { totalTime: 6000 }, // 100 hours in minutes
      reward: { xp: 750, badge: 'Time Lord' },
      rarity: 'epic',
      animation: 'spiral'
    },
    {
      id: 'legend',
      name: 'Living Legend',
      description: '30-day study streak',
      icon: Crown,
      threshold: { streak: 30 },
      reward: { xp: 1000, badge: 'Legend' },
      rarity: 'legendary',
      animation: 'legendary'
    }
  ]

  // Achievement levels and XP thresholds
  const levels = [
    { level: 1, xp: 0, title: 'Novice Scholar', color: '#6b7280' },
    { level: 2, xp: 100, title: 'Eager Learner', color: '#10b981' },
    { level: 3, xp: 250, title: 'Focused Student', color: '#3b82f6' },
    { level: 4, xp: 450, title: 'Dedicated Pupil', color: '#8b5cf6' },
    { level: 5, xp: 700, title: 'Knowledge Seeker', color: '#f59e0b' },
    { level: 10, xp: 2000, title: 'Wisdom Keeper', color: '#ef4444' },
    { level: 15, xp: 4000, title: 'Master Scholar', color: '#ec4899' },
    { level: 20, xp: 7500, title: 'Grand Master', color: '#14b8a6' }
  ]

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-green-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  }

  const rarityGlow = {
    common: 'shadow-gray-500/50',
    uncommon: 'shadow-green-500/50',
    rare: 'shadow-blue-500/50',
    epic: 'shadow-purple-500/50',
    legendary: 'shadow-yellow-500/50'
  }

  useEffect(() => {
    // Check for new milestones based on user stats
    checkForNewMilestones()
    
    // Load recent achievements
    loadRecentAchievements()
  }, [userStats])

  const checkForNewMilestones = () => {
    const newAchievements = []

    milestones.forEach(milestone => {
      if (shouldAwardMilestone(milestone, userStats)) {
        newAchievements.push({
          ...milestone,
          achievedAt: new Date(),
          id: `${milestone.id}-${Date.now()}`
        })
      }
    })

    if (newAchievements.length > 0) {
      setRecentAchievements(prev => [...newAchievements, ...prev.slice(0, 9)])
      // Show the first new achievement
      triggerMilestoneAnimation(newAchievements[0])
    }
  }

  const shouldAwardMilestone = (milestone, stats) => {
    // This would check against actual user data
    // For demo, we'll simulate some achievements
    const demoAchievements = ['first-session', 'early-bird', 'consistency-king', 'deep-thinker']
    return demoAchievements.includes(milestone.id) && Math.random() > 0.7
  }

  const loadRecentAchievements = () => {
    // Load from localStorage or API
    const stored = localStorage.getItem('lumos-achievements')
    if (stored) {
      setRecentAchievements(JSON.parse(stored))
    }
  }

  const triggerMilestoneAnimation = async (milestone) => {
    setActiveMilestone(milestone)
    setShowCelebration(true)

    // Trigger confetti
    if (milestone.rarity === 'legendary' || milestone.rarity === 'epic') {
      await triggerConfetti(milestone.rarity)
    }

    // Play sound effect
    playAchievementSound(milestone.rarity)

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowCelebration(false)
      setTimeout(() => setActiveMilestone(null), 500)
    }, 5000)
  }

  const triggerConfetti = async (rarity) => {
    const colors = {
      epic: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
      legendary: ['#f59e0b', '#fbbf24', '#fcd34d']
    }

    if (rarity === 'legendary') {
      // Multiple bursts for legendary
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors.legendary
          })
        }, i * 300)
      }
    } else {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: colors.epic
      })
    }
  }

  const playAchievementSound = (rarity) => {
    // Play different sounds based on rarity
    const audio = new Audio(`/sounds/achievement-${rarity}.mp3`)
    audio.volume = 0.5
    audio.play().catch(console.error)
  }

  const dismissCelebration = () => {
    setShowCelebration(false)
    setTimeout(() => setActiveMilestone(null), 500)
  }

  const getCurrentLevel = () => {
    return levels.reduce((current, level) => {
      return userStats.xp >= level.xp ? level : current
    }, levels[0])
  }

  const getProgressToNextLevel = () => {
    const currentLevel = getCurrentLevel()
    const nextLevel = levels.find(level => level.xp > userStats.xp)
    
    if (!nextLevel) return 100 // Max level
    
    const progress = ((userStats.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
    return Math.min(progress, 100)
  }

  const getAnimationVariants = (animationType) => {
    const variants = {
      bounce: {
        initial: { scale: 0, y: -50 },
        animate: { 
          scale: 1, 
          y: 0,
          transition: { type: 'spring', stiffness: 300, damping: 20 }
        },
        exit: { scale: 0, opacity: 0 }
      },
      fadeIn: {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      },
      slideUp: {
        initial: { y: 100, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -100, opacity: 0 }
      },
      explode: {
        initial: { scale: 0, rotate: -180 },
        animate: { 
          scale: 1, 
          rotate: 0,
          transition: { type: 'spring', stiffness: 200 }
        },
        exit: { scale: 0, rotate: 180 }
      },
      legendary: {
        initial: { scale: 0, opacity: 0 },
        animate: { 
          scale: [0, 1.2, 1], 
          opacity: 1,
          rotate: [0, 360],
          transition: { duration: 1, ease: 'easeInOut' }
        },
        exit: { scale: 0, opacity: 0 }
      }
    }

    return variants[animationType] || variants.fadeIn
  }

  const currentLevel = getCurrentLevel()
  const progressToNext = getProgressToNextLevel()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Level Progress */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-text flex items-center">
                <Trophy className="mr-2 h-5 w-5" />
                Progress & Achievements
              </h3>
              <p className="text-sm text-text-secondary">Track your learning milestones</p>
            </div>
          </div>

          {/* Current Level Display */}
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl"
              style={{ backgroundColor: currentLevel.color }}
            >
              <Crown className="h-10 w-10 text-white" />
            </motion.div>
            
            <h4 className="text-xl font-bold text-text">Level {currentLevel.level}</h4>
            <p className="text-text-secondary">{currentLevel.title}</p>
            <div className="flex items-center justify-center space-x-2 mt-2 text-sm">
              <span className="text-text-secondary">{userStats.xp} XP</span>
              <div className="w-32 h-2 bg-card-border rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-text-secondary">{userStats.nextLevelXP} XP</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-primary">{userStats.totalSessions}</p>
              <p className="text-xs text-text-secondary">Sessions</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-secondary">
                {Math.floor(userStats.totalFocusTime / 60)}h
              </p>
              <p className="text-xs text-text-secondary">Focus Time</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-accent">{userStats.currentStreak}</p>
              <p className="text-xs text-text-secondary">Day Streak</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-primary">{recentAchievements.length}</p>
              <p className="text-xs text-text-secondary">Achievements</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <div className="p-6">
          <h4 className="font-medium text-text mb-4 flex items-center">
            <Award className="mr-2 h-4 w-4" />
            Recent Achievements
          </h4>

          {recentAchievements.length === 0 ? (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-text-secondary mx-auto mb-2 opacity-50" />
              <p className="text-text-secondary">Complete study sessions to unlock achievements!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAchievements.slice(0, 6).map((achievement, index) => {
                const IconComponent = achievement.icon
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 border-transparent bg-gradient-to-br ${rarityColors[achievement.rarity]} ${rarityGlow[achievement.rarity]} shadow-lg`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-center text-white">
                      <IconComponent className="h-8 w-8 mx-auto mb-2" />
                      <h5 className="font-semibold">{achievement.name}</h5>
                      <p className="text-xs opacity-90 mt-1">{achievement.description}</p>
                      <div className="mt-2 flex items-center justify-center space-x-2 text-xs">
                        <span>+{achievement.reward.xp} XP</span>
                        <span>•</span>
                        <span className="capitalize">{achievement.rarity}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Milestone Categories */}
      <Card>
        <div className="p-6">
          <h4 className="font-medium text-text mb-4">All Milestones</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map(milestone => {
              const IconComponent = milestone.icon
              const isAchieved = recentAchievements.some(a => a.id.includes(milestone.id))
              
              return (
                <div
                  key={milestone.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isAchieved 
                      ? `border-2 bg-gradient-to-br ${rarityColors[milestone.rarity]} text-white` 
                      : 'border-card-border bg-background hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <IconComponent className={`h-6 w-6 flex-shrink-0 ${isAchieved ? 'text-white' : 'text-text-secondary'}`} />
                    <div className="flex-1">
                      <h5 className={`font-medium ${isAchieved ? 'text-white' : 'text-text'}`}>
                        {milestone.name}
                      </h5>
                      <p className={`text-sm mt-1 ${isAchieved ? 'text-white opacity-90' : 'text-text-secondary'}`}>
                        {milestone.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs capitalize ${isAchieved ? 'text-white opacity-75' : 'text-text-secondary'}`}>
                          {milestone.rarity}
                        </span>
                        <span className={`text-xs ${isAchieved ? 'text-white opacity-75' : 'text-text-secondary'}`}>
                          +{milestone.reward.xp} XP
                        </span>
                      </div>
                    </div>
                    {isAchieved && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <Star className="h-5 w-5 text-yellow-300 fill-current" />
                      </motion.div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Milestone Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && activeMilestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={dismissCelebration}
          >
            <motion.div
              {...getAnimationVariants(activeMilestone.animation)}
              className={`bg-gradient-to-br ${rarityColors[activeMilestone.rarity]} p-8 rounded-2xl text-white text-center max-w-md w-full ${rarityGlow[activeMilestone.rarity]} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatDelay: 1 
                }}
                className="text-6xl mb-4"
              >
                <activeMilestone.icon className="h-16 w-16 mx-auto" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-2">Achievement Unlocked!</h3>
              <h4 className="text-xl font-semibold mb-2">{activeMilestone.name}</h4>
              <p className="opacity-90 mb-4">{activeMilestone.description}</p>
              
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className="flex items-center">
                  <Zap className="h-4 w-4 mr-1" />
                  +{activeMilestone.reward.xp} XP
                </span>
                <span className="capitalize">{activeMilestone.rarity}</span>
              </div>

              <Button
                onClick={dismissCelebration}
                className="mt-6 bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MilestoneAnimations
