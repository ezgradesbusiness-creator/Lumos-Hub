// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Import global styles
import './styles/globals.css'
import './styles/animations.css'

// Import polyfills for older browsers
import 'core-js/stable'
import 'regenerator-runtime/runtime'

// Performance monitoring (optional - uncomment if using web vitals)
// import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

/**
 * Web Vitals Performance Monitoring
 * Measures and reports key performance metrics
 */
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry)
      getFID(onPerfEntry)
      getFCP(onPerfEntry)
      getLCP(onPerfEntry)
      getTTFB(onPerfEntry)
    })
  }
}

/**
 * Global Error Handler
 * Catches and logs unhandled errors
 */
const setupGlobalErrorHandling = () => {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error)
    
    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(event.error)
    }
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // Example: Sentry.captureException(event.reason)
    }
    
    // Prevent the default browser error handling
    event.preventDefault()
  })
}

/**
 * Browser Compatibility Check
 * Displays warning for unsupported browsers
 */
const checkBrowserCompatibility = () => {
  const isSupported = () => {
    // Check for essential modern browser features
    return (
      'fetch' in window &&
      'Promise' in window &&
      'Map' in window &&
      'Set' in window &&
      'Symbol' in window &&
      'localStorage' in window &&
      'sessionStorage' in window &&
      'addEventListener' in window &&
      'querySelector' in document &&
      'classList' in document.createElement('div')
    )
  }

  if (!isSupported()) {
    const message = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background: #f8f9fa; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        flex-direction: column; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 10000;
      ">
        <div style="max-width: 500px; text-align: center; padding: 2rem;">
          <h1 style="color: #647a63; margin-bottom: 1rem;">Browser Not Supported</h1>
          <p style="color: #6b7280; margin-bottom: 2rem;">
            Lumos Hub requires a modern browser to function properly. 
            Please update your browser or try using:
          </p>
          <ul style="list-style: none; padding: 0; color: #6b7280;">
            <li style="margin: 0.5rem 0;">• Google Chrome (latest)</li>
            <li style="margin: 0.5rem 0;">• Mozilla Firefox (latest)</li>
            <li style="margin: 0.5rem 0;">• Safari (latest)</li>
            <li style="margin: 0.5rem 0;">• Microsoft Edge (latest)</li>
          </ul>
        </div>
      </div>
    `
    document.body.innerHTML = message
    return false
  }
  
  return true
}

/**
 * Environment Configuration
 * Sets up environment-specific configurations
 */
const setupEnvironment = () => {
  // Development mode configurations
  if (import.meta.env.DEV) {
    // Enable React DevTools
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || {}
    
    // Add development helpers to window for debugging
    window.lumosDebug = {
      env: import.meta.env,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
    }
    
    console.log('🌟 Lumos Hub - Development Mode')
    console.log('Debug tools available at window.lumosDebug')
  }

  // Production mode configurations
  if (import.meta.env.PROD) {
    // Disable console logs in production
    if (!import.meta.env.VITE_ENABLE_CONSOLE) {
      console.log = () => {}
      console.warn = () => {}
      console.info = () => {}
    }
    
    // Add production identifiers
    window.LUMOS_PRODUCTION = true
  }

  // Set up global app metadata
  window.LUMOS_APP = {
    name: 'Lumos Hub',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE,
    buildTime: import.meta.env.VITE_BUILD_TIME || new Date().toISOString()
  }
}

/**
 * Feature Detection and Polyfills
 * Ensures modern JavaScript features are available
 */
const setupPolyfills = () => {
  // ResizeObserver polyfill for older browsers
  if (!window.ResizeObserver) {
    import('resize-observer-polyfill').then(({ default: ResizeObserver }) => {
      window.ResizeObserver = ResizeObserver
    })
  }

  // IntersectionObserver polyfill for older browsers
  if (!window.IntersectionObserver) {
    import('intersection-observer')
  }

  // Web Animations API polyfill
  if (!Element.prototype.animate) {
    import('web-animations-js')
  }

  // Custom Elements polyfill for older browsers
  if (!window.customElements) {
    import('@webcomponents/custom-elements')
  }
}

/**
 * Accessibility Enhancements
 * Sets up global accessibility features
 */
const setupAccessibility = () => {
  // Add focus-visible polyfill for better focus indicators
  import('focus-visible')

  // Set up skip links for keyboard navigation
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded'
  document.body.insertBefore(skipLink, document.body.firstChild)

  // Respect user's motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (prefersReducedMotion.matches) {
    document.documentElement.classList.add('reduce-motion')
  }

  prefersReducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  })

  // Handle high contrast preference
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)')
  if (prefersHighContrast.matches) {
    document.documentElement.classList.add('high-contrast')
  }

  prefersHighContrast.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }
  })
}

/**
 * Performance Optimization
 * Sets up performance monitoring and optimizations
 */
const setupPerformance = () => {
  // Report web vitals in production
  if (import.meta.env.PROD) {
    reportWebVitals((metric) => {
      // Send to analytics service
      console.log('Web Vital:', metric)
      
      // Example: Send to Google Analytics
      // gtag('event', metric.name, {
      //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      //   event_category: 'Web Vitals',
      //   non_interaction: true,
      // })
    })
  }

  // Preload critical resources
  const preloadCriticalResources = () => {
    // Preload fonts
    const fonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap'
    ]

    fonts.forEach(fontUrl => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = fontUrl
      link.as = 'style'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    })
  }

  preloadCriticalResources()

  // Set up performance observer for long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('Long task detected:', entry)
          }
        }
      })
      observer.observe({ entryTypes: ['longtask'] })
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}

/**
 * Service Worker Registration
 * Registers service worker for offline functionality
 */
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered:', registration)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, notify user
            console.log('New content available')
            
            // You could show a notification to the user here
            // Example: showUpdateAvailableNotification()
          }
        })
      })
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

/**
 * Initialize Application
 * Main initialization function
 */
const initializeApp = async () => {
  try {
    // Check browser compatibility first
    if (!checkBrowserCompatibility()) {
      return
    }

    // Set up environment
    setupEnvironment()
    
    // Set up error handling
    setupGlobalErrorHandling()
    
    // Load polyfills
    setupPolyfills()
    
    // Set up accessibility
    setupAccessibility()
    
    // Set up performance monitoring
    setupPerformance()
    
    // Register service worker
    await registerServiceWorker()

    // Get the root element
    const rootElement = document.getElementById('root')
    
    if (!rootElement) {
      throw new Error('Root element not found')
    }

    // Create React root
    const root = ReactDOM.createRoot(rootElement)
    
    // Render the app
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )

    // Set up hot module replacement for development
    if (import.meta.hot) {
      import.meta.hot.accept('./App.jsx', () => {
        // Re-render the app when App.jsx changes
        root.render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        )
      })
    }

    console.log('🚀 Lumos Hub initialized successfully')

  } catch (error) {
    console.error('Failed to initialize app:', error)
    
    // Fallback error display
    document.getElementById('root').innerHTML = `
      <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #fcfcf9 0%, #ffffff 100%);
      ">
        <div style="text-align: center; max-width: 400px; padding: 2rem;">
          <div style="
            width: 80px; 
            height: 80px; 
            margin: 0 auto 1.5rem; 
            background: #ef4444; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
          ">
            <span style="color: white; font-size: 2rem; font-weight: bold;">!</span>
          </div>
          <h1 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.5rem;">
            Failed to Load
          </h1>
          <p style="color: #6b7280; margin-bottom: 2rem; line-height: 1.5;">
            We're sorry, but Lumos Hub failed to initialize. Please try refreshing the page.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              background: #647a63; 
              color: white; 
              border: none; 
              padding: 0.75rem 1.5rem; 
              border-radius: 0.5rem; 
              font-size: 1rem; 
              cursor: pointer;
              transition: background-color 0.2s;
            "
            onmouseover="this.style.background='#556650'"
            onmouseout="this.style.background='#647a63'"
          >
            Refresh Page
          </button>
        </div>
      </div>
    `
  }
}

// Initialize the application
initializeApp()

// Export for hot module replacement
export default initializeApp
