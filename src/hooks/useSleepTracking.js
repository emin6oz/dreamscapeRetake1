import { useState, useEffect, useRef } from 'react'
import { saveToStorage, getFromStorage } from '../utils/storage'
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants'

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
  }, [])

  // Save settings to storage
  const saveSettings = (newSettings = null) => {
    const settingsToSave = newSettings || { ...settings, sleepTime, wakeTime }
    setSettings(settingsToSave)
    saveToStorage(STORAGE_KEYS.SETTINGS, settingsToSave)
  }

  // Update individual setting
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value }
    saveSettings(newSettings)
  }

  // Movement tracking using accelerometer
  const startMovementTracking = () => {
    if (typeof DeviceMotionEvent !== 'undefined') {
      const handleMotion = (event) => {
        const acceleration = event.accelerationIncludingGravity
        if (acceleration) {
          const totalMovement = Math.sqrt(
            (acceleration.x || 0) ** 2 + 
            (acceleration.y || 0) ** 2 + 
            (acceleration.z || 0) ** 2
          )
          
          const timestamp = Date.now()
          movementRef.current.push({
            timestamp,
            movement: totalMovement,
            time: new Date(timestamp).toLocaleTimeString()
          })
          
          // Keep only last 8 hours of data
          if (movementRef.current.length > 2880) {
            movementRef.current = movementRef.current.slice(-2880)
          }
        }
      }

      window.addEventListener('devicemotion', handleMotion)
      
      // Update movement data every 10 seconds
      trackingIntervalRef.current = setInterval(() => {
        setMovementData([...movementRef.current])
      }, 10000)

      return () => {
        window.removeEventListener('devicemotion', handleMotion)
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current)
        }
      }
    }
  }

  // Start sleep tracking
  const startSleepTracking = () => {
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

    // Request motion permission if needed
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            startMovementTracking()
          }
        })
        .catch(console.error)
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
        movementData: [...movementRef.current],
        isActive: false
      }

      const updatedSleepData = [...sleepData, completedSession]
      setSleepData(updatedSleepData)
      saveToStorage(STORAGE_KEYS.SLEEP_DATA, updatedSleepData)
      
      setIsTracking(false)
      setAlarmSet(false)
      
      // Wake user with vibration and notification
      if (settings.vibration && navigator.vibrate) {
        navigator.vibrate([1000, 500, 1000, 500, 1000])
      }
      
      if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Good Morning! 🌅', {
          body: 'Time to wake up! Your sleep has been tracked.',
          icon: '/icons/icon-192x192.png'
        })
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
  }

  // Calculate sleep statistics
  const calculateStats = () => {
  if (sleepData.length === 0) return null

  const completedSessions = sleepData.filter(session => !session.isActive)
  const totalSleep = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  const averageSleep = totalSleep / completedSessions.length || 0
  const lastWeekData = completedSessions.slice(-7)
  const weeklyAverage = lastWeekData.reduce((sum, session) => sum + (session.duration || 0), 0) / lastWeekData.length || 0

  // Get all durations for min/max calculations
  const durations = completedSessions.map(s => s.duration || 0).filter(d => d > 0)
  
  return {
    totalSessions: completedSessions.length,
    averageSleep: Math.round(averageSleep * 100) / 100, // 2 decimal places
    weeklyAverage: Math.round(weeklyAverage * 100) / 100, // 2 decimal places
    lastSleep: Math.round((completedSessions[completedSessions.length - 1]?.duration || 0) * 100) / 100,
    totalHours: Math.round(totalSleep * 100) / 100,
    longestSleep: durations.length > 0 ? Math.round(Math.max(...durations) * 100) / 100 : 0,
    shortestSleep: durations.length > 0 ? Math.round(Math.min(...durations) * 100) / 100 : 0
  }
}

  // Request notification permission
  useEffect(() => {
    if (settings.notifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [settings.notifications])

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
    saveSettings
  }
}

export default useSleepTracking