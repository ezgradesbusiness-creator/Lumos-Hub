// src/services/notesService.js
import { supabase, TABLES, handleSupabaseError, createResponse, getCurrentUser } from './supabaseClient'

class NotesService {
  constructor() {
    this.cache = new Map()
    this.subscriptions = new Map()
  }

  // Create a new note
  async create(noteData) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const note = {
        id: noteData.id || crypto.randomUUID(),
        user_id: user.id,
        title: noteData.title || 'Untitled Note',
        content: noteData.content || '',
        tags: noteData.tags || [],
        category: noteData.category || 'general',
        is_favorite: noteData.isFavorite || false,
        is_pinned: noteData.isPinned || false,
        color: noteData.color || null,
        session_id: noteData.sessionId || null,
        word_count: this._calculateWordCount(noteData.content || ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.NOTES)
        .insert(note)
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

  // Get note by ID
  async getById(noteId) {
    try {
      // Check cache first
      if (this.cache.has(noteId)) {
        return createResponse(this.cache.get(noteId))
      }

      const { data, error } = await supabase
        .from(TABLES.NOTES)
        .select('*')
        .eq('id', noteId)
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(noteId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get all notes for current user
  async getAll(options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from(TABLES.NOTES)
        .select('*')
        .eq('user_id', user.id)

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.isFavorite !== undefined) {
        query = query.eq('is_favorite', options.isFavorite)
      }

      if (options.isPinned !== undefined) {
        query = query.eq('is_pinned', options.isPinned)
      }

      if (options.tags && options.tags.length > 0) {
        query = query.contains('tags', options.tags)
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`)
      }

      // Apply sorting
      const sortBy = options.sortBy || 'updated_at'
      const sortOrder = options.sortOrder || 'desc'
      
      // Pinned notes first
      if (sortBy !== 'is_pinned') {
        query = query.order('is_pinned', { ascending: false })
      }
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
      data.forEach(note => {
        this.cache.set(note.id, note)
      })

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get notes by category
  async getByCategory(category) {
    return this.getAll({ category })
  }

  // Get favorite notes
  async getFavorites() {
    return this.getAll({ isFavorite: true })
  }

  // Get pinned notes
  async getPinned() {
    return this.getAll({ isPinned: true })
  }

  // Update note
  async update(noteId, updates) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Calculate word count if content is being updated
      if (updates.content !== undefined) {
        updates.word_count = this._calculateWordCount(updates.content)
      }

      const { data, error } = await supabase
        .from(TABLES.NOTES)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Update cache
      this.cache.set(noteId, data)

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Toggle favorite status
  async toggleFavorite(noteId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Get current note
      const { data: currentNote, error: getError } = await supabase
        .from(TABLES.NOTES)
        .select('is_favorite')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single()

      if (getError) throw getError

      return this.update(noteId, { is_favorite: !currentNote.is_favorite })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Toggle pin status
  async togglePin(noteId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Get current note
      const { data: currentNote, error: getError } = await supabase
        .from(TABLES.NOTES)
        .select('is_pinned')
        .eq('id', noteId)
        .eq('user_id', user.id)
        .single()

      if (getError) throw getError

      return this.update(noteId, { is_pinned: !currentNote.is_pinned })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Delete note
  async delete(noteId) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from(TABLES.NOTES)
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from cache
      this.cache.delete(noteId)

      return createResponse({ success: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Bulk delete notes
  async bulkDelete(noteIds) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from(TABLES.NOTES)
        .delete()
        .in('id', noteIds)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from cache
      noteIds.forEach(id => this.cache.delete(id))

      return createResponse({ success: true, deletedCount: noteIds.length })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Search notes
  async search(query, options = {}) {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let dbQuery = supabase
        .from(TABLES.NOTES)
        .select('*')
        .eq('user_id', user.id)

      if (query.trim()) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      }

      // Apply additional filters
      if (options.category) {
        dbQuery = dbQuery.eq('category', options.category)
      }

      if (options.tags && options.tags.length > 0) {
        dbQuery = dbQuery.contains('tags', options.tags)
      }

      const { data, error } = await dbQuery
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(options.limit || 50)

      if (error) throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get notes statistics
  async getStats() {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data: notes, error } = await supabase
        .from(TABLES.NOTES)
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      const stats = {
        totalNotes: notes.length,
        favoriteNotes: notes.filter(note => note.is_favorite).length,
        pinnedNotes: notes.filter(note => note.is_pinned).length,
        totalWords: notes.reduce((acc, note) => acc + (note.word_count || 0), 0),
        averageWordsPerNote: notes.length > 0 
          ? notes.reduce((acc, note) => acc + (note.word_count || 0), 0) / notes.length 
          : 0,
        categoryBreakdown: {},
        tagUsage: {}
      }

      // Category breakdown
      notes.forEach(note => {
        stats.categoryBreakdown[note.category] = (stats.categoryBreakdown[note.category] || 0) + 1
      })

      // Tag usage
      notes.forEach(note => {
        if (note.tags) {
          note.tags.forEach(tag => {
            stats.tagUsage[tag] = (stats.tagUsage[tag] || 0) + 1
          })
        }
      })

      return createResponse(stats)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get all unique tags
  async getAllTags() {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data: notes, error } = await supabase
        .from(TABLES.NOTES)
        .select('tags')
        .eq('user_id', user.id)

      if (error) throw error

      const allTags = new Set()
      notes.forEach(note => {
        if (note.tags) {
          note.tags.forEach(tag => allTags.add(tag))
        }
      })

      return createResponse(Array.from(allTags).sort())
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get all unique categories
  async getAllCategories() {
    try {
      const user = await getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.NOTES)
        .select('category')
        .eq('user_id', user.id)
        .not('category', 'is', null)

      if (error) throw error

      const categories = [...new Set(data.map(note => note.category))].sort()
      return createResponse(categories)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Subscribe to note changes
  subscribeToChanges(callback, userId = null) {
    const user = getCurrentUser()
    const targetUserId = userId || user?.id

    if (!targetUserId) {
      console.warn('No user ID for notes subscription')
      return null
    }

    const subscription = supabase
      .channel(`notes_${targetUserId}`)
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: TABLES.NOTES,
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

  // Export notes
  async exportNotes(format = 'json') {
    try {
      const response = await this.getAll()
      if (!response.success) throw new Error(response.error.message)

      const notes = response.data

      if (format === 'markdown') {
        return this._convertToMarkdown(notes)
      }

      if (format === 'csv') {
        return this._convertToCSV(notes)
      }

      return createResponse({
        notes,
        exportedAt: new Date().toISOString(),
        format
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Calculate word count
  _calculateWordCount(content) {
    if (!content || typeof content !== 'string') return 0
    return content.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Convert notes to Markdown format
  _convertToMarkdown(notes) {
    if (!notes.length) return '# No notes to export'

    let markdown = '# My Notes\n\n'
    
    notes.forEach(note => {
      markdown += `## ${note.title}\n\n`
      
      if (note.tags && note.tags.length > 0) {
        markdown += `**Tags:** ${note.tags.join(', ')}\n\n`
      }
      
      if (note.category) {
        markdown += `**Category:** ${note.category}\n\n`
      }
      
      markdown += `${note.content}\n\n`
      markdown += `*Created: ${new Date(note.created_at).toLocaleDateString()}*\n\n`
      markdown += '---\n\n'
    })

    return markdown
  }

  // Convert notes to CSV format
  _convertToCSV(notes) {
    if (!notes.length) return 'No notes to export'

    const headers = ['id', 'title', 'category', 'tags', 'word_count', 'is_favorite', 'is_pinned', 'created_at']

    const csvContent = [
      headers.join(','),
      ...notes.map(note => 
        headers.map(header => {
          let value = note[header] || ''
          if (header === 'tags' && Array.isArray(value)) {
            value = value.join(';')
          }
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
export default new NotesService()
