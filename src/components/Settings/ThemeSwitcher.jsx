// src/components/Settings/ThemeSwitcher.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Eye, 
  Sparkles,
  Settings,
  Smartphone,
  Contrast,
  Droplet,
  Leaf,
  Flame,
  Waves,
  Mountain,
  Stars,
  Coffee
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'

const ThemeSwitcher = ({ showCard = true, className = '' }) => {
  const { settings, updateSettings } = useUser()
  const [systemTheme, setSystemTheme] = useState('light')
  const [previewTheme, setPreviewTheme] = useState(null)
  const [showColorPalette, setShowColorPalette] = useState(false)

  const currentTheme = settings?.theme || 'system'
  const currentVariant = settings?.themeVariant || 'default'

  // Theme options with descriptions
  const themeOptions = [
    {
      id: 'light',
      name: 'Light Mode',
      description: 'Clean and bright interface',
      icon: Sun,
      preview: {
        background: '#fcfcf9',
        surface: '#ffffff',
        text: '#1f2937',
        primary: '#647a63',
        border: '#e5e7eb'
      }
    },
    {
      id: 'dark',
      name: 'Dark Mode',
      description: 'Easy on the eyes, perfect for night study',
      icon: Moon,
      preview: {
        background: '#213140',
        surface: '#374151',
        text: '#f9fafb',
        primary: '#647a63',
        border: '#4b5563'
      }
    },
    {
      id: 'system',
      name: 'System Default',
      description: 'Matches your device preference',
      icon: Monitor,
      preview: {
        background: systemTheme === 'dark' ? '#213140' : '#fcfcf9',
        surface: systemTheme === 'dark' ? '#374151' : '#ffffff',
        text: systemTheme === 'dark' ? '#f9fafb' : '#1f2937',
        primary: '#647a63',
        border: systemTheme === 'dark' ? '#4b5563' : '#e5e7eb'
      }
    }
  ]

  // Theme variants with different color schemes
  const themeVariants = [
    {
      id: 'default',
      name: 'Forest Green',
      description: 'Default calming green theme',
      icon: Leaf,
      colors: {
        primary: '#647a63',
        secondary: '#a98c6c',
        accent: '#162640'
      }
    },
    {
      id: 'ocean',
      name: 'Ocean Blue',
      description: 'Cool and refreshing blue tones',
      icon: Waves,
      colors: {
        primary: '#0ea5e9',
        secondary: '#64748b',
        accent: '#1e40af'
      }
    },
    {
      id: 'sunset',
      name: 'Warm Sunset',
      description: 'Warm oranges and soft pinks',
      icon: Sun,
      colors: {
        primary: '#f59e0b',
        secondary: '#ef4444',
        accent: '#dc2626'
      }
    },
    {
      id: 'lavender',
      name: 'Lavender Dreams',
      description: 'Soft purples for a calming effect',
      icon: Sparkles,
      colors: {
        primary: '#8b5cf6',
        secondary: '#a78bfa',
        accent: '#7c3aed'
      }
    },
    {
      id: 'mountain',
      name: 'Mountain Peak',
      description: 'Cool grays and deep blues',
      icon: Mountain,
      colors: {
        primary: '#64748b',
        secondary: '#475569',
        accent: '#1e293b'
      }
    },
    {
      id: 'coffee',
      name: 'Coffee House',
      description: 'Rich browns and warm tones',
      icon: Coffee,
      colors: {
        primary: '#a16207',
        secondary: '#92400e',
        accent: '#78350f'
      }
    }
  ]

  // Accessibility options
  const accessibilityOptions = [
    {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Enhanced contrast for better visibility',
      enabled: settings?.highContrast || false,
      icon: Contrast
    },
    {
      id: 'reduce-motion',
      name: 'Reduce Motion',
      description: 'Minimize animations and transitions',
      enabled: settings?.reduceMotion || false,
      icon: Settings
    }
  ]

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme changes
  useEffect(() => {
    applyTheme(currentTheme, currentVariant)
  }, [currentTheme, currentVariant, systemTheme])

  const applyTheme = (theme, variant = 'default') => {
    const root = document.documentElement
    const selectedVariant = themeVariants.find(v => v.id === variant) || themeVariants[0]
    
    // Determine effective theme
    const effectiveTheme = theme === 'system' ? systemTheme : theme
    
    // Apply theme class
    root.className = root.className.replace(/theme-\w+/g, '')
    root.classList.add(`theme-${effectiveTheme}`)
    
    // Apply color variables
    root.style.setProperty('--color-primary', selectedVariant.colors.primary)
    root.style.setProperty('--color-secondary', selectedVariant.colors.secondary)
    root.style.setProperty('--color-accent', selectedVariant.colors.accent)
    
    // Apply accessibility settings
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
  }

  const handleThemeChange = (themeId) => {
    updateSettings({
      theme: themeId,
      themeVariant: currentVariant
    })
  }

  const handleVariantChange = (variantId) => {
    updateSettings({
      theme: currentTheme,
      themeVariant: variantId
    })
  }

  const toggleAccessibilityOption = (optionId) => {
    const newSettings = { ...settings }
    
    if (optionId === 'high-contrast') {
      newSettings.highContrast = !settings?.highContrast
    } else if (optionId === 'reduce-motion') {
      newSettings.reduceMotion = !settings?.reduceMotion
    }
    
    updateSettings(newSettings)
  }

  const previewThemeChange = (theme, variant = currentVariant) => {
    setPreviewTheme({ theme, variant })
    applyTheme(theme, variant)
  }

  const resetPreview = () => {
    if (previewTheme) {
      setPreviewTheme(null)
      applyTheme(currentTheme, currentVariant)
    }
  }

  const confirmPreview = () => {
    if (previewTheme) {
      updateSettings({
        theme: previewTheme.theme,
        themeVariant: previewTheme.variant
      })
      setPreviewTheme(null)
    }
  }

  const getEffectiveTheme = () => {
    return currentTheme === 'system' ? systemTheme : currentTheme
  }

  const getCurrentVariant = () => {
    return themeVariants.find(v => v.id === currentVariant) || themeVariants[0]
  }

  const ContentComponent = () => (
    <div className="space-y-6">
      {/* Current Theme Display */}
      <div className="text-center">
        <motion.div
          key={`${currentTheme}-${currentVariant}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            {React.createElement(getCurrentVariant().icon, { 
              className: "h-8 w-8 text-white" 
            })}
          </div>
          <h4 className="text-lg font-semibold text-text">{getCurrentVariant().name}</h4>
          <p className="text-sm text-text-secondary">{getCurrentVariant().description}</p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              {getEffectiveTheme() === 'dark' ? 'Dark' : 'Light'} Mode
            </span>
            {currentTheme === 'system' && (
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                System
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Theme Mode Selection */}
      <div>
        <h5 className="font-medium text-text mb-3">Appearance Mode</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {themeOptions.map(option => {
            const IconComponent = option.icon
            const isSelected = currentTheme === option.id
            
            return (
              <motion.button
                key={option.id}
                onClick={() => handleThemeChange(option.id)}
                onMouseEnter={() => previewThemeChange(option.id)}
                onMouseLeave={resetPreview}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-card-border bg-background hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-text-secondary'}`} />
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </div>
                <p className="font-medium text-sm text-text mb-1">{option.name}</p>
                <p className="text-xs text-text-secondary">{option.description}</p>
                
                {/* Color Preview */}
                <div className="flex space-x-1 mt-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-card-border"
                    style={{ backgroundColor: option.preview.background }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-card-border"
                    style={{ backgroundColor: option.preview.surface }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-card-border"
                    style={{ backgroundColor: option.preview.primary }}
                  />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Theme Variants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-text">Color Themes</h5>
          <Button
            onClick={() => setShowColorPalette(!showColorPalette)}
            size="sm"
            variant="ghost"
          >
            <Palette className="h-4 w-4 mr-1" />
            Palette
          </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {themeVariants.map(variant => {
            const IconComponent = variant.icon
            const isSelected = currentVariant === variant.id
            
            return (
              <motion.button
                key={variant.id}
                onClick={() => handleVariantChange(variant.id)}
                onMouseEnter={() => previewThemeChange(currentTheme, variant.id)}
                onMouseLeave={resetPreview}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-card-border bg-background hover:border-primary/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-text-secondary'}`} />
                  {isSelected && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </div>
                <p className="font-medium text-sm text-text mb-1">{variant.name}</p>
                <p className="text-xs text-text-secondary mb-2">{variant.description}</p>
                
                {/* Color Dots */}
                <div className="flex space-x-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-card-border"
                    style={{ backgroundColor: variant.colors.primary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-card-border"
                    style={{ backgroundColor: variant.colors.secondary }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full border border-card-border"
                    style={{ backgroundColor: variant.colors.accent }}
                  />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Color Palette Expansion */}
      <AnimatePresence>
        {showColorPalette && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h5 className="font-medium text-text">Current Color Palette</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(getCurrentVariant().colors).map(([name, color]) => (
                <div key={name} className="text-center">
                  <div 
                    className="w-16 h-16 rounded-lg mx-auto mb-2 border border-card-border shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-sm font-medium text-text capitalize">{name}</p>
                  <p className="text-xs text-text-secondary font-mono">{color}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility Options */}
      <div>
        <h5 className="font-medium text-text mb-3 flex items-center">
          <Eye className="mr-2 h-4 w-4" />
          Accessibility
        </h5>
        <div className="space-y-3">
          {accessibilityOptions.map(option => {
            const IconComponent = option.icon
            
            return (
              <div
                key={option.id}
                className="flex items-center justify-between p-3 border border-card-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-4 w-4 text-text-secondary" />
                  <div>
                    <p className="font-medium text-sm text-text">{option.name}</p>
                    <p className="text-xs text-text-secondary">{option.description}</p>
                  </div>
                </div>
                
                <motion.button
                  onClick={() => toggleAccessibilityOption(option.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    option.enabled ? 'bg-primary' : 'bg-card-border'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      option.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                    layout
                  />
                </motion.button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Preview Controls */}
      <AnimatePresence>
        {previewTheme && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-primary/5 border border-primary/20 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Previewing Theme</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={resetPreview} size="sm" variant="ghost">
                  Cancel
                </Button>
                <Button onClick={confirmPreview} size="sm">
                  Apply
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Information */}
      <div className="p-4 bg-background rounded-lg border border-card-border">
        <h6 className="font-medium text-text mb-2 flex items-center">
          <Sparkles className="mr-2 h-4 w-4" />
          Theme Benefits
        </h6>
        <div className="text-sm text-text-secondary space-y-1">
          <p>• Dark mode reduces eye strain during night study sessions</p>
          <p>• Light mode provides better readability in bright environments</p>
          <p>• Color themes can enhance mood and focus</p>
          <p>• System mode automatically adapts to your device preferences</p>
          <p>• High contrast improves visibility for users with visual impairments</p>
        </div>
      </div>

      {/* Device-specific Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center p-3 bg-background rounded-lg border border-card-border">
          <Monitor className="h-6 w-6 mx-auto mb-2 text-text-secondary" />
          <p className="text-sm font-medium text-text">Desktop</p>
          <p className="text-xs text-text-secondary">
            {getEffectiveTheme() === 'dark' ? 'Dark mode active' : 'Light mode active'}
          </p>
        </div>
        <div className="text-center p-3 bg-background rounded-lg border border-card-border">
          <Smartphone className="h-6 w-6 mx-auto mb-2 text-text-secondary" />
          <p className="text-sm font-medium text-text">Mobile</p>
          <p className="text-xs text-text-secondary">
            {currentTheme === 'system' ? 'Following system' : 'Custom theme'}
          </p>
        </div>
      </div>
    </div>
  )

  if (!showCard) {
    return <div className={className}><ContentComponent /></div>
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Theme & Appearance
            </h3>
            <p className="text-sm text-text-secondary">Customize the look and feel of your workspace</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <div className="w-3 h-3 rounded-full bg-accent" />
            </div>
          </div>
        </div>

        <ContentComponent />
      </div>
    </Card>
  )
}

export default ThemeSwitcher
