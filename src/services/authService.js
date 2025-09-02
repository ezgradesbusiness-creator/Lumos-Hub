// src/services/authService.js
import { supabase, TABLES, handleSupabaseError, createResponse } from './supabaseClient'

class AuthService {
  constructor() {
    this.currentUser = null
    this.session = null
    this.listeners = new Set()
  }

  // Initialize auth service
  async initialize() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      this.session = session
      this.currentUser = session?.user || null

      // Set up auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        this.session = session
        this.currentUser = session?.user || null
        this._notifyListeners(event, session)
      })

      return createResponse({ user: this.currentUser, session })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Add auth state listener
  addAuthListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Notify all listeners of auth state changes
  _notifyListeners(event, session) {
    this.listeners.forEach(callback => {
      try {
        callback(event, session)
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
  }

  // Sign up with email and password
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.name || '',
            avatar_url: metadata.avatar || '',
            ...metadata
          }
        }
      })

      if (error) throw error

      // Create user profile
      if (data.user && !data.session) {
        // User needs to confirm email
        return createResponse({
          user: data.user,
          needsConfirmation: true,
          message: 'Please check your email to confirm your account'
        })
      }

      // Auto-create profile if user is confirmed
      if (data.user && data.session) {
        await this._createUserProfile(data.user, metadata)
      }

      return createResponse({
        user: data.user,
        session: data.session,
        needsConfirmation: false
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return createResponse({
        user: data.user,
        session: data.session
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Sign in with Google OAuth
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) throw error
      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Sign in with GitHub OAuth
  async signInWithGitHub() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error
      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      this.currentUser = null
      this.session = null

      return createResponse({ success: true })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return createResponse({ 
        success: true, 
        message: 'Password reset email sent' 
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return createResponse({ 
        user: data.user, 
        message: 'Password updated successfully' 
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Update user metadata
  async updateUserMetadata(metadata) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      })

      if (error) throw error
      return createResponse({ user: data.user })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Get current session
  getCurrentSession() {
    return this.session
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser
  }

  // Get user profile
  async getUserProfile(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id
      if (!targetUserId) {
        throw new Error('No user ID provided')
      }

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser?.id) {
        throw new Error('No authenticated user')
      }

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id)
        .select()
        .single()

      if (error) throw error
      return createResponse(data)
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Create user profile (internal method)
  async _createUserProfile(user, metadata = {}) {
    try {
      const profile = {
        id: user.id,
        email: user.email,
        name: metadata.name || user.user_metadata?.full_name || 'Anonymous User',
        avatar_url: metadata.avatar || user.user_metadata?.avatar_url || null,
        bio: metadata.bio || null,
        timezone: metadata.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(TABLES.PROFILES)
        .insert(profile)
        .select()
        .single()

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error
      }

      // Initialize user stats
      await this._initializeUserStats(user.id)

      return data
    } catch (error) {
      console.error('Error creating user profile:', error)
      throw error
    }
  }

  // Initialize user statistics (internal method)
  async _initializeUserStats(userId) {
    try {
      const initialStats = {
        user_id: userId,
        total_sessions: 0,
        total_focus_time: 0,
        current_streak: 0,
        longest_streak: 0,
        level: 1,
        xp: 0,
        completed_tasks: 0,
        average_session_length: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from(TABLES.USER_STATS)
        .insert(initialStats)

      if (error && error.code !== '23505') {
        throw error
      }
    } catch (error) {
      console.error('Error initializing user stats:', error)
    }
  }

  // Delete user account
  async deleteAccount() {
    try {
      if (!this.currentUser?.id) {
        throw new Error('No authenticated user')
      }

      // Delete user data (handled by database cascading deletes)
      const { error: profileError } = await supabase
        .from(TABLES.PROFILES)
        .delete()
        .eq('id', this.currentUser.id)

      if (profileError) throw profileError

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(
        this.currentUser.id
      )

      if (authError) throw authError

      return createResponse({ 
        success: true, 
        message: 'Account deleted successfully' 
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }

  // Refresh session
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) throw error

      this.session = data.session
      this.currentUser = data.session?.user || null

      return createResponse({
        user: this.currentUser,
        session: this.session
      })
    } catch (error) {
      return createResponse(null, error)
    }
  }
}

// Export singleton instance
export default new AuthService()
