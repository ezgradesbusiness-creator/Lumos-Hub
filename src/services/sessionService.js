// src/services/sessionService.js
import { supabase, TABLES, handleSupabaseError, createResponse, getCurrentUser } from './supabaseClient'
import { startOfDay, endOfDay, format } from 'date-fns'

class SessionService {
  constructor() {
    this.cache = new Map()
    this.subscriptions = new Map()
  }

  // Create a new session
  async create(sessionData) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const session = {
        id: sessionData.id || crypto.randomUUID(),
        user_id: user.id,
        mode: sessionData.mode || 'pomodoro',
        duration: sessionData.duration || 25,
        target_duration: sessionData.targetDuration || sessionData.duration,
        start_time: sessionData.startTime || new Date().toISOString(),
        end_time: sessionData.endTime || null,
        task_description: sessionData.task || sessionData.taskDescription || null,
        completed: sessionData.completed || false,
        actual_duration: sessionData.actualDuration || null,
        break_duration: sessionData.breakDuration || null,
        notes: sessionData.notes || null,
        tags: sessionData.tags || [],
        mood: sessionData.mood || null,
        difficulty: sessionData.difficulty || null,
        productivity_score: sessionData.productivityScore || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .insert(session)
        .select()
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(data.id, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get session by ID
  async getById(sessionId) {
    try {
      // Check cache first
      if (this.cache.has(sessionId)) {
        return createResponse(this.cache.get(sessionId))
      }

      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(sessionId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get all sessions for current user
  async getAll(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('user_id', user.id)

      // Apply filters
      if (options.completed !== undefined) {
        query = query.eq('completed', options.completed)
      }

      if (options.mode) {
        query = query.eq('mode', options.mode)
      }

      if (options.startDate) {
        query = query.gte('start_time', options.startDate)
      }

      if (options.endDate) {
        query = query.lte('start_time', options.endDate)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'start_time'
      const sortOrder = options.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      // Update cache
      data.forEach(session => {
        this.cache.set(session.id, session)
      })

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get sessions by date range
  async getByDateRange(startDate, endDate) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: false })

      if (error) throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get today's sessions
  async getTodaySessions(date = new Date()) {
    const startOfToday = startOfDay(date)
    const endOfToday = endOfDay(date)
    
    return this.getByDateRange(startOfToday, endOfToday)
  }

  // Update session
  async update(sessionId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.SESSIONS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(sessionId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Complete session
  async complete(sessionId, completionData = {}) {
    try {
      const updates = {
        completed: true,
        end_time: completionData.endTime || new Date().toISOString(),
        actual_duration: completionData.actualDuration || null,
        notes: completionData.notes || null,
        mood: completionData.mood || null,
        difficulty: completionData.difficulty || null,
        productivity_score: completionData.productivityScore || null
      }

      return this.update(sessionId, updates)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Delete session
  async delete(sessionId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from(TABLES.SESSIONS)
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from cache
      this.cache.delete(sessionId)

      return createResponse({ success: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get session statistics
  async getStats(period = 'week') {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let startDate
      const endDate = new Date()

      switch (period) {
        case 'day':
          startDate = startOfDay(endDate)
          break
        case 'week':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
          break
        case 'year':
          startDate = new Date(endDate.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0) // All time
      }

      const { data: sessions, error } = await supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())

      if (error) throw error

      // Calculate statistics
      const stats = {
        totalSessions: sessions.length,
        totalFocusTime: sessions.reduce((acc, session) => acc + (session.actual_duration || session.duration), 0),
        averageSessionLength: sessions.length > 0 
          ? sessions.reduce((acc, session) => acc + (session.actual_duration || session.duration), 0) / sessions.length 
          : 0,
        modeBreakdown: {},
        productivityTrend: [],
        completionRate: 0
      }

      // Mode breakdown
      sessions.forEach(session => {
        stats.modeBreakdown[session.mode] = (stats.modeBreakdown[session.mode] || 0) + 1
      })

      // Get total attempted sessions for completion rate
      const { data: allSessions, error: allError } = await supabase
        .from(TABLES.SESSIONS)
        .select('completed')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())

      if (!allError && allSessions.length > 0) {
        stats.completionRate = (sessions.length / allSessions.length) * 100
      }

      return createResponse(stats)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get session trends
  async getTrends(days = 30) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)

      const { data: sessions, error } = await supabase
        .from(TABLES.SESSIONS)
        .select('start_time, duration, actual_duration, completed, mode')
        .eq('user_id', user.id)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error

      // Group by day
      const trends = {}
      sessions.forEach(session => {
        const day = format(new Date(session.start_time), 'yyyy-MM-dd')
        if (!trends[day]) {
          trends[day] = {
            date: day,
            sessions: 0,
            completedSessions: 0,
            totalTime: 0,
            modes: {}
          }
        }

        trends[day].sessions++
        if (session.completed) {
          trends[day].completedSessions++
          trends[day].totalTime += session.actual_duration || session.duration
        }

        trends[day].modes[session.mode] = (trends[day].modes[session.mode] || 0) + 1
      })

      return createResponse(Object.values(trends))
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Subscribe to session changes
  subscribeToChanges(callback, userId = null) {
    const user = getCurrentUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      console.warn('No user ID for session subscription')
      return null
    }

    const subscription = supabase
      .channel(`sessions_${targetUserId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: TABLES.SESSIONS,
          filter: `user_id=eq.${targetUserId}`
        },
        (payload) => {
          // Update cache
          if (payload.new) {
            this.cache.set(payload.new.id, payload.new)
          } else if (payload.old) {
            this.cache.delete(payload.old.id)
          }

          callback(payload)
        }
      )
      .subscribe()

    this.subscriptions.set(targetUserId, subscription)

    return () => {
      subscription.unsubscribe()
      this.subscriptions.delete(targetUserId)
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }

  // Export sessions
  async exportSessions(format = 'json', dateRange = null) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from(TABLES.SESSIONS)
        .select('*')
        .eq('user_id', user.id)

      if (dateRange) {
        query = query
          .gte('start_time', dateRange.start)
          .lte('start_time', dateRange.end)
      }

      const { data, error } = await query

      if (error) throw error

      if (format === 'csv') {
        return this._convertToCSV(data)
      }

      return createResponse({
        sessions: data,
        exportedAt: new Date().toISOString(),
        format
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Convert sessions to CSV format
  _convertToCSV(sessions) {
    if (!sessions.length) return 'No sessions to export'

    const headers = [
      'id', 'mode', 'duration', 'start_time', 'end_time', 
      'completed', 'task_description', 'notes', 'mood', 'difficulty'
    ]

    const csvContent = [
      headers.join(','),
      ...sessions.map(session => 
        headers.map(header => {
          const value = session[header] || ''
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }
}

// Export singleton instance
export default new SessionService()
