// Update src/utils/notifications.js - Simple iOS-friendly version

export class NotificationManager {
  constructor() {
    this.permission = 'default'
    this.isIOS = this.detectIOS()
    this.isStandalone = this.checkStandaloneMode()
    this.checkPermission()
  }

  // Detect iOS device
  detectIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  }

  // Check if running as PWA
  checkStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true
  }

  // Check current notification permission
  checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission
    }
    return this.permission
  }

  // Request notification permission with iOS handling
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      if (this.isIOS) {
        this.showIOSHelp()
      }
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      
      if (permission === 'denied' && this.isIOS) {
        this.showIOSHelp()
      }
      
      return permission === 'granted'
    } catch (error) {
      console.error('Permission request failed:', error)
      return false
    }
  }

  // Show iOS-specific help
  showIOSHelp() {
    const isInstalled = this.isStandalone
    
    const helpMessage = isInstalled ? 
      `To enable notifications on iOS:
      
1. Go to iPhone Settings
2. Scroll down to "Sleep Tracker"
3. Tap "Notifications"
4. Turn ON "Allow Notifications"
5. Restart the app` :
      `For best experience on iOS:
      
1. Tap the Share button (📤)
2. Select "Add to Home Screen"
3. Open app from home screen
4. Allow notifications when prompted`

    alert(helpMessage)
  }

  // Show notification with iOS optimization
  showNotification(title, options = {}) {
    if (this.permission !== 'granted') {
      // Show fallback notification for iOS
      return this.showFallbackNotification(title, options.body)
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      // iOS prefers simpler options
      vibrate: this.isIOS ? [200] : [200, 100, 200],
      requireInteraction: this.isIOS ? true : options.requireInteraction,
      silent: false,
      ...options
    }

    try {
      const notification = new Notification(title, defaultOptions)
      
      notification.onclick = () => {
        window.focus()
        notification.close()
        if (options.onClick) {
          options.onClick()
        }
      }

      // Auto close for iOS (they can stick around)
      if (this.isIOS && !defaultOptions.requireInteraction) {
        setTimeout(() => notification.close(), 6000)
      }

      return notification
    } catch (error) {
      console.error('Notification failed:', error)
      return this.showFallbackNotification(title, options.body)
    }
  }

  // Fallback notification that works on all iOS devices
  showFallbackNotification(title, body) {
    // Create a visual notification overlay
    const notification = document.createElement('div')
    notification.className = 'fallback-notification'
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🌙</div>
        <div class="notification-text">
          <div class="notification-title">${title}</div>
          <div class="notification-body">${body || ''}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `

    // Add inline styles (works without external CSS)
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #1f2937, #374151);
      color: white;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      transform: translateY(-100px);
      opacity: 0;
      transition: all 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `

    notification.querySelector('.notification-content').style.cssText = `
      display: flex;
      align-items: center;
      position: relative;
    `

    notification.querySelector('.notification-icon').style.cssText = `
      font-size: 24px;
      margin-right: 12px;
      flex-shrink: 0;
    `

    notification.querySelector('.notification-text').style.cssText = `
      flex: 1;
    `

    notification.querySelector('.notification-title').style.cssText = `
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 4px;
    `

    notification.querySelector('.notification-body').style.cssText = `
      font-size: 14px;
      opacity: 0.9;
      line-height: 1.4;
    `

    notification.querySelector('.notification-close').style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateY(0)'
      notification.style.opacity = '1'
    }, 10)

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.transform = 'translateY(-100px)'
        notification.style.opacity = '0'
        setTimeout(() => notification.remove(), 300)
      }
    }, 5000)

    return notification
  }

  // Wake up notification optimized for iOS
  showWakeUpNotification() {
    const title = 'Good Morning!'
    const body = 'Time to wake up! Your sleep has been tracked.'
    
    const notification = this.showNotification(title, {
      body,
      tag: 'wake-up',
      requireInteraction: true,
      vibrate: this.isIOS ? [400] : [1000, 500, 1000]
    })

    // Additional wake-up effects for iOS
    if (this.isIOS) {
      this.flashScreen()
      // Try to play a sound
      this.playWakeUpSound()
    }

    return notification
  }

  // Bedtime reminder for iOS
  showBedtimeReminder(bedtime) {
    const title = 'Bedtime Reminder'
    const body = `Time to prepare for bed! Bedtime: ${bedtime}`
    
    return this.showNotification(title, {
      body,
      tag: 'bedtime-reminder',
      requireInteraction: false,
      vibrate: this.isIOS ? [200] : [200, 100, 200]
    })
  }

  // Flash screen for additional wake-up effect
  flashScreen() {
    const flash = document.createElement('div')
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      z-index: 9998;
      pointer-events: none;
      opacity: 0;
    `

    document.body.appendChild(flash)

    // Flash animation
    flash.style.opacity = '1'
    setTimeout(() => flash.style.opacity = '0', 200)
    setTimeout(() => flash.style.opacity = '1', 400)
    setTimeout(() => flash.style.opacity = '0', 600)
    setTimeout(() => flash.remove(), 800)
  }

  // Try to play wake-up sound
  playWakeUpSound() {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)

      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Audio wake-up not available')
    }
  }
}

export class VibrationManager {
  constructor() {
    this.isSupported = 'vibrate' in navigator
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  }

  isVibrationSupported() {
    return this.isSupported
  }

  vibrate(pattern = 200) {
    if (!this.isSupported) {
      // Flash screen as fallback
      this.flashScreen()
      return false
    }

    try {
      // iOS only supports simple patterns
      if (this.isIOS) {
        const simplePattern = Array.isArray(pattern) ? pattern[0] : pattern
        navigator.vibrate(Math.min(simplePattern, 1000))
      } else {
        navigator.vibrate(pattern)
      }
      return true
    } catch (error) {
      console.error('Vibration error:', error)
      this.flashScreen()
      return false
    }
  }

  // Screen flash fallback
  flashScreen() {
    const flash = document.createElement('div')
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(59, 130, 246, 0.3);
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s ease;
    `

    document.body.appendChild(flash)
    
    setTimeout(() => flash.style.opacity = '1', 10)
    setTimeout(() => flash.style.opacity = '0', 150)
    setTimeout(() => flash.remove(), 250)
  }

  // iOS-optimized wake up vibration
  wakeUpVibration() {
    if (this.isIOS) {
      // Sequence of simple vibrations for iOS
      this.vibrate(400)
      setTimeout(() => this.vibrate(400), 600)
      setTimeout(() => this.vibrate(400), 1200)
    } else {
      this.vibrate([400, 200, 400, 200, 400])
    }
  }

  notificationVibration() {
    this.vibrate(this.isIOS ? 200 : [200, 100, 200])
  }

  stopVibration() {
    if (this.isSupported) {
      navigator.vibrate(0)
    }
  }
}

// Create singleton instances
export const notificationManager = new NotificationManager()
export const vibrationManager = new VibrationManager()