// src/components/StudyChronicle/Journal.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp,
  Star,
  Award,
  Flame,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Download,
  Share2,
  Eye,
  EyeOff,
  Book,
  Scroll,
  Feather,
  Sparkles,
  Heart,
  Zap,
  Coffee,
  Moon,
  Sun
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { useUser } from '@/context/UserContext'
import { sessionService } from '@/services/sessionService'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays, isSameDay } from 'date-fns'

const Journal = ({ period = 'week', className = '' }) => {
  const { user } = useUser()
  const [sessions, setSessions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState(null)
  const [viewMode, setViewMode] = useState('bookshelf') // bookshelf, list, calendar
  const [filterMode, setFilterMode] = useState('all') // all, pomodoro, deep-work, break
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [journalEntries, setJournalEntries] = useState([])
  const bookshelfRef = useRef(null)

  // Sample sessions for demonstration
  const sampleSessions = [
    {
      id: '1',
      date: new Date(),
      mode: 'pomodoro',
      duration: 25,
      task: 'React Component Development',
      completed: true,
      startTime: new Date(Date.now() - 86400000),
      endTime: new Date(Date.now() - 85800000),
      notes: 'Completed the timer component. Good focus session!',
      mood: 'productive',
      difficulty: 'medium',
      tags: ['coding', 'react', 'frontend']
    },
    {
      id: '2',
      date: subDays(new Date(), 1),
      mode: 'deep-work',
      duration: 90,
      task: 'Research Paper Reading',
      completed: true,
      startTime: subDays(new Date(), 1),
      endTime: addDays(subDays(new Date(), 1), 0),
      notes: 'Deep dive into productivity research. Very insightful.',
      mood: 'focused',
      difficulty: 'hard',
      tags: ['research', 'reading', 'academic']
    },
    {
      id: '3',
      date: subDays(new Date(), 2),
      mode: 'pomodoro',
      duration: 25,
      task: 'Email Management',
      completed: true,
      startTime: subDays(new Date(), 2),
      endTime: addDays(subDays(new Date(), 2), 0),
      notes: 'Cleared inbox efficiently.',
      mood: 'satisfied',
      difficulty: 'easy',
      tags: ['admin', 'email', 'organization']
    },
    {
      id: '4',
      date: subDays(new Date(), 3),
      mode: 'deep-work',
      duration: 120,
      task: 'UI Design System',
      completed: true,
      startTime: subDays(new Date(), 3),
      endTime: addDays(subDays(new Date(), 3), 0),
      notes: 'Created comprehensive design system. Very proud of the result!',
      mood: 'accomplished',
      difficulty: 'hard',
      tags: ['design', 'ui', 'system']
    }
  ]

  const bookTypes = [
    { type: 'pomodoro', color: '#ef4444', title: 'Focus Sessions', icon: '📕', thickness: 2 },
    { type: 'deep-work', color: '#3b82f6', title: 'Deep Work', icon: '📘', thickness: 3 },
    { type: 'learning', color: '#10b981', title: 'Learning', icon: '📗', thickness: 2.5 },
    { type: 'creative', color: '#f59e0b', title: 'Creative Work', icon: '📙', thickness: 2 }
  ]

  const moodEmojis = {
    productive: '💪',
    focused: '🎯',
    satisfied: '😊',
    accomplished: '🏆',
    tired: '😴',
    frustrated: '😤',
    inspired: '✨',
    calm: '😌'
  }

  const difficultyColors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500'
  }

  useEffect(() => {
    loadSessions()
  }, [period, selectedDate])

  const loadSessions = async () => {
    setIsLoading(true)
    try {
      // In production, this would call sessionService.getByPeriod()
      setSessions(sampleSessions)
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading sessions:', error)
      setIsLoading(false)
    }
  }

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filterMode === 'all' || session.mode === filterMode
    const matchesSearch = !searchTerm || 
      session.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesFilter && matchesSearch
  })

  const getSessionStats = () => {
    const totalSessions = filteredSessions.length
    const totalTime = filteredSessions.reduce((acc, session) => acc + session.duration, 0)
    const completedSessions = filteredSessions.filter(s => s.completed).length
    const averageSession = totalSessions > 0 ? totalTime / totalSessions : 0

    return {
      totalSessions,
      totalTime,
      completedSessions,
      averageSession,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    }
  }

  const generateBookshelfRows = () => {
    const rows = []
    const sessionsPerShelf = 8
    
    for (let i = 0; i < filteredSessions.length; i += sessionsPerShelf) {
      const shelfSessions = filteredSessions.slice(i, i + sessionsPerShelf)
      rows.push(shelfSessions)
    }
    
    // Add empty shelf if no sessions
    if (rows.length === 0) {
      rows.push([])
    }
    
    return rows
  }

  const getBookAppearance = (session) => {
    const bookType = bookTypes.find(type => type.type === session.mode) || bookTypes[0]
    const height = Math.max(60, (session.duration / 120) * 80) // Scale height by duration
    
    return {
      ...bookType,
      height,
      width: bookType.thickness * 20,
      opacity: session.completed ? 1 : 0.6
    }
  }

  const exportJournal = () => {
    const journalData = {
      period,
      date: selectedDate.toISOString(),
      sessions: filteredSessions,
      stats: getSessionStats(),
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(journalData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `study-journal-${format(selectedDate, 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = getSessionStats()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-text flex items-center">
            <BookOpen className="mr-2 h-6 w-6" />
            Study Journal
          </h3>
          <p className="text-sm text-text-secondary">
            Your visual progress through focused learning
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setViewMode(viewMode === 'bookshelf' ? 'list' : 'bookshelf')}
            size="sm"
            variant="ghost"
          >
            {viewMode === 'bookshelf' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          
          <Button onClick={exportJournal} size="sm" variant="ghost">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{stats.totalSessions}</p>
            <p className="text-xs text-text-secondary">Sessions</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">
              {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
            </p>
            <p className="text-xs text-text-secondary">Total Time</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{Math.round(stats.completionRate)}%</p>
            <p className="text-xs text-text-secondary">Completion</p>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{Math.round(stats.averageSession)}m</p>
            <p className="text-xs text-text-secondary">Avg Session</p>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search sessions, tasks, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-text-secondary" />
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            className="px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-background"
          >
            <option value="all">All Sessions</option>
            <option value="pomodoro">Pomodoro</option>
            <option value="deep-work">Deep Work</option>
            <option value="break">Breaks</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading your study journal...</p>
          </div>
        </Card>
      ) : viewMode === 'bookshelf' ? (
        /* Bookshelf View */
        <Card>
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium text-text flex items-center">
                <Book className="mr-2 h-4 w-4" />
                Your Study Library
              </h4>
              <p className="text-sm text-text-secondary">
                Each book represents a completed session
              </p>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-text-secondary mx-auto mb-4 opacity-50" />
                <p className="text-text-secondary mb-2">Your bookshelf is waiting for its first book</p>
                <p className="text-sm text-text-secondary">Complete a study session to add your first volume!</p>
              </div>
            ) : (
              <div className="space-y-8" ref={bookshelfRef}>
                {generateBookshelfRows().map((shelfSessions, shelfIndex) => (
                  <motion.div
                    key={shelfIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: shelfIndex * 0.1 }}
                    className="relative"
                  >
                    {/* Shelf */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-800 to-amber-900 rounded-lg shadow-lg" />
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 to-amber-800 rounded-lg" />
                    
                    {/* Books */}
                    <div className="flex items-end space-x-1 pb-4 min-h-[100px]">
                      {shelfSessions.map((session, bookIndex) => {
                        const bookAppearance = getBookAppearance(session)
                        
                        return (
                          <motion.div
                            key={session.id}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: bookAppearance.opacity, scaleY: 1 }}
                            transition={{ delay: (shelfIndex * 0.5) + (bookIndex * 0.1) }}
                            className="relative cursor-pointer group"
                            style={{
                              width: `${bookAppearance.width}px`,
                              height: `${bookAppearance.height}px`,
                              backgroundColor: bookAppearance.color,
                            }}
                            onClick={() => setSelectedSession(session)}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {/* Book spine */}
                            <div 
                              className="absolute inset-0 rounded-r-sm shadow-lg"
                              style={{ backgroundColor: bookAppearance.color }}
                            >
                              {/* Book title */}
                              <div className="absolute top-2 left-1 right-1 text-white text-xs font-bold truncate transform -rotate-90 origin-center">
                                {session.task.substring(0, 10)}...
                              </div>
                              
                              {/* Duration indicator */}
                              <div className="absolute bottom-2 left-1 right-1 text-white text-xs text-center">
                                {session.duration}m
                              </div>

                              {/* Book texture lines */}
                              <div className="absolute top-0 bottom-0 left-0 w-px bg-black/20" />
                              <div className="absolute top-0 bottom-0 right-0 w-px bg-white/20" />
                            </div>

                            {/* Hover tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {session.task} • {session.duration}m
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/80" />
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                      
                      {/* Empty slots for visual consistency */}
                      {shelfSessions.length < 8 && (
                        <div className="flex-1 flex items-end space-x-1">
                          {[...Array(8 - shelfSessions.length)].map((_, i) => (
                            <div
                              key={i}
                              className="w-6 h-16 border-2 border-dashed border-card-border rounded opacity-30"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>
      ) : (
        /* List View */
        <Card>
          <div className="p-6">
            <h4 className="font-medium text-text mb-4 flex items-center">
              <Scroll className="mr-2 h-4 w-4" />
              Session Timeline
            </h4>

            {filteredSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-text-secondary mx-auto mb-2 opacity-50" />
                <p className="text-text-secondary">No sessions found for the selected criteria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center p-4 border border-card-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex-shrink-0 mr-4">
                      <div 
                        className="w-4 h-16 rounded"
                        style={{ backgroundColor: getBookAppearance(session).color }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-text">{session.task}</h5>
                          <p className="text-sm text-text-secondary mt-1">
                            {format(session.date, 'MMM d, yyyy')} • {session.duration} minutes
                          </p>
                          {session.notes && (
                            <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                              {session.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {session.mood && (
                            <span className="text-lg" title={session.mood}>
                              {moodEmojis[session.mood]}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full bg-background border ${difficultyColors[session.difficulty]}`}>
                            {session.difficulty}
                          </span>
                        </div>
                      </div>

                      {session.tags && session.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {session.tags.map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Session Detail Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Session Details"
        size="lg"
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Session Header */}
            <div className="text-center">
              <div 
                className="w-16 h-20 mx-auto mb-4 rounded shadow-lg"
                style={{ backgroundColor: getBookAppearance(selectedSession).color }}
              />
              <h3 className="text-xl font-semibold text-text">{selectedSession.task}</h3>
              <p className="text-text-secondary">
                {format(selectedSession.date, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{selectedSession.duration}m</p>
                <p className="text-xs text-text-secondary">Duration</p>
              </div>
              <div>
                <p className="text-2xl">{moodEmojis[selectedSession.mood] || '😐'}</p>
                <p className="text-xs text-text-secondary capitalize">{selectedSession.mood || 'neutral'}</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${difficultyColors[selectedSession.difficulty]}`}>
                  {selectedSession.difficulty?.toUpperCase()}
                </p>
                <p className="text-xs text-text-secondary">Difficulty</p>
              </div>
            </div>

            {/* Session Notes */}
            {selectedSession.notes && (
              <div>
                <h4 className="font-medium text-text mb-2 flex items-center">
                  <Feather className="mr-2 h-4 w-4" />
                  Session Notes
                </h4>
                <div className="p-4 bg-background rounded-lg border border-card-border">
                  <p className="text-text-secondary">{selectedSession.notes}</p>
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedSession.tags && selectedSession.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-text mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSession.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Session Timeline */}
            <div>
              <h4 className="font-medium text-text mb-2 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Timeline
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Started:</span>
                  <span className="text-text">{format(selectedSession.startTime, 'HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Completed:</span>
                  <span className="text-text">{format(selectedSession.endTime, 'HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Mode:</span>
                  <span className="text-text capitalize">{selectedSession.mode.replace('-', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Journal
