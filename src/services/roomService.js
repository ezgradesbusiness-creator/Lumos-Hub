// src/services/roomService.js
import { supabase, TABLES, handleSupabaseError, createResponse, getCurrentUser, createRealtimeSubscription } from './supabaseClient'

class RoomService {
  constructor() {
    this.cache = new Map()
    this.subscriptions = new Map()
    this.currentRoom = null
    this.userPresence = new Map()
  }

  // Create a new study room
  async createRoom(roomData) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const room = {
        id: roomData.id || crypto.randomUUID(),
        name: roomData.name || 'Study Room',
        description: roomData.description || null,
        host_id: user.id,
        host_name: user.user_metadata?.full_name || 'Anonymous',
        max_participants: roomData.maxParticipants || 10,
        is_private: roomData.isPrivate || false,
        password: roomData.password || null,
        timer_mode: roomData.timerMode || 'pomodoro',
        timer_duration: roomData.timerDuration || 25,
        timer_is_active: false,
        timer_start_time: null,
        timer_remaining: null,
        tags: roomData.tags || [],
        settings: roomData.settings || {
          allowChat: true,
          allowTimerControl: 'host', // 'host', 'all', 'none'
          autoStartBreaks: true,
          soundEnabled: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.STUDY_ROOMS)
        .insert(room)
        .select()
        .single()

      if (error) throw error

      // Add host as participant
      await this._addParticipant(data.id, user.id, 'host')

      // Update cache
      this.cache.set(data.id, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get room by ID
  async getRoomById(roomId) {
    try {
      // Check cache first
      if (this.cache.has(roomId)) {
        return createResponse(this.cache.get(roomId))
      }

      const { data: room, error } = await supabase
        .from(TABLES.STUDY_ROOMS)
        .select(`
          *,
          participants:room_participants(
            user_id,
            username,
            avatar_url,
            role,
            status,
            joined_at
          )
        `)
        .eq('id', roomId)
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(roomId, room)

      return createResponse(room)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get all public rooms
  async getPublicRooms(options = {}) {
    try {
      let query = supabase
        .from(TABLES.STUDY_ROOMS)
        .select(`
          *,
          participant_count:room_participants(count)
        `)
        .eq('is_private', false)

      // Apply filters
      if (options.timerMode) {
        query = query.eq('timer_mode', options.timerMode)
      }

      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags)
      }

      if (options.hasSpace) {
        // This would need a more complex query in real implementation
        // For now, we'll filter client-side
      }

      // Apply sorting
      const sortBy = options.sortBy || 'created_at'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter rooms with space if requested
      let filteredData = data
      if (options.hasSpace) {
        filteredData = data.filter(room => 
          (room.participant_count?.[0]?.count || 0) < room.max_participants
        )
      }

      return createResponse(filteredData)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Join a room
  async joinRoom(roomId, password = null) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Get room details
      const roomResponse = await this.getRoomById(roomId)
      if (!roomResponse.success) throw new Error(roomResponse.error.message)

      const room = roomResponse.data

      // Check if room is private and password is required
      if (room.is_private && room.password && room.password !== password) {
        throw new Error('Invalid room password')
      }

      // Check if room is full
      if (room.participants && room.participants.length >= room.max_participants) {
        throw new Error('Room is full')
      }

      // Check if user is already in room
      const existingParticipant = room.participants?.find(p => p.user_id === user.id)
      if (existingParticipant) {
        this.currentRoom = room
        return createResponse({ room, alreadyJoined: true })
      }

      // Add user as participant
      await this._addParticipant(roomId, user.id, 'participant')

      // Update current room
      this.currentRoom = room

      // Send join message
      await this.sendMessage(roomId, {
        type: 'system',
        content: `${user.user_metadata?.full_name || 'Anonymous'} joined the room`
      })

      return createResponse({ room, joined: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Leave a room
  async leaveRoom(roomId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Remove user from participants
      const { error } = await supabase
        .from(TABLES.ROOM_PARTICIPANTS)
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id)

      if (error) throw error

      // Send leave message
      await this.sendMessage(roomId, {
        type: 'system',
        content: `${user.user_metadata?.full_name || 'Anonymous'} left the room`
      })

      // Clear current room if it matches
      if (this.currentRoom?.id === roomId) {
        this.currentRoom = null
      }

      // Remove from cache
      this.cache.delete(roomId)

      return createResponse({ success: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Update room settings
  async updateRoom(roomId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.STUDY_ROOMS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .eq('host_id', user.id) // Only host can update
        .select()
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(roomId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Start room timer
  async startTimer(roomId, mode = null, duration = null) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const room = await this.getRoomById(roomId)
      if (!room.success) throw new Error('Room not found')

      // Check permissions
      const participant = room.data.participants?.find(p => p.user_id === user.id)
      if (!participant) throw new Error('Not a room participant')

      const canControlTimer = room.data.settings?.allowTimerControl === 'all' || 
                             participant.role === 'host'
      
      if (!canControlTimer) {
        throw new Error('No permission to control timer')
      }

      const timerMode = mode || room.data.timer_mode
      const timerDuration = duration || room.data.timer_duration

      const updates = {
        timer_mode: timerMode,
        timer_duration: timerDuration,
        timer_is_active: true,
        timer_start_time: new Date().toISOString(),
        timer_remaining: timerDuration * 60 // Convert to seconds
      }

      const response = await this.updateRoom(roomId, updates)
      if (!response.success) throw new Error(response.error.message)

      // Send system message
      await this.sendMessage(roomId, {
        type: 'system',
        content: `${user.user_metadata?.full_name || 'Anonymous'} started a ${timerMode} timer (${timerDuration} minutes)`
      })

      return response
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Pause/Resume room timer
  async pauseTimer(roomId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const room = await this.getRoomById(roomId)
      if (!room.success) throw new Error('Room not found')

      // Check permissions
      const participant = room.data.participants?.find(p => p.user_id === user.id)
      if (!participant || participant.role !== 'host') {
        throw new Error('Only host can pause timer')
      }

      const updates = {
        timer_is_active: !room.data.timer_is_active
      }

      return this.updateRoom(roomId, updates)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Stop room timer
  async stopTimer(roomId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const updates = {
        timer_is_active: false,
        timer_start_time: null,
        timer_remaining: null
      }

      const response = await this.updateRoom(roomId, updates)
      if (!response.success) throw new Error(response.error.message)

      // Send system message
      await this.sendMessage(roomId, {
        type: 'system',
        content: `${user.user_metadata?.full_name || 'Anonymous'} stopped the timer`
      })

      return response
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Send message to room
  async sendMessage(roomId, messageData) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const message = {
        id: crypto.randomUUID(),
        room_id: roomId,
        user_id: messageData.type === 'system' ? null : user.id,
        username: messageData.type === 'system' ? 'System' : (user.user_metadata?.full_name || 'Anonymous'),
        content: messageData.content,
        type: messageData.type || 'message', // message, system, timer
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.ROOM_MESSAGES)
        .insert(message)
        .select()
        .single()

      if (error) throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get room messages
  async getMessages(roomId, options = {}) {
    try {
      let query = supabase
        .from(TABLES.ROOM_MESSAGES)
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.before) {
        query = query.lt('created_at', options.before)
      }

      const { data, error } = await query

      if (error) throw error

      return createResponse(data.reverse()) // Return in chronological order
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Update user presence in room
  async updatePresence(roomId, status = 'active') {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from(TABLES.ROOM_PARTICIPANTS)
        .update({
          status,
          last_seen: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .eq('user_id', user.id)

      if (error) throw error

      return createResponse({ success: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Subscribe to room changes
  subscribeToRoom(roomId, callback) {
    const subscriptions = []

    // Subscribe to room updates
    const roomSub = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: TABLES.STUDY_ROOMS,
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          this.cache.set(roomId, payload.new)
          callback({ type: 'room_update', data: payload.new })
        }
      )
      .subscribe()

    subscriptions.push(roomSub)

    // Subscribe to messages
    const messagesSub = supabase
      .channel(`messages_${roomId}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLES.ROOM_MESSAGES,
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          callback({ type: 'new_message', data: payload.new })
        }
      )
      .subscribe()

    subscriptions.push(messagesSub)

    // Subscribe to participant changes
    const participantsSub = supabase
      .channel(`participants_${roomId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: TABLES.ROOM_PARTICIPANTS,
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          callback({ type: 'participant_change', data: payload })
        }
      )
      .subscribe()

    subscriptions.push(participantsSub)

    this.subscriptions.set(roomId, subscriptions)

    // Return unsubscribe function
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe())
      this.subscriptions.delete(roomId)
    }
  }

  // Delete room (host only)
  async deleteRoom(roomId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from(TABLES.STUDY_ROOMS)
        .delete()
        .eq('id', roomId)
        .eq('host_id', user.id)

      if (error) throw error

      // Clear cache
      this.cache.delete(roomId)

      return createResponse({ success: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Private helper: Add participant to room
  async _addParticipant(roomId, userId, role = 'participant') {
    const user = await getCurrentUser()
    
    const participant = {
      room_id: roomId,
      user_id: userId,
      username: user?.user_metadata?.full_name || 'Anonymous',
      avatar_url: user?.user_metadata?.avatar_url || null,
      role,
      status: 'active',
      joined_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    }

    const { error } = await supabase
      .from(TABLES.ROOM_PARTICIPANTS)
      .insert(participant)

    if (error) throw error
    return participant
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }

  // Get current room
  getCurrentRoom() {
    return this.currentRoom
  }
}

// Export singleton instance
export default new RoomService()
