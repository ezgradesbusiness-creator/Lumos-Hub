// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'lumos-hub@1.0.0'
    }
  }
})

// Database table names
export const TABLES = {
  PROFILES: 'profiles',
  SESSIONS: 'sessions',
  TASKS: 'tasks',
  NOTES: 'notes',
  USER_STATS: 'user_stats',
  USER_SETTINGS: 'user_settings',
  STUDY_ROOMS: 'study_rooms',
  ROOM_PARTICIPANTS: 'room_participants',
  ROOM_MESSAGES: 'room_messages',
  ACHIEVEMENTS: 'achievements',
  USER_ACHIEVEMENTS: 'user_achievements'
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error, operation = 'operation') => {
  console.error(`Supabase ${operation} error:`, error)
  
  // Map common Supabase errors to user-friendly messages
  const errorMessages = {
    '23505': 'This item already exists',
    '23503': 'Referenced item does not exist',
    '42501': 'Permission denied',
    'PGRST116': 'No data found',
    'PGRST301': 'Invalid request format'
  }

  const userMessage = errorMessages[error.code] || error.message || `Failed to complete ${operation}`
  
  return {
    error: true,
    message: userMessage,
    code: error.code,
    details: error.details
  }
}

// Helper function for consistent API responses
export const createResponse = (data = null, error = null) => {
  if (error) {
    return {
      data: null,
      error: handleSupabaseError(error),
      success: false
    }
  }
  
  return {
    data,
    error: null,
    success: true
  }
}

// Helper function to get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}

// Real-time subscription helper
export const createRealtimeSubscription = (table, callback, filter = null) => {
  let subscription = supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter })
      },
      callback
    )
    .subscribe()

  return {
    subscription,
    unsubscribe: () => subscription.unsubscribe()
  }
}

// Batch operations helper
export const executeBatch = async (operations) => {
  const results = []
  
  for (const operation of operations) {
    try {
      const result = await operation()
      results.push({ success: true, data: result })
    } catch (error) {
      results.push({ success: false, error: handleSupabaseError(error) })
    }
  }
  
  return results
}

export default supabase
