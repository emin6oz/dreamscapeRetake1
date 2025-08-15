// Updated useSleepTracking.js - Fixed movement tracking

import { useState, useEffect, useRef } from 'react'
import { saveToStorage, getFromStorage } from '../utils/storage'
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants'
import { notificationManager, vibrationManager } from '../utils/notifications'

const useSleepTracking = () => {
  const [sleepTime, setSleepTime] = useState(DEFAULT_SETTINGS.sleepTime)
  const [wakeTime, setWakeTime] = useState(DEFAULT_SETTINGS.wakeTime)
  const [isTracking, setIsTracking] = useState(false)
  const [sleepData, setSleepData] = useState([])
  const [movementData, setMovementData] = useState([])
  const [alarmSet, setAlarmSet] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  
  const movementRef = useRef([])
  const trackingIntervalRef = useRef(null)
  const alarmTimeoutRef = useRef(null)
  const bedtimeReminderRef = useRef(null)
  
  // NEW: Movement sampling variables
  const lastSampleTimeRef = useRef(0)
  const currentMovementRef = useRef(0)
  const movementSamplesRef = useRef([])

  // SAMPLING CONFIGURATION
  const SAMPLE_INTERVAL = 30000 // Sample every 30 seconds instead of 60 times per second
  const MOVEMENT_THRESHOLD = 0.5 // Threshold for detecting significant movement
  const RESTLESS_THRESHOLD = 2.0 // Higher threshold for "restless" periods

  // Load data from storage on mount
  useEffect(() => {
    const savedSleepData = getFromStorage(STORAGE_KEYS.SLEEP_DATA)
    const savedSettings = getFromStorage(STORAGE_KEYS.SETTINGS)
    
    if (savedSleepData) {
      setSleepData(savedSleepData)
    }
    
    if (savedSettings) {
      setSettings(savedSettings)
      setSleepTime(savedSettings.sleepTime || DEFAULT_SETTINGS.sleepTime)
      setWakeTime(savedSettings.wakeTime || DEFAULT_SETTINGS.wakeTime)
    }

    // Request notification permission
    if (savedSettings?.notifications !== false) {
      notificationManager.requestPermission()
    }
  }, [])

  // Set up bedtime reminders
  useEffect(() => {
    if (settings.sleepReminders && settings.notifications) {
      setupBedtimeReminder()
    } else {
      clearBedtimeReminder()
    }

    return () => clearBedtimeReminder()
  }, [settings.sleepReminders, settings.notifications, sleepTime])

  // Setup bedtime reminder
  const setupBedtimeReminder = () => {
    clearBedtimeReminder()

    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date()
    
    // Set reminder 30 minutes before bedtime
    reminderTime.setHours(sleepHours, sleepMinutes - 30, 0, 0)
    
    // If reminder time has passed today, set for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1)
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime()

    bedtimeReminderRef.current = setTimeout(() => {
      if (settings.notifications) {
        notificationManager.showBedtimeReminder(formatTime12Hour(sleepTime))
      }
      if (settings.vibration) {
        vibrationManager.notificationVibration()
      }
      
      // Set up next day's reminder
      setupBedtimeReminder()
    }, timeUntilReminder)
  }

  // Clear bedtime reminder
  const clearBedtimeReminder = () => {
    if (bedtimeReminderRef.current) {
      clearTimeout(bedtimeReminderRef.current)
      bedtimeReminderRef.current = null
    }
  }

  // Format time to 12-hour format
  const formatTime12Hour = (timeStr) => {
    if (timeStr === '00:00') return '12:00 AM'
    
    try {
      return new Date(`2024-01-01T${timeStr}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      return timeStr
    }
  }

  // Save settings to storage
  const saveSettings = (newSettings = null) => {
    const settingsToSave = newSettings || { ...settings, sleepTime, wakeTime }
    setSettings(settingsToSave)
    saveToStorage(STORAGE_KEYS.SETTINGS, settingsToSave)
  }

  // Update individual setting
  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    
    // Handle notification permission
    if (key === 'notifications' && value === true) {
      const granted = await notificationManager.requestPermission()
      if (!granted) {
        alert('Notification permission is required for alerts. Please enable it in your browser settings.')
        return
      }
    }

    // Test vibration when enabled
    if (key === 'vibration' && value === true) {
      if (vibrationManager.isVibrationSupported()) {
        vibrationManager.notificationVibration()
      } else {
        alert('Vibration is not supported on this device.')
      }
    }

    saveSettings(newSettings)
  }

  // FIXED: Movement tracking with proper sampling
  const startMovementTracking = () => {
    if (typeof DeviceMotionEvent !== 'undefined') {
      // Reset tracking variables
      lastSampleTimeRef.current = Date.now()
      movementSamplesRef.current = []
      currentMovementRef.current = 0
      
      const handleMotion = (event) => {
        const acceleration = event.accelerationIncludingGravity
        if (acceleration) {
          const totalMovement = Math.sqrt(
            (acceleration.x || 0) ** 2 + 
            (acceleration.y || 0) ** 2 + 
            (acceleration.z || 0) ** 2
          )
          
          // Store current movement value (but don't add to array yet)
          currentMovementRef.current = totalMovement
        }
      }

      // Sample movement data at regular intervals instead of every motion event
      const sampleMovement = () => {
        const now = Date.now()
        const movement = currentMovementRef.current
        
        // Determine movement intensity
        let intensity = 'calm'
        if (movement > RESTLESS_THRESHOLD) {
          intensity = 'restless'
        } else if (movement > MOVEMENT_THRESHOLD) {
          intensity = 'light'
        }
        
        const sample = {
          timestamp: now,
          movement: Math.round(movement * 100) / 100, // Round to 2 decimal places
          intensity,
          time: new Date(now).toLocaleTimeString()
        }
        
        movementSamplesRef.current.push(sample)
        
        // Keep only last 8 hours of samples (at 30-second intervals)
        // 8 hours = 8 * 60 * 2 = 960 samples
        if (movementSamplesRef.current.length > 960) {
          movementSamplesRef.current = movementSamplesRef.current.slice(-960)
        }
        
        console.log(`Movement sample: ${movement.toFixed(2)} (${intensity}) - Total samples: ${movementSamplesRef.current.length}`)
      }

      window.addEventListener('devicemotion', handleMotion)
      
      // Sample movement data every 30 seconds instead of every motion event
      const sampleInterval = setInterval(sampleMovement, SAMPLE_INTERVAL)
      
      // Update React state every minute (less frequent updates)
      trackingIntervalRef.current = setInterval(() => {
        setMovementData([...movementSamplesRef.current])
      }, 60000) // Update UI every minute

      return () => {
        window.removeEventListener('devicemotion', handleMotion)
        clearInterval(sampleInterval)
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current)
        }
      }
    }
  }

  // Start sleep tracking
  const startSleepTracking = async () => {
    setIsTracking(true)
    setAlarmSet(true)
    saveSettings()
    
    const startTime = new Date()
    const sleepSession = {
      id: Date.now(),
      date: startTime.toDateString(),
      startTime: startTime.toLocaleTimeString(),
      sleepTime,
      wakeTime,
      isActive: true
    }

    // Show tracking started notification
    if (settings.notifications) {
      notificationManager.showSleepTrackingStarted()
    }

    // Gentle vibration when starting
    if (settings.vibration) {
      vibrationManager.notificationVibration()
    }

    // Request motion permission if needed
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission()
        if (response === 'granted') {
          startMovementTracking()
        }
      } catch (error) {
        console.error('Motion permission error:', error)
      }
    } else {
      startMovementTracking()
    }

    // Set wake-up alarm
    const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number)
    const wakeUpTime = new Date()
    wakeUpTime.setHours(wakeHours, wakeMinutes, 0, 0)
    
    if (wakeUpTime <= new Date()) {
      wakeUpTime.setDate(wakeUpTime.getDate() + 1)
    }

    const timeUntilWake = wakeUpTime.getTime() - Date.now()
    
    alarmTimeoutRef.current = setTimeout(() => {
      const endTime = new Date()
      const completedSession = {
        ...sleepSession,
        endTime: endTime.toLocaleTimeString(),
        actualWakeTime: endTime.toLocaleTimeString(),
        duration: Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10,
        movementData: [...movementSamplesRef.current], // Use sampled data
        isActive: false
      }

      const updatedSleepData = [...sleepData, completedSession]
      setSleepData(updatedSleepData)
      saveToStorage(STORAGE_KEYS.SLEEP_DATA, updatedSleepData)
      
      setIsTracking(false)
      setAlarmSet(false)
      
      // Wake user with vibration and notification
      if (settings.vibration) {
        vibrationManager.wakeUpVibration()
      }
      
      if (settings.notifications) {
        notificationManager.showWakeUpNotification()
      }

      // Fallback audio alert (optional)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAAB...')
        audio.play()
      } catch (error) {
        console.log('Audio alert not available')
      }
    }, timeUntilWake)
  }

  // Stop sleep tracking
  const stopSleepTracking = () => {
    setIsTracking(false)
    setAlarmSet(false)
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
    }

    if (alarmTimeoutRef.current) {
      clearTimeout(alarmTimeoutRef.current)
    }

    // Stop any ongoing vibrations
    vibrationManager.stopVibration()
  }

  // Calculate sleep statistics
  const calculateStats = () => {
    if (sleepData.length === 0) return null

    const completedSessions = sleepData.filter(session => !session.isActive)
    const totalSleep = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const averageSleep = totalSleep / completedSessions.length || 0
    const lastWeekData = completedSessions.slice(-7)
    const weeklyAverage = lastWeekData.reduce((sum, session) => sum + (session.duration || 0), 0) / lastWeekData.length || 0

    const durations = completedSessions.map(s => s.duration || 0).filter(d => d > 0)

    return {
      totalSessions: completedSessions.length,
      averageSleep: Math.round(averageSleep * 100) / 100,
      weeklyAverage: Math.round(weeklyAverage * 100) / 100,
      lastSleep: Math.round((completedSessions[completedSessions.length - 1]?.duration || 0) * 100) / 100,
      totalHours: Math.round(totalSleep * 100) / 100,
      longestSleep: durations.length > 0 ? Math.round(Math.max(...durations) * 100) / 100 : 0,
      shortestSleep: durations.length > 0 ? Math.round(Math.min(...durations) * 100) / 100 : 0
    }
  }

  return {
    sleepTime,
    setSleepTime,
    wakeTime,
    setWakeTime,
    isTracking,
    sleepData,
    movementData,
    alarmSet,
    settings,
    startSleepTracking,
    stopSleepTracking,
    calculateStats,
    updateSetting,
    saveSettings,
    // Expose notification and vibration managers for manual testing
    testNotification: () => notificationManager.showNotification('Test Notification', { body: 'This is a test!' }),
    testVibration: () => vibrationManager.notificationVibration()
  }
}

export default useSleepTracking