import React from 'react'
import { User, Settings, Bell, Moon, Smartphone, LogOut, Info } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useSleepTracking from '../../hooks/useSleepTracking'
import Button from '../../components/common/Button'

const ProfileScreen = () => {
  const { user, logout } = useAuth()
  const { settings, updateSetting } = useSleepTracking()

  const handleToggleSetting = (key) => {
    updateSetting(key, !settings[key])
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  return (
    <div className="min-h-full bg-gray-900 text-white">
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-medium text-center mb-8">Profile</h1>
          
          {/* Profile Header */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-1">{user?.name || 'Sleep Tracker User'}</h2>
            <p className="text-gray-400 mb-2">{user?.email}</p>
            <p className="text-xs text-gray-500">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}
            </p>
          </div>

          {/* Settings Section */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Preferences</h3>
            
            {/* Notifications Toggle */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-blue-400 mr-3" />
                  <div>
                    <span className="font-medium">Notifications</span>
                    <p className="text-xs text-gray-400">Wake-up alerts and reminders</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('notifications')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.notifications ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </button>
              </div>
            </div>

            {/* Vibration Toggle */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 text-green-400 mr-3" />
                  <div>
                    <span className="font-medium">Vibration</span>
                    <p className="text-xs text-gray-400">Vibrate on wake-up</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('vibration')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.vibration ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.vibration ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </button>
              </div>
            </div>

            {/* Dark Mode Toggle - Now Working! */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Moon className="w-5 h-5 text-purple-400 mr-3" />
                  <div>
                    <span className="font-medium">Dark Mode</span>
                    <p className="text-xs text-gray-400">
                      {settings.darkMode ? 'Enabled for better sleep' : 'Tap to enable'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('darkMode')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.darkMode ? 'bg-purple-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </button>
              </div>
            </div>

            {/* Additional Setting - Sleep Reminders */}
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Moon className="w-5 h-5 text-yellow-400 mr-3" />
                  <div>
                    <span className="font-medium">Sleep Reminders</span>
                    <p className="text-xs text-gray-400">Remind me when it's bedtime</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting('sleepReminders')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.sleepReminders ? 'bg-yellow-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.sleepReminders ? 'translate-x-6' : 'translate-x-0.5'
                  } mt-0.5`} />
                </button>
              </div>
            </div>
          </div>

          {/* App Info Section */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">App Information</h3>
            
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center">
                <Info className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <span className="font-medium">Version</span>
                  <p className="text-xs text-gray-400">Sleep Tracker PWA v1.0.0</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <span className="font-medium">Storage</span>
                  <p className="text-xs text-gray-400">Local device storage only</p>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Settings Info */}
          <div className="bg-gray-700 rounded-xl p-3 mb-8 text-xs">
            <h4 className="font-medium text-gray-300 mb-2">Current Settings:</h4>
            <div className="space-y-1 text-gray-400">
              <p>• Notifications: {settings.notifications ? 'On' : 'Off'}</p>
              <p>• Vibration: {settings.vibration ? 'On' : 'Off'}</p>
              <p>• Dark Mode: {settings.darkMode ? 'On' : 'Off'}</p>
              <p>• Sleep Reminders: {settings.sleepReminders ? 'On' : 'Off'}</p>
            </div>
          </div>

          {/* Logout Button */}
          <div className="mb-8">
            <Button
              onClick={handleLogout}
              variant="danger"
              className="w-full"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center pb-4">
            <p className="text-gray-500 text-sm">Made with ❤️ for better sleep</p>
            <p className="text-gray-600 text-xs mt-1">
              Your privacy is protected - all data stays on your device
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileScreen