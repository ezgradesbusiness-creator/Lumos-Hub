// src/services/taskService.js
import { supabase, TABLES, handleSupabaseError, createResponse, getCurrentUser } from './supabaseClient'
import { startOfDay, endOfDay } from 'date-fns'

class TaskService {
  constructor() {
    this.cache = new Map()
    this.subscriptions = new Map()
  }

  // Create a new task
  async create(taskData) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const task = {
        id: taskData.id || crypto.randomUUID(),
        user_id: user.id,
        title: taskData.title || 'Untitled Task',
        description: taskData.description || null,
        completed: taskData.completed || false,
        priority: taskData.priority || 'medium',
        category: taskData.category || 'general',
        tags: taskData.tags || [],
        due_date: taskData.dueDate || null,
        estimated_duration: taskData.estimatedDuration || null,
        actual_duration: taskData.actualDuration || null,
        session_id: taskData.sessionId || null,
        subtasks: taskData.subtasks || [],
        notes: taskData.notes || null,
        order_index: taskData.orderIndex || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert(task)
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

  // Get task by ID
  async getById(taskId) {
    try {
      // Check cache first
      if (this.cache.has(taskId)) {
        return createResponse(this.cache.get(taskId))
      }

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('id', taskId)
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(taskId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get all tasks for current user
  async getAll(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('user_id', user.id)

      // Apply filters
      if (options.completed !== undefined) {
        query = query.eq('completed', options.completed)
      }

      if (options.priority) {
        query = query.eq('priority', options.priority)
      }

      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.dueDate) {
        query = query.lte('due_date', options.dueDate)
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'order_index'
      const sortOrder = options.sortOrder || 'asc'
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
      data.forEach(task => {
        this.cache.set(task.id, task)
      })

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get tasks by date range
  async getByDateRange(startDate, endDate) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get today's tasks
  async getTodayTasks(date = new Date()) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const startOfToday = startOfDay(date)
      const endOfToday = endOfDay(date)

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('user_id', user.id)
        .or(`due_date.gte.${startOfToday.toISOString()},due_date.lte.${endOfToday.toISOString()},due_date.is.null`)
        .order('priority', { ascending: false })
        .order('order_index', { ascending: true })

      if (error) throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get overdue tasks
  async getOverdueTasks() {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .lt('due_date', now)
        .order('due_date', { ascending: true })

      if (error) throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Update task
  async update(taskId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(taskId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Toggle task completion
  async toggleComplete(taskId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Get current task
      const { data: currentTask, error: getError } = await supabase
        .from(TABLES.TASKS)
        .select('completed')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

      if (getError) throw getError

      const updates = {
        completed: !currentTask.completed,
        completed_at: !currentTask.completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(taskId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Update task order
  async updateOrder(taskUpdates) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const updates = taskUpdates.map(({ id, orderIndex }) => ({
        id,
        order_index: orderIndex,
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .upsert(updates)
        .select()

      if (error) throw error

      // Update cache
      data.forEach(task => {
        this.cache.set(task.id, task)
      })

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Delete task
  async delete(taskId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from cache
      this.cache.delete(taskId)

      return createResponse({ success: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Bulk delete tasks
  async bulkDelete(taskIds) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .in('id', taskIds)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from cache
      taskIds.forEach(id => this.cache.delete(id))

      return createResponse({ success: true, deletedCount: taskIds.length })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get task statistics
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

      const { data: tasks, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) throw error

      const completedTasks = tasks.filter(task => task.completed)

      const stats = {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: tasks.length - completedTasks.length,
        completionRate: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0,
        priorityBreakdown: {},
        categoryBreakdown: {},
        averageCompletionTime: 0
      }

      // Priority breakdown
      tasks.forEach(task => {
        stats.priorityBreakdown[task.priority] = (stats.priorityBreakdown[task.priority] || 0) + 1
      })

      // Category breakdown
      tasks.forEach(task => {
        stats.categoryBreakdown[task.category] = (stats.categoryBreakdown[task.category] || 0) + 1
      })

      // Average completion time for completed tasks
      const tasksWithDuration = completedTasks.filter(task => task.actual_duration)
      if (tasksWithDuration.length > 0) {
        stats.averageCompletionTime = tasksWithDuration.reduce((acc, task) => acc + task.actual_duration, 0) / tasksWithDuration.length
      }

      return createResponse(stats)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Search tasks
  async search(query, options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let dbQuery = supabase
        .from(TABLES.TASKS)
        .select('*')
        .eq('user_id', user.id)

      if (query.trim()) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,notes.ilike.%${query}%`)
      }

      // Apply additional filters
      if (options.completed !== undefined) {
        dbQuery = dbQuery.eq('completed', options.completed)
      }

      if (options.priority) {
        dbQuery = dbQuery.eq('priority', options.priority)
      }

      if (options.category) {
        dbQuery = dbQuery.eq('category', options.category)
      }

      const { data, error } = await dbQuery
        .order('updated_at', { ascending: false })
        .limit(options.limit || 50)

      if (error) throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Subscribe to task changes
  subscribeToChanges(callback, userId = null) {
    const user = getCurrentUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      console.warn('No user ID for task subscription')
      return null
    }

    const subscription = supabase
      .channel(`tasks_${targetUserId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: TABLES.TASKS,
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

  // Export tasks
  async exportTasks(format = 'json') {
    try {
      const response = await this.getAll()
      if (!response.success) throw new Error(response.error.message)

      const tasks = response.data

      if (format === 'csv') {
        return this._convertToCSV(tasks)
      }

      return createResponse({
        tasks,
        exportedAt: new Date().toISOString(),
        format
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Convert tasks to CSV format
  _convertToCSV(tasks) {
    if (!tasks.length) return 'No tasks to export'

    const headers = [
      'id', 'title', 'description', 'completed', 'priority', 
      'category', 'due_date', 'estimated_duration', 'actual_duration'
    ]

    const csvContent = [
      headers.join(','),
      ...tasks.map(task => 
        headers.map(header => {
          const value = task[header] || ''
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
export default new TaskService()
