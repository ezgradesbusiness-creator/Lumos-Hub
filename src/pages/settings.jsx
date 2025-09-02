// src/pages/settings.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon,
  User,
  Palette,
  Volume2,
  Type,
  Shield,
  Bell,
  Download,
  Trash2,
  ArrowLeft,
  Save,
  RefreshCw
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ThemeSwitcher from '@/components/Settings/ThemeSwitcher'
import VolumeControl from '@/components/Settings/VolumeControl'
import FontSizeSelector from '@/components/Settings/FontSizeSelector'
import Button from '@/components/UI/Button'
import Card from '@/components/UI/Card'
import { useUser } from '@/context/UserContext'
import { useNotifications } from '@/components/UI/Notification'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { user, updateProfile, resetSettings, exportUserData, signOut } = useUser()
  const { success, error } = useNotifications()
  const [activeSection, setActiveSection] = useState('appearance')
  const [isSaving, setIsSaving] = useState(false)

  const settingsSections = [
    {
      id: 'profile',
      name: 'Profile',
      description: 'Personal information and account settings',
      icon: User,
      component: ProfileSettings
    },
    {
      id: 'appearance',
      name: 'Appearance',
      description: 'Themes, colors, and visual preferences',
      icon: Palette,
      component: AppearanceSettings
    },
    {
      id: 'audio',
      name: 'Audio & Sound',
      description: 'Volume controls and sound preferences',
      icon: Volume2,
      component: AudioSettings
    },
    {
      id: 'accessibility',
      name: 'Accessibility',
      description: 'Font size, contrast, and accessibility options',
      icon: Type,
      component: AccessibilitySettings
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Alert preferences and notification settings',
      icon: Bell,
      component: NotificationSettings
    },
    {
      id: 'privacy',
      name: 'Privacy & Data',
      description: 'Privacy settings and data management',
      icon: Shield,
      component: PrivacySettings
    }
  ]

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      // Settings are automatically saved through UserContext
      // This is just for user feedback
      await new Promise(resolve => setTimeout(resolve, 1000))
      success('Settings saved successfully!')
    } catch (err) {
      error('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = () => {
    if (window.confirm('This will reset all settings to their defaults. Are you sure?')) {
      resetSettings()
      success('Settings reset to defaults')
    }
  }

  const handleExportData = () => {
    try {
      exportUserData()
      success('Data exported successfully!')
    } catch (err) {
      error('Failed to export data. Please try again.')
    }
  }

  const ActiveComponent = settingsSections.find(section => section.id === activeSection)?.component

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-background to-surface">
      {/* Header */}
      <div className="border-b border-card-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              <div className="h-6 w-px bg-card-border" />
              
              <h1 className="text-xl font-semibold text-text flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                Settings
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSaveSettings}
                loading={isSaving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="font-semibold text-text mb-4">Settings Categories</h2>
                
                <nav className="space-y-2">
                  {settingsSections.map(section => {
                    const IconComponent = section.icon
                    const isActive = activeSection === section.id
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-text-secondary hover:bg-background hover:text-text'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{section.name}</p>
                          <p className={`text-xs truncate ${
                            isActive ? 'text-white/80' : 'text-text-secondary'
                          }`}>
                            {section.description}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </nav>

                {/* Quick Actions */}
                <div className="mt-8 pt-6 border-t border-card-border space-y-2">
                  <Button
                    onClick={handleExportData}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  
                  <Button
                    onClick={handleResetSettings}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-yellow-600 hover:text-yellow-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {ActiveComponent && <ActiveComponent />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Section Components

const ProfileSettings = () => {
  const { user, updateProfile } = useUser()
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const handleSave = async () => {
    try {
      await updateProfile(profileData)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-text mb-6">Profile Information</h3>
        
        <div className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-4">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
            <div>
              <Button size="sm" variant="outline">Change Avatar</Button>
              <p className="text-xs text-text-secondary mt-1">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={!user?.isGuest}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Bio
            </label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Timezone
            </label>
            <select
              value={profileData.timezone}
              onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-card-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Kolkata">Mumbai</option>
            </select>
          </div>

          <Button onClick={handleSave}>
            Save Profile Changes
          </Button>
        </div>
      </div>
    </Card>
  )
}

const AppearanceSettings = () => (
  <ThemeSwitcher />
)

const AudioSettings = () => (
  <VolumeControl />
)

const AccessibilitySettings = () => (
  <FontSizeSelector />
)

const NotificationSettings = () => {
  const { settings, updateSettings } = useUser()

  const notificationTypes = [
    {
      key: 'browserNotifications',
      name: 'Browser Notifications',
      description: 'Show desktop notifications for important events'
    },
    {
      key: 'studyReminders',
      name: 'Study Reminders',
      description: 'Remind you to start your planned study sessions'
    },
    {
      key: 'achievementAlerts',
      name: 'Achievement Alerts',
      description: 'Notify when you unlock new achievements'
    },
    {
      key: 'weeklyReports',
      name: 'Weekly Reports',
      description: 'Send weekly progress summaries via email'
    }
  ]

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-text mb-6">Notification Preferences</h3>
        
        <div className="space-y-6">
          {notificationTypes.map(notification => (
            <div key={notification.key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-text">{notification.name}</h4>
                <p className="text-sm text-text-secondary">{notification.description}</p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.[notification.key] || false}
                  onChange={(e) => updateSettings({ [notification.key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-card-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

const PrivacySettings = () => {
  const { user, signOut } = useUser()

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-text mb-6">Privacy & Data</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-text mb-4">Account Status</h4>
            <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-text">
                {user?.isGuest ? 'Guest Account' : 'Registered Account'}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-text mb-4">Data Management</h4>
            <div className="space-y-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
              
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Data
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-card-border">
            <h4 className="font-medium text-text mb-4">Account Actions</h4>
            <Button
              onClick={() => {
                if (window.confirm('Are you sure you want to sign out?')) {
                  signOut()
                }
              }}
              variant="outline"
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default SettingsPage
