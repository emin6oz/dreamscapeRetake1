// Create src/components/ui/IOSInstallPrompt.jsx

import React, { useState, useEffect } from 'react'
import { Smartphone, Download, Bell, X } from 'lucide-react'
import Button from '../common/Button'

const IOSInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const checkIOSAndStandalone = () => {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true

      setIsIOS(iOS)
      setIsStandalone(standalone)

      // Show prompt if iOS but not installed as PWA
      const hasSeenPrompt = localStorage.getItem('ios-install-prompt-seen')
      if (iOS && !standalone && !hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000) // Show after 3 seconds
      }
    }

    checkIOSAndStandalone()
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('ios-install-prompt-seen', 'true')
  }

  const handleInstallLater = () => {
    setShowPrompt(false)
    // Don't mark as seen permanently, show again later
  }

  if (!showPrompt || !isIOS || isStandalone) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-gray-800 rounded-t-3xl p-6 w-full max-w-md mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Install Sleep Tracker</h3>
              <p className="text-gray-400 text-sm">Get the full app experience</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center text-green-400">
            <Bell className="w-5 h-5 mr-3" />
            <span className="text-sm">Better notification support</span>
          </div>
          <div className="flex items-center text-blue-400">
            <Download className="w-5 h-5 mr-3" />
            <span className="text-sm">Works offline</span>
          </div>
          <div className="flex items-center text-purple-400">
            <Smartphone className="w-5 h-5 mr-3" />
            <span className="text-sm">Native app experience</span>
          </div>
        </div>

        <div className="bg-gray-700 rounded-xl p-4 mb-6">
          <h4 className="font-medium text-white mb-3">How to install:</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-3">1</span>
              <span>Tap the Share button (📤) at the bottom</span>
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-3">2</span>
              <span>Select "Add to Home Screen"</span>
            </div>
            <div className="flex items-center">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs mr-3">3</span>
              <span>Tap "Add" to install</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleInstallLater}
            variant="ghost"
            className="w-full"
          >
            Later
          </Button>
          <Button
            onClick={handleDismiss}
            className="w-full"
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  )
}

export default IOSInstallPrompt