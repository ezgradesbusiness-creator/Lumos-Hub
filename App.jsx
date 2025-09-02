// src/App.jsx
import React, { Suspense, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Helmet, HelmetProvider } from 'react-helmet-async'

// Context Providers
import { UserProvider, useUser } from '@/context/UserContext'
import { NotificationProvider } from '@/components/UI/Notification'

// Services
import authService from '@/services/authService'
import { supabase } from '@/services/supabaseClient'

// Pages (Lazy loaded for better performance)
const LandingPage = React.lazy(() => import('@/pages/index'))
const DashboardPage = React.lazy(() => import('@/pages/dashboard'))
const FocusPage = React.lazy(() => import('@/pages/focus'))
const BreakPage = React.lazy(() => import('@/pages/break'))
const ChroniclePage = React.lazy(() => import('@/pages/chronicle'))
const SettingsPage = React.lazy(() => import('@/pages/settings'))

// Components
import LoadingSpinner from '@/components/UI/LoadingSpinner'
import ErrorBoundary from '@/components/ErrorBoundary'

// Hooks
import { useOfflineSync } from '@/hooks/useOfflineSync'

// Styles
import '@/styles/globals.css'
import '@/styles/animations.css'

// Constants
const APP_NAME = 'Lumos Hub'
const APP_DESCRIPTION = 'Transform your study sessions with intelligent focus tools, beautiful progress tracking, and a supportive community.'

/**
 * Protected Route Component
 * Handles authentication and redirects
 */
const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, isLoading, isAuthenticated } = useUser()
  
  if (isLoading) {
    return <PageLoader />
  }
  
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/" replace />
  }
  
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

/**
 * Page Transition Wrapper
 * Adds smooth transitions between pages
 */
const PageTransition = ({ children }) => {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Loading Spinner Component
 */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-background to-surface">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-xl">L</span>
      </div>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-text-secondary">Loading Lumos Hub...</p>
    </motion.div>
  </div>
)

/**
 * Offline Status Component
 */
const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { pendingOperations, syncStatus } = useOfflineSync()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && pendingOperations.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2 text-center text-sm"
    >
      {!isOnline ? (
        <span>📡 You're offline. Changes will sync when you're back online.</span>
      ) : pendingOperations.length > 0 ? (
        <span>
          🔄 Syncing {pendingOperations.length} changes...
          {syncStatus === 'syncing' && <span className="animate-pulse ml-2">●</span>}
        </span>
      ) : null}
    </motion.div>
  )
}

/**
 * Theme Manager Component
 */
const ThemeManager = () => {
  const { settings } = useUser()

  useEffect(() => {
    const root = document.documentElement
    const theme = settings?.theme || 'system'
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark')
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const applySystemTheme = () => {
        root.classList.add(mediaQuery.matches ? 'theme-dark' : 'theme-light')
      }
      
      applySystemTheme()
      mediaQuery.addEventListener('change', applySystemTheme)
      
      return () => mediaQuery.removeEventListener('change', applySystemTheme)
    } else {
      root.classList.add(`theme-${theme}`)
    }
  }, [settings?.theme])

  // Apply accessibility settings
  useEffect(() => {
    const root = document.documentElement
    
    if (settings?.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    if (settings?.reduceMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
    
    // Apply font size
    if (settings?.fontSize) {
      root.style.setProperty('--app-font-size', `${settings.fontSize}px`)
    }
    
    // Apply font weight
    if (settings?.fontWeight) {
      root.style.setProperty('--app-font-weight', settings.fontWeight)
    }
  }, [settings])

  return null
}

/**
 * Service Worker Manager
 */
const ServiceWorkerManager = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }
  }, [])

  return null
}

/**
 * SEO Manager Component
 */
const SEOManager = () => {
  const location = useLocation()
  const { user } = useUser()

  const getPageMeta = () => {
    const path = location.pathname
    const baseTitle = APP_NAME
    
    switch (path) {
      case '/':
        return {
          title: `${baseTitle} - Transform Your Learning Journey`,
          description: APP_DESCRIPTION,
          canonical: 'https://lumoshub.com'
        }
      case '/dashboard':
        return {
          title: `Dashboard - ${baseTitle}`,
          description: 'Your personalized learning dashboard with focus tools and progress tracking.',
          canonical: 'https://lumoshub.com/dashboard'
        }
      case '/focus':
        return {
          title: `Focus Mode - ${baseTitle}`,
          description: 'Enter deep focus with Pomodoro timers, ambient sounds, and distraction-free environment.',
          canonical: 'https://lumoshub.com/focus'
        }
      case '/break':
        return {
          title: `Break Time - ${baseTitle}`,
          description: 'Recharge with guided breaks, mini-games, and wellness activities.',
          canonical: 'https://lumoshub.com/break'
        }
      case '/chronicle':
        return {
          title: `Study Chronicle - ${baseTitle}`,
          description: 'Track your learning journey with beautiful visualizations and achievements.',
          canonical: 'https://lumoshub.com/chronicle'
        }
      case '/settings':
        return {
          title: `Settings - ${baseTitle}`,
          description: 'Customize your learning experience with themes, sounds, and accessibility options.',
          canonical: 'https://lumoshub.com/settings'
        }
      default:
        return {
          title: baseTitle,
          description: APP_DESCRIPTION,
          canonical: 'https://lumoshub.com'
        }
    }
  }

  const { title, description, canonical } = getPageMeta()

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://lumoshub.com/og-image.jpg" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content="https://lumoshub.com/twitter-image.jpg" />
      
      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Lumos Hub Team" />
      <meta name="theme-color" content="#647a63" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* User-specific meta tags */}
      {user && !user.isGuest && (
        <meta name="user-authenticated" content="true" />
      )}
    </Helmet>
  )
}

/**
 * App Router Component
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute requireAuth={false}>
            <PageTransition>
              <LandingPage />
            </PageTransition>
          </ProtectedRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <PageTransition>
              <DashboardPage />
            </PageTransition>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/focus" 
        element={
          <ProtectedRoute>
            <PageTransition>
              <FocusPage />
            </PageTransition>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/break" 
        element={
          <ProtectedRoute>
            <PageTransition>
              <BreakPage />
            </PageTransition>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/chronicle" 
        element={
          <ProtectedRoute>
            <PageTransition>
              <ChroniclePage />
            </PageTransition>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <PageTransition>
              <SettingsPage />
            </PageTransition>
          </ProtectedRoute>
        } 
      />

      {/* Catch all route - redirect to dashboard if authenticated, otherwise to landing */}
      <Route 
        path="*" 
        element={<Navigate to="/dashboard" replace />} 
      />
    </Routes>
  )
}

/**
 * Main App Component
 */
const App = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState(null)

  // Initialize the application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize auth service
        await authService.initialize()
        
        // Check for notification permissions
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission()
        }
        
        setIsInitialized(true)
      } catch (error) {
        console.error('App initialization error:', error)
        setInitError(error)
        setIsInitialized(true) // Still show the app, but with error state
      }
    }

    initializeApp()
  }, [])

  // Show loading screen during initialization
  if (!isInitialized) {
    return <PageLoader />
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-background to-surface">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Something went wrong</h2>
          <p className="text-text-secondary mb-4">
            We encountered an error while starting Lumos Hub. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <UserProvider>
          <NotificationProvider>
            <Router>
              <div className="App">
                {/* Global Components */}
                <SEOManager />
                <ThemeManager />
                <ServiceWorkerManager />
                <OfflineStatus />
                
                {/* Main App Content */}
                <Suspense fallback={<PageLoader />}>
                  <AppRouter />
                </Suspense>
              </div>
            </Router>
          </NotificationProvider>
        </UserProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

/**
 * Error Boundary Component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // Log error to monitoring service
    console.error('App Error Boundary:', error, errorInfo)
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface via-background to-surface">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-lg mx-auto p-6"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">!</span>
            </div>
            
            <h1 className="text-2xl font-bold text-text mb-4">Oops! Something went wrong</h1>
            
            <p className="text-text-secondary mb-6">
              We're sorry, but something unexpected happened. Our team has been notified and we're working to fix this issue.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary w-full"
              >
                Refresh Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-outline w-full"
              >
                Go to Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-text-secondary">
                  Show Error Details
                </summary>
                <pre className="mt-2 p-4 bg-red-50 border border-red-200 rounded text-xs overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default App
