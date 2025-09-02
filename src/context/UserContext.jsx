// src/context/UserContext.jsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { supabase } from '@/services/supabaseClient'

// Create the context
const UserContext = createContext()

// Action types
const USER_ACTIONS = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  UPDATE_STATS: 'UPDATE_STATS',
  SET_THEME: 'SET_THEME',
  RESET_USER: 'RESET_USER',
  SET_SESSION: 'SET_SESSION'
}

// Default user settings
const defaultSettings = {
  // Theme settings
  theme: 'system', // light, dark, system
  themeVariant: 'default', // default, ocean, sunset, lavender, mountain, coffee
  highContrast: false,
  reduceMotion: false,
  
  // Font settings
  fontSize: 16,
  fontWeight: '400',
  
  // Volume settings
  volumes: {
    master: 0.8,
    soundscape: 0.5,
    timer: 0.7,
    notification: 0.6,
    ui: 0.3,
    focusBoost: 0.4
  },
  
  // Timer settings
  pomodoroTime: 25,
  deepWorkTime: 90,
  shortBreakTime: 5,
  longBreakTime: 15,
  autoStartBreaks: true,
  timerNotifications: true,
  
  // Focus settings
  focusMode: 'pomodoro',
  backgroundSounds: true,
  selectedBackground: 'forest',
  selectedSoundscape: 'rain',
  
  // Productivity settings
  dailyGoal: 4, // sessions per day
  weeklyGoal: 20, // sessions per week
  preferredStudyTimes: ['morning'], // morning, afternoon, evening
  
  // Privacy settings
  analyticsEnabled: true,
  crashReporting: true,
  shareProgress: false,
  
  // Accessibility settings
  keyboardNavigation: true,
  screenReaderSupport: false,
  largeText: false,
  colorBlindSupport: false,
  
  // Notification settings
  browserNotifications: true,
  emailNotifications: false,
  studyReminders: true,
  achievementAlerts: true,
  weeklyReports: true
}

// Default user state
const initialState = {
  user: null,
  session: null,
  isLoading: true,
  error: null,
  settings: defaultSettings,
  stats: {
    totalSessions: 0,
    totalFocusTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    xp: 0,
    completedTasks: 0,
    averageSessionLength: 0,
    productiveHours: [],
    weeklyStats: [],
    achievements: []
  },
  preferences: {
    onboardingCompleted: false,
    tutorialSteps: {},
    favoriteFeatures: [],
    lastActiveDate: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

// Reducer function
const userReducer = (state, action) => {
  switch (action.type) {
    case USER_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null
      }
    
    case USER_ACTIONS.SET_SESSION:
      return {
        ...state,
        session: action.payload
      }
    
    case USER_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      }
    
    case USER_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    
    case USER_ACTIONS.UPDATE_SETTINGS:
      const newSettings = {
        ...state.settings,
        ...action.payload
      }
      return {
        ...state,
        settings: newSettings
      }
    
    case USER_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      }
    
    case USER_ACTIONS.UPDATE_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload
        }
      }
    
    case USER_ACTIONS.SET_THEME:
      return {
        ...state,
        settings: {
          ...state.settings,
          theme: action.payload
        }
      }
    
    case USER_ACTIONS.RESET_USER:
      return {
        ...initialState,
        isLoading: false
      }
    
    default:
      return state
  }
}

// Provider component
export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState)

  // Initialize user session
  useEffect(() => {
    initializeAuth()
    loadUserSettings()
    
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session)
        
        if (event === 'SIGNED_IN') {
          await handleUserSignIn(session)
        } else if (event === 'SIGNED_OUT') {
          handleUserSignOut()
        } else if (event === 'TOKEN_REFRESHED') {
          dispatch({ type: USER_ACTIONS.SET_SESSION, payload: session })
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Auto-save settings to localStorage
  useEffect(() => {
    if (state.settings !== defaultSettings) {
      localStorage.setItem('lumos-settings', JSON.stringify(state.settings))
    }
  }, [state.settings])

  // Auto-save user preferences
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('lumos-preferences', JSON.stringify(state.preferences))
    }
  }, [state.preferences, state.user])

  const initializeAuth = async () => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
        return
      }

      if (session) {
        await handleUserSignIn(session)
      } else {
        dispatch({ type: USER_ACTIONS.SET_LOADING, payload: false })
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const handleUserSignIn = async (session) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_SESSION, payload: session })
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      const userData = {
        id: session.user.id,
        email: session.user.email,
        name: profile?.name || session.user.user_metadata?.full_name || 'Anonymous',
        avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url,
        createdAt: profile?.created_at || session.user.created_at,
        ...profile
      }

      dispatch({ type: USER_ACTIONS.SET_USER, payload: userData })
      
      // Load user-specific settings
      await loadUserData(session.user.id)
      
    } catch (error) {
      console.error('Error handling sign in:', error)
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const handleUserSignOut = () => {
    dispatch({ type: USER_ACTIONS.RESET_USER })
    localStorage.removeItem('lumos-preferences')
    // Keep settings in localStorage for next login
  }

  const loadUserSettings = () => {
    try {
      const savedSettings = localStorage.getItem('lumos-settings')
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        dispatch({ 
          type: USER_ACTIONS.UPDATE_SETTINGS, 
          payload: { ...defaultSettings, ...parsedSettings }
        })
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }

  const loadUserData = async (userId) => {
    try {
      // Load user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (stats && !statsError) {
        dispatch({ type: USER_ACTIONS.UPDATE_STATS, payload: stats })
      }

      // Load user preferences
      const savedPreferences = localStorage.getItem('lumos-preferences')
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences)
        dispatch({
          type: USER_ACTIONS.UPDATE_PROFILE,
          payload: { preferences: parsedPreferences }
        })
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const signIn = async (email, password) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: null })

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      return { data: null, error }
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    try {
      dispatch({ type: USER_ACTIONS.SET_LOADING, payload: true })
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: null })

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      return { data: null, error }
    }
  }

  const updateSettings = useCallback((newSettings) => {
    dispatch({ type: USER_ACTIONS.UPDATE_SETTINGS, payload: newSettings })
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      if (!state.user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)

      if (error) throw error

      dispatch({ type: USER_ACTIONS.UPDATE_PROFILE, payload: updates })
      return { error: null }
    } catch (error) {
      dispatch({ type: USER_ACTIONS.SET_ERROR, payload: error.message })
      return { error }
    }
  }, [state.user])

  const updateStats = useCallback(async (statsUpdate) => {
    try {
      dispatch({ type: USER_ACTIONS.UPDATE_STATS, payload: statsUpdate })

      if (state.user) {
        const { error } = await supabase
          .from('user_stats')
          .upsert({
            user_id: state.user.id,
            ...state.stats,
            ...statsUpdate,
            updated_at: new Date().toISOString()
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error updating stats:', error)
    }
  }, [state.user, state.stats])

  const resetSettings = useCallback(() => {
    dispatch({ type: USER_ACTIONS.UPDATE_SETTINGS, payload: defaultSettings })
    localStorage.removeItem('lumos-settings')
  }, [])

  const exportUserData = useCallback(() => {
    const exportData = {
      user: state.user,
      settings: state.settings,
      stats: state.stats,
      preferences: state.preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `lumos-user-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }, [state])

  const importUserData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          if (importedData.settings) {
            dispatch({ type: USER_ACTIONS.UPDATE_SETTINGS, payload: importedData.settings })
          }
          
          if (importedData.preferences) {
            dispatch({ type: USER_ACTIONS.UPDATE_PROFILE, payload: { preferences: importedData.preferences } })
          }
          
          resolve(importedData)
        } catch (error) {
          reject(new Error('Invalid file format'))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }, [])

  // Guest user methods
  const continueAsGuest = useCallback(() => {
    const guestUser = {
      id: 'guest',
      email: null,
      name: 'Guest User',
      avatar: null,
      isGuest: true,
      createdAt: new Date().toISOString()
    }
    
    dispatch({ type: USER_ACTIONS.SET_USER, payload: guestUser })
  }, [])

  const convertGuestToUser = useCallback(async (email, password, name) => {
    try {
      const { data, error } = await signUp(email, password, { full_name: name })
      if (error) throw error

      // Migrate guest data to new user account
      // This would involve transferring any local data to the new user's account
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }, [])

  // Context value
  const value = {
    // State
    user: state.user,
    session: state.session,
    settings: state.settings,
    stats: state.stats,
    preferences: state.preferences,
    isLoading: state.isLoading,
    error: state.error,
    isAuthenticated: !!state.user && !state.user?.isGuest,
    isGuest: state.user?.isGuest || false,
    
    // Auth methods
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    continueAsGuest,
    convertGuestToUser,
    
    // Update methods
    updateSettings,
    updateProfile,
    updateStats,
    resetSettings,
    
    // Data methods
    exportUserData,
    importUserData,
    
    // Utility methods
    clearError: () => dispatch({ type: USER_ACTIONS.SET_ERROR, payload: null })
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// Hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Hook for authentication status
export const useAuth = () => {
  const { user, session, isAuthenticated, isLoading } = useUser()
  return { user, session, isAuthenticated, isLoading }
}

// Hook for user settings
export const useSettings = () => {
  const { settings, updateSettings, resetSettings } = useUser()
  return { settings, updateSettings, resetSettings }
}

// Hook for user stats
export const useStats = () => {
  const { stats, updateStats } = useUser()
  return { stats, updateStats }
}

export default UserContext
