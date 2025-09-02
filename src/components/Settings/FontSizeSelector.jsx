// src/components/Settings/FontSizeSelector.jsx
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Type, 
  Plus, 
  Minus, 
  RotateCcw, 
  Eye, 
  Accessibility,
  Monitor,
  Smartphone,
  Check,
  Info,
  Zap,
  Settings
} from 'lucide-react'
import Card from '@/components/UI/Card'
import Button from '@/components/UI/Button'
import { useUser } from '@/context/UserContext'

const FontSizeSelector = ({ showCard = true, className = '' }) => {
  const { settings, updateSettings } = useUser()
  const [previewText, setPreviewText] = useState('sample')
  const [selectedWeight, setSelectedWeight] = useState('normal')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Font size presets with descriptions
  const fontSizePresets = [
    {
      name: 'Extra Small',
      value: 12,
      description: 'Compact view, more content visible',
      icon: '🔍',
      recommended: false,
      accessibility: 'May be difficult for some users'
    },
    {
      name: 'Small',
      value: 14,
      description: 'Standard desktop size',
      icon: '📱',
      recommended: true,
      accessibility: 'Good for most users'
    },
    {
      name: 'Medium',
      value: 16,
      description: 'Comfortable reading size (Default)',
      icon: '💻',
      recommended: true,
      accessibility: 'Recommended for accessibility',
      isDefault: true
    },
    {
      name: 'Large',
      value: 18,
      description: 'Easier to read, less eye strain',
      icon: '👀',
      recommended: true,
      accessibility: 'Great for extended reading'
    },
    {
      name: 'Extra Large',
      value: 20,
      description: 'Maximum comfort, accessibility focused',
      icon: '🔎',
      recommended: true,
      accessibility: 'Excellent for visual accessibility'
    },
    {
      name: 'Huge',
      value: 24,
      description: 'For users with visual impairments',
      icon: '♿',
      recommended: false,
      accessibility: 'Optimized for low vision users'
    }
  ]

  // Font weight options
  const fontWeights = [
    { name: 'Light', value: '300', description: 'Thin and minimal' },
    { name: 'Normal', value: '400', description: 'Standard weight' },
    { name: 'Medium', value: '500', description: 'Slightly bold' },
    { name: 'Semi Bold', value: '600', description: 'Enhanced readability' },
    { name: 'Bold', value: '700', description: 'Strong emphasis' }
  ]

  // Sample texts for preview
  const sampleTexts = [
    {
      name: 'Quick Preview',
      text: 'The quick brown fox jumps over the lazy dog. This preview shows how your text will appear with the selected font settings.'
    },
    {
      name: 'Study Content',
      text: 'Focus Timer: 25:00 remaining • Task: Complete React component development • Notes: Remember to test accessibility features and responsive design.'
    },
    {
      name: 'Reading Text',
      text: 'Effective studying requires a balance of focused work sessions and adequate breaks. The Pomodoro Technique suggests 25-minute work intervals followed by 5-minute breaks.'
    },
    {
      name: 'UI Elements',
      text: 'Dashboard • Focus Mode • Study Chronicle • Settings • Profile • Tasks (5) • Notes (12) • Sessions Today (3)'
    }
  ]

  const currentFontSize = settings?.fontSize || 16
  const currentFontWeight = settings?.fontWeight || '400'

  useEffect(() => {
    // Apply font size to document root for immediate preview
    document.documentElement.style.setProperty('--app-font-size', `${currentFontSize}px`)
    document.documentElement.style.setProperty('--app-font-weight', currentFontWeight)
  }, [currentFontSize, currentFontWeight])

  const updateFontSize = (newSize) => {
    updateSettings({
      fontSize: newSize,
      fontWeight: selectedWeight !== 'normal' ? fontWeights.find(w => w.name.toLowerCase() === selectedWeight)?.value : currentFontWeight
    })
  }

  const updateFontWeight = (weight) => {
    setSelectedWeight(weight.name.toLowerCase())
    updateSettings({
      fontSize: currentFontSize,
      fontWeight: weight.value
    })
  }

  const resetToDefault = () => {
    updateSettings({
      fontSize: 16,
      fontWeight: '400'
    })
    setSelectedWeight('normal')
  }

  const adjustFontSize = (direction) => {
    const currentIndex = fontSizePresets.findIndex(preset => preset.value === currentFontSize)
    let newIndex
    
    if (direction === 'increase') {
      newIndex = Math.min(currentIndex + 1, fontSizePresets.length - 1)
    } else {
      newIndex = Math.max(currentIndex - 1, 0)
    }
    
    updateFontSize(fontSizePresets[newIndex].value)
  }

  const getCurrentPreset = () => {
    return fontSizePresets.find(preset => preset.value === currentFontSize) || fontSizePresets[2]
  }

  const getAccessibilityRating = (fontSize) => {
    if (fontSize >= 18) return { rating: 'Excellent', color: 'text-green-600', icon: '✅' }
    if (fontSize >= 16) return { rating: 'Good', color: 'text-blue-600', icon: '👍' }
    if (fontSize >= 14) return { rating: 'Fair', color: 'text-yellow-600', icon: '⚠️' }
    return { rating: 'Poor', color: 'text-red-600', icon: '❌' }
  }

  const currentPreset = getCurrentPreset()
  const accessibilityRating = getAccessibilityRating(currentFontSize)

  const ContentComponent = () => (
    <div className="space-y-6">
      {/* Current Settings Display */}
      <div className="text-center">
        <motion.div
          key={currentFontSize}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-4"
        >
          <div className="text-4xl mb-2">{currentPreset.icon}</div>
          <h4 className="text-lg font-semibold text-text">{currentPreset.name}</h4>
          <p className="text-sm text-text-secondary">{currentPreset.description}</p>
        </motion.div>

        <div className="flex items-center justify-center space-x-4 text-sm">
          <span className="flex items-center">
            <Type className="h-4 w-4 mr-1" />
            {currentFontSize}px
          </span>
          <span className="flex items-center">
            <Settings className="h-4 w-4 mr-1" />
            {fontWeights.find(w => w.value === currentFontWeight)?.name || 'Normal'}
          </span>
          <span className={`flex items-center ${accessibilityRating.color}`}>
            <Accessibility className="h-4 w-4 mr-1" />
            {accessibilityRating.rating}
          </span>
        </div>
      </div>

      {/* Quick Adjust Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          onClick={() => adjustFontSize('decrease')}
          variant="ghost"
          size="sm"
          disabled={currentFontSize === fontSizePresets[0].value}
          className="h-12 w-12 rounded-full"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="text-center min-w-[120px]">
          <motion.div
            key={currentFontSize}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-primary"
            style={{ fontSize: `${Math.min(currentFontSize * 1.5, 36)}px` }}
          >
            Aa
          </motion.div>
          <p className="text-xs text-text-secondary mt-1">Live Preview</p>
        </div>

        <Button
          onClick={() => adjustFontSize('increase')}
          variant="ghost"
          size="sm"
          disabled={currentFontSize === fontSizePresets[fontSizePresets.length - 1].value}
          className="h-12 w-12 rounded-full"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Font Size Presets */}
      <div>
        <h5 className="font-medium text-text mb-3">Font Size Presets</h5>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {fontSizePresets.map(preset => (
            <motion.button
              key={preset.value}
              onClick={() => updateFontSize(preset.value)}
              className={`p-3 rounded-lg border text-left transition-all ${
                currentFontSize === preset.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-card-border bg-background hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{preset.icon}</span>
                {currentFontSize === preset.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="font-medium text-sm" style={{ fontSize: `${preset.value}px` }}>
                {preset.name}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {preset.value}px
              </p>
              {preset.isDefault && (
                <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Advanced Options</span>
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="h-4 w-4" />
          </motion.div>
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4"
            >
              {/* Font Weight Selector */}
              <div>
                <h5 className="font-medium text-text mb-3">Font Weight</h5>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {fontWeights.map(weight => (
                    <button
                      key={weight.value}
                      onClick={() => updateFontWeight(weight)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        currentFontWeight === weight.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-card-border bg-background hover:border-primary/50'
                      }`}
                    >
                      <p 
                        className="font-medium text-sm mb-1"
                        style={{ fontWeight: weight.value }}
                      >
                        {weight.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {weight.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Font Size */}
              <div>
                <h5 className="font-medium text-text mb-3">Custom Size</h5>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="10"
                    max="32"
                    step="1"
                    value={currentFontSize}
                    onChange={(e) => updateFontSize(parseInt(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-16 text-center text-sm font-mono">
                    {currentFontSize}px
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium text-text flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            Live Preview
          </h5>
          <select
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            className="text-xs border border-card-border rounded px-2 py-1 bg-background"
          >
            {sampleTexts.map((sample, index) => (
              <option key={index} value={sample.name.toLowerCase().replace(' ', '')}>
                {sample.name}
              </option>
            ))}
          </select>
        </div>

        <motion.div
          key={`${currentFontSize}-${currentFontWeight}-${previewText}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border border-card-border rounded-lg bg-background"
          style={{ 
            fontSize: `${currentFontSize}px`,
            fontWeight: currentFontWeight,
            lineHeight: 1.6
          }}
        >
          <p className="text-text">
            {sampleTexts.find(sample => 
              sample.name.toLowerCase().replace(' ', '') === previewText
            )?.text || sampleTexts[0].text}
          </p>
        </motion.div>
      </div>

      {/* Accessibility Information */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h6 className="font-medium text-primary mb-1">Accessibility Tips</h6>
            <div className="text-sm text-primary/80 space-y-1">
              <p>• Larger fonts reduce eye strain during extended study sessions</p>
              <p>• {accessibilityRating.rating} accessibility rating for current size</p>
              <p>• {currentPreset.accessibility}</p>
              {currentFontSize < 16 && (
                <p className="text-yellow-700">💡 Consider increasing to 16px+ for better readability</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Device-specific Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center p-3 bg-background rounded-lg border border-card-border">
          <Monitor className="h-6 w-6 mx-auto mb-2 text-text-secondary" />
          <p className="text-sm font-medium text-text">Desktop</p>
          <p className="text-xs text-text-secondary">14-18px recommended</p>
        </div>
        <div className="text-center p-3 bg-background rounded-lg border border-card-border">
          <Smartphone className="h-6 w-6 mx-auto mb-2 text-text-secondary" />
          <p className="text-sm font-medium text-text">Mobile</p>
          <p className="text-xs text-text-secondary">16-20px recommended</p>
        </div>
      </div>

      {/* Reset Button */}
      <div className="text-center pt-4">
        <Button
          onClick={resetToDefault}
          variant="ghost"
          className="flex items-center space-x-2"
          disabled={currentFontSize === 16 && currentFontWeight === '400'}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset to Default</span>
        </Button>
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
              <Type className="mr-2 h-5 w-5" />
              Font & Text Settings
            </h3>
            <p className="text-sm text-text-secondary">Customize text size and weight for optimal readability</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              accessibilityRating.rating === 'Excellent' ? 'bg-green-100 text-green-800' :
              accessibilityRating.rating === 'Good' ? 'bg-blue-100 text-blue-800' :
              accessibilityRating.rating === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {accessibilityRating.icon} {accessibilityRating.rating}
            </span>
          </div>
        </div>

        <ContentComponent />
      </div>
    </Card>
  )
}

export default FontSizeSelector
