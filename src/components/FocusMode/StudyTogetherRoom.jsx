// src/components/FocusMode/StudyTogetherRoom.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MessageSquare, 
  Send, 
  Clock, 
  Play, 
  Pause,
  UserPlus,
  UserMinus,
  Settings,
  Trophy,
  Target,
  Zap,
  Heart,
  Volume2,
  VolumeX,
  MoreHorizontal,
  Crown,
  Coffee,
  BookOpen,
  Smile,
  AlertCircle,
  Copy,
  Share2,
  Eye,
  EyeOff
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import Modal from '@/components/UI/Modal'
import { useUser } from '@/context/UserContext'
import { useTimer } from '@/hooks/useTimer'
import { roomService } from '@/services/roomService'
import { format } from 'date-fns'

const StudyTogetherRoom = ({ compact = false, className = '' }) => {
  const { user } = useUser()
  const { timeRemaining, isActive, mode, startTimer, pauseTimer } = useTimer()
  
  const [currentRoom, setCurrentRoom] = useState(null)
  const [availableRooms, setAvailableRooms] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [onlineUsers, setOnlineUsers] = useState([])
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showRoomSettings, setShowRoomSettings] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showUserList, setShowUserList] = useState(true)
  
  // Room creation form
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    maxUsers: 10,
    isPrivate: false,
    password: '',
    mode: 'pomodoro',
    duration: 25
  })
  
  // Chat functionality
  const chatContainerRef = useRef(null)
  const messageInputRef = useRef(null)
  const connectionRef = useRef(null)
  
  // Audio for notifications
  const audioRef = useRef({
    message: new Audio('/sounds/message.mp3'),
    join: new Audio('/sounds/user-join.mp3'),
    leave: new Audio('/sounds/user-leave.mp3'),
    timerSync: new Audio('/sounds/timer-sync.mp3')
  })

  // Sample data for demo
  const sampleRooms = [
    {
      id: '1',
      name: 'Deep Focus Zone',
      description: 'Serious studying, minimal chat',
      participants: ['Alice', 'Bob', 'Charlie'],
      maxUsers: 8,
      isPrivate: false,
      currentTimer: { mode: 'deep-work', remaining: 3600, isActive: true },
      host: 'Alice',
      tags: ['quiet', 'deep-work', 'no-chat']
    },
    {
      id: '2', 
      name: 'Pomodoro Power Hour',
      description: 'Classic 25-minute sessions with friendly chat',
      participants: ['David', 'Emma', 'Frank', 'Grace'],
      maxUsers: 12,
      isPrivate: false,
      currentTimer: { mode: 'pomodoro', remaining: 900, isActive: true },
      host: 'David',
      tags: ['pomodoro', 'social', 'supportive']
    },
    {
      id: '3',
      name: 'Study Buddies',
      description: 'Help each other stay motivated!',
      participants: ['Henry', 'Iris'],
      maxUsers: 6,
      isPrivate: false,
      currentTimer: null,
      host: 'Henry',
      tags: ['casual', 'supportive', 'questions-ok']
    },
    {
      id: '4',
      name: 'Med School Grind',
      description: 'Medical students only - intensive study',
      participants: ['Jack', 'Kate', 'Liam', 'Maya', 'Nina'],
      maxUsers: 10,
      isPrivate: true,
      currentTimer: { mode: 'deep-work', remaining: 5400, isActive: true },
      host: 'Jack',
      tags: ['medical', 'intensive', 'private']
    }
  ]

  const sampleMessages = [
    {
      id: '1',
      userId: 'alice',
      username: 'Alice',
      content: 'Starting a 90-minute deep work session, who\'s joining?',
      timestamp: new Date(Date.now() - 300000),
      type: 'message'
    },
    {
      id: '2',
      userId: 'bob',
      username: 'Bob',
      content: 'I\'m in! Working on my thesis chapter.',
      timestamp: new Date(Date.now() - 240000),
      type: 'message'
    },
    {
      id: '3',
      userId: 'system',
      username: 'System',
      content: 'Charlie joined the room',
      timestamp: new Date(Date.now() - 180000),
      type: 'system'
    },
    {
      id: '4',
      userId: 'charlie',
      username: 'Charlie',
      content: 'Hey everyone! Let\'s crush this study session 💪',
      timestamp: new Date(Date.now() - 120000),
      type: 'message'
    },
    {
      id: '5',
      userId: 'system',
      username: 'System',
      content: 'Timer synchronized - Deep Work 90 minutes started',
      timestamp: new Date(Date.now() - 60000),
      type: 'timer'
    }
  ]

  // Initialize component
  useEffect(() => {
    loadAvailableRooms()
    
    // Set up audio volumes
    Object.values(audioRef.current).forEach(audio => {
      audio.volume = 0.3
    })
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Simulate real-time updates (in production, this would be Supabase realtime)
  useEffect(() => {
    if (currentRoom) {
      const interval = setInterval(() => {
        // Simulate random messages and user activity
        if (Math.random() < 0.1) { // 10% chance every 5 seconds
          addRandomActivity()
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [currentRoom])

  const loadAvailableRooms = async () => {
    try {
      // In production, this would call roomService.getPublicRooms()
      setAvailableRooms(sampleRooms)
    } catch (error) {
      console.error('Error loading rooms:', error)
    }
  }

  const joinRoom = async (room) => {
    try {
      setCurrentRoom(room)
      setMessages(sampleMessages)
      setOnlineUsers(room.participants.map(name => ({
        id: name.toLowerCase(),
        username: name,
        status: Math.random() > 0.3 ? 'active' : 'idle',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        currentTask: getRandomTask(),
        focusTime: Math.floor(Math.random() * 240) + 30
      })))
      setIsConnected(true)
      setRoomCode(generateRoomCode())
      
      // Add join message
      addSystemMessage(`${user?.name || 'You'} joined the room`)
      
      // Play join sound
      if (soundEnabled) {
        audioRef.current.join.play().catch(console.error)
      }
      
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const leaveRoom = async () => {
    if (currentRoom) {
      addSystemMessage(`${user?.name || 'You'} left the room`)
      
      setCurrentRoom(null)
      setMessages([])
      setOnlineUsers([])
      setIsConnected(false)
      setRoomCode('')
      
      if (soundEnabled) {
        audioRef.current.leave.play().catch(console.error)
      }
    }
  }

  const createRoom = async () => {
    try {
      const newRoom = {
        id: Date.now().toString(),
        ...roomForm,
        participants: [user?.name || 'You'],
        host: user?.name || 'You',
        currentTimer: null,
        createdAt: new Date()
      }
      
      setAvailableRooms(prev => [newRoom, ...prev])
      setShowCreateRoom(false)
      await joinRoom(newRoom)
      
      // Reset form
      setRoomForm({
        name: '',
        description: '',
        maxUsers: 10,
        isPrivate: false,
        password: '',
        mode: 'pomodoro',
        duration: 25
      })
      
    } catch (error) {
      console.error('Error creating room:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom) return

    const message = {
      id: Date.now().toString(),
      userId: user?.id || 'you',
      username: user?.name || 'You',
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'message'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Play message sound for others (simulate)
    setTimeout(() => {
      if (soundEnabled) {
        audioRef.current.message.play().catch(console.error)
      }
    }, 500)

    // Focus back to input
    messageInputRef.current?.focus()
  }

  const syncTimer = () => {
    if (!currentRoom) return
    
    const timerMessage = {
      id: Date.now().toString(),
      userId: 'system',
      username: 'System',
      content: `${user?.name || 'You'} synchronized timer - ${mode} ${Math.floor(timeRemaining / 60)} minutes`,
      timestamp: new Date(),
      type: 'timer'
    }
    
    setMessages(prev => [...prev, timerMessage])
    
    if (soundEnabled) {
      audioRef.current.timerSync.play().catch(console.error)
    }
  }

  const addSystemMessage = (content) => {
    const message = {
      id: Date.now().toString(),
      userId: 'system',
      username: 'System',
      content,
      timestamp: new Date(),
      type: 'system'
    }
    setMessages(prev => [...prev, message])
  }

  const addRandomActivity = () => {
    const activities = [
      'Emma completed a 25-minute focus session! 🎉',
      'David took a well-deserved break ☕',
      'New member Sarah joined the room 👋',
      'Focus session starting in 2 minutes ⏰',
      'Great energy in the room today! Keep it up 💪'
    ]
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)]
    addSystemMessage(randomActivity)
  }

  const getRandomTask = () => {
    const tasks = [
      'Reading Chapter 5',
      'Math Problem Set',
      'Essay Draft',
      'Research Project',
      'Code Review',
      'Study Notes',
      'Practice Problems'
    ]
    return tasks[Math.floor(Math.random() * tasks.length)]
  }

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    // Show copied notification (simplified)
    console.log('Room code copied!')
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'text-green-500',
      idle: 'text-yellow-500',
      away: 'text-gray-400'
    }
    return colors[status] || 'text-gray-400'
  }

  const getStatusDot = (status) => {
    const colors = {
      active: 'bg-green-500',
      idle: 'bg-yellow-500', 
      away: 'bg-gray-400'
    }
    return colors[status] || 'bg-gray-400'
  }

  // Compact view for fullscreen focus mode
  if (compact) {
    return (
      <Card className={`${className}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-text flex items-center">
              <Users className="mr-2 h-4 w-4" />
              {currentRoom ? currentRoom.name : 'Study Rooms'}
            </h4>
            
            {currentRoom && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-text-secondary">
                  {onlineUsers.length} online
                </span>
                <Button onClick={leaveRoom} size="sm" variant="ghost">
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {currentRoom ? (
            <div className="space-y-3">
              {/* Quick Timer Sync */}
              {isActive && (
                <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
                  <span className="text-sm text-primary">
                    {formatTime(timeRemaining)} remaining
                  </span>
                  <Button onClick={syncTimer} size="sm" variant="ghost">
                    Sync
                  </Button>
                </div>
              )}

              {/* Online Users */}
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 5).map(user => (
                  <div
                    key={user.id}
                    className="relative w-8 h-8 rounded-full border-2 border-surface overflow-hidden"
                    title={user.username}
                  >
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${getStatusDot(user.status)}`} />
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-xs">
                    +{onlineUsers.length - 5}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="h-8 w-8 text-text-secondary mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-secondary mb-3">Join a study room</p>
              <Button size="sm" onClick={() => setShowCreateRoom(true)}>
                Browse Rooms
              </Button>
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Full view
  if (!currentRoom) {
    return (
      <>
        <Card className={className}>
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Study Together
                </h3>
                <p className="text-sm text-text-secondary">Join others and stay motivated</p>
              </div>
              
              <Button onClick={() => setShowCreateRoom(true)} size="sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Create Room
              </Button>
            </div>

            {/* Available Rooms */}
            <div className="space-y-3">
              <h4 className="font-medium text-text">Active Rooms</h4>
              
              {availableRooms.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-text-secondary mx-auto mb-2 opacity-50" />
                  <p className="text-text-secondary mb-4">No active rooms right now</p>
                  <Button onClick={() => setShowCreateRoom(true)} size="sm">
                    Create First Room
                  </Button>
                </div>
              ) : (
                availableRooms.map(room => (
                  <motion.div
                    key={room.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="p-4 border border-card-border rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => joinRoom(room)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium text-text">{room.name}</h5>
                          {room.isPrivate && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                              Private
                            </span>
                          )}
                          {room.currentTimer?.isActive && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-text-secondary mb-2">{room.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {room.participants.length}/{room.maxUsers}
                          </span>
                          
                          {room.currentTimer && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(room.currentTimer.remaining)} left
                            </span>
                          )}
                          
                          <span className="flex items-center">
                            <Crown className="h-3 w-3 mr-1" />
                            {room.host}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex -space-x-2 ml-4">
                        {room.participants.slice(0, 3).map(name => (
                          <div
                            key={name}
                            className="w-8 h-8 rounded-full border-2 border-surface overflow-hidden"
                          >
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {room.participants.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-xs">
                            +{room.participants.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-lg font-bold text-primary">{availableRooms.length}</p>
                <p className="text-xs text-text-secondary">Active Rooms</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-lg font-bold text-secondary">
                  {availableRooms.reduce((acc, room) => acc + room.participants.length, 0)}
                </p>
                <p className="text-xs text-text-secondary">Users Online</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-lg font-bold text-accent">
                  {availableRooms.filter(room => room.currentTimer?.isActive).length}
                </p>
                <p className="text-xs text-text-secondary">Active Timers</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Create Room Modal */}
        <Modal
          isOpen={showCreateRoom}
          onClose={() => setShowCreateRoom(false)}
          title="Create Study Room"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Room Name
              </label>
              <input
                type="text"
                value={roomForm.name}
                onChange={(e) => setRoomForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Study Room"
                className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Description
              </label>
              <textarea
                value={roomForm.description}
                onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What's this room for?"
                className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Max Users
                </label>
                <select
                  value={roomForm.maxUsers}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, maxUsers: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value={5}>5 users</option>
                  <option value={10}>10 users</option>
                  <option value={15}>15 users</option>
                  <option value={20}>20 users</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Timer Mode
                </label>
                <select
                  value={roomForm.mode}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, mode: e.target.value }))}
                  className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="pomodoro">Pomodoro</option>
                  <option value="deep-work">Deep Work</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={roomForm.isPrivate}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="accent-primary mr-2"
                />
                <span className="text-sm text-text">Private room (invite only)</span>
              </label>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button
                onClick={() => setShowCreateRoom(false)}
                variant="ghost"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createRoom}
                className="flex-1"
                disabled={!roomForm.name.trim()}
              >
                Create Room
              </Button>
            </div>
          </div>
        </Modal>
      </>
    )
  }

  // Room interface when joined
  return (
    <Card className={className}>
      <div className="p-6">
        {/* Room Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {currentRoom.name}
            </h3>
            <p className="text-sm text-text-secondary flex items-center">
              <span>Room Code: {roomCode}</span>
              <Button onClick={copyRoomCode} size="sm" variant="ghost" className="ml-2 p-1">
                <Copy className="h-3 w-3" />
              </Button>
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              size="sm"
              variant="ghost"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={() => setShowRoomSettings(true)}
              size="sm"
              variant="ghost"
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button onClick={leaveRoom} size="sm" variant="ghost">
              <UserMinus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Timer Sync */}
        {currentRoom.currentTimer && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-primary">Room Timer Active</p>
                <p className="text-sm text-primary/80">
                  {currentRoom.currentTimer.mode} • {formatTime(currentRoom.currentTimer.remaining)} remaining
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={syncTimer} size="sm">
                  Sync My Timer
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-text flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </h4>
              <span className="text-xs text-text-secondary">
                {messages.length} messages
              </span>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="h-64 overflow-y-auto border border-card-border rounded-lg p-3 mb-3 space-y-2"
            >
              <AnimatePresence>
                {messages.map(message => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`${
                      message.type === 'system' ? 'text-center text-xs text-text-secondary' :
                      message.type === 'timer' ? 'text-center text-xs text-primary' :
                      'text-sm'
                    }`}
                  >
                    {message.type === 'message' ? (
                      <div className={`${
                        message.userId === user?.id ? 'text-right' : 'text-left'
                      }`}>
                        <div className={`inline-block max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${
                          message.userId === user?.id
                            ? 'bg-primary text-white'
                            : 'bg-background border border-card-border'
                        }`}>
                          {message.userId !== user?.id && (
                            <p className="font-medium text-xs text-text-secondary mb-1">
                              {message.username}
                            </p>
                          )}
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.userId === user?.id ? 'text-white/80' : 'text-text-secondary'
                          }`}>
                            {format(message.timestamp, 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        {message.type === 'timer' && <Clock className="h-3 w-3" />}
                        <span>{message.content}</span>
                        <span>{format(message.timestamp, 'HH:mm')}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Message Input */}
            <div className="flex items-center space-x-2">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <Button onClick={sendMessage} size="sm" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Users Panel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-text">
                Online ({onlineUsers.length})
              </h4>
              <Button
                onClick={() => setShowUserList(!showUserList)}
                size="sm"
                variant="ghost"
              >
                {showUserList ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {showUserList && (
              <div className="space-y-2">
                {onlineUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-surface ${getStatusDot(user.status)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <p className="font-medium text-sm text-text truncate">
                          {user.username}
                        </p>
                        {user.username === currentRoom.host && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                      <p className="text-xs text-text-secondary truncate">
                        {user.currentTask}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {user.focusTime}m today
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Room Settings Modal */}
      <Modal
        isOpen={showRoomSettings}
        onClose={() => setShowRoomSettings(false)}
        title="Room Settings"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-text mb-2">Room Information</h4>
            <div className="text-sm text-text-secondary space-y-1">
              <p>Name: {currentRoom.name}</p>
              <p>Host: {currentRoom.host}</p>
              <p>Code: {roomCode}</p>
              <p>Users: {onlineUsers.length}/{currentRoom.maxUsers}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-text mb-2">Notifications</h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="text-sm">Sound notifications</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="accent-primary"
                />
              </label>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={() => {
                copyRoomCode()
                setShowRoomSettings(false)
              }}
              className="w-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Room Code
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export default StudyTogetherRoom
