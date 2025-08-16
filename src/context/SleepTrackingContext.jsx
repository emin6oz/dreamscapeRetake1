// contexts/SleepTrackingContext.js - Fixed to match your utils
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { saveToStorage, getFromStorage } from '../utils/storage'
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../utils/constants'
import { formatTime12Hour, cleanupSleepData } from '../utils/timeUtils'

const SleepTrackingContext = createContext()

export const useSleepTrackingContext = () => {
  const context = useContext(SleepTrackingContext)
  if (!context) {
    throw new Error('useSleepTrackingContext must be used within SleepTrackingProvider')
  }
  return context
}

export const SleepTrackingProvider = ({ children }) => {
  // Basic state using your constants
  const [sleepTime, setSleepTime] = useState(DEFAULT_SETTINGS.sleepTime)
  const [wakeTime, setWakeTime] = useState(DEFAULT_SETTINGS.wakeTime)
  const [isTracking, setIsTracking] = useState(false)
  const [alarmSet, setAlarmSet] = useState(false)
  const [sleepData, setSleepData] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  // Refs for persistent data
  const alarmTimeoutRef = useRef(null)
  const sessionStartTimeRef = useRef(null)
  const wakeLockRef = useRef(null)
  const movementDataRef = useRef([])

  // Initialize data from localStorage using your storage utils
  useEffect(() => {
    try {
      const savedData = getFromStorage(STORAGE_KEYS.SLEEP_DATA)
      const savedSettings = getFromStorage(STORAGE_KEYS.SETTINGS)
      
      if (savedData) {
        // Clean up any data with ISO timestamps
        const cleanedData = cleanupSleepData(savedData)
        setSleepData(cleanedData)
        // Save the cleaned data back
        if (JSON.stringify(cleanedData) !== JSON.stringify(savedData)) {
          saveToStorage(STORAGE_KEYS.SLEEP_DATA, cleanedData)
        }
      }
      
      if (savedSettings) {
        setSettings(savedSettings)
        setSleepTime(savedSettings.sleepTime || DEFAULT_SETTINGS.sleepTime)
        setWakeTime(savedSettings.wakeTime || DEFAULT_SETTINGS.wakeTime)
      }

      // Check for active session
      const activeSession = getFromStorage('activeSleepSession')
      if (activeSession) {
        // Handle both ISO string and readable time formats
        const sessionStartTime = activeSession.startTime.includes('T') ? 
          new Date(activeSession.startTime) : 
          new Date(`${activeSession.date} ${activeSession.startTime}`)
        
        const timeSinceStart = Date.now() - sessionStartTime.getTime()
        
        // If less than 12 hours since start, recover session
        if (timeSinceStart < 12 * 60 * 60 * 1000) {
          setIsTracking(true)
          setAlarmSet(true)
          sessionStartTimeRef.current = sessionStartTime
          console.log('Recovered active sleep session')
        } else {
          // Clean up old session
          localStorage.removeItem('activeSleepSession')
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [])

  // Wake Lock API
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
        console.log('Wake lock acquired')
        return true
      }
    } catch (error) {
      console.error('Wake lock failed:', error)
    }
    return false
  }

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }

  // Save settings using your storage utils
  const saveSettings = () => {
    const settingsToSave = { ...settings, sleepTime, wakeTime }
    saveToStorage(STORAGE_KEYS.SETTINGS, settingsToSave)
  }

  // Start sleep tracking
  const startSleepTracking = async () => {
    try {
      console.log('Starting sleep tracking...')
      
      const startTime = new Date()
      sessionStartTimeRef.current = startTime
      
      const sleepSession = {
        id: Date.now(),
        date: startTime.toDateString(),
        startTime: startTime.toLocaleTimeString(), // Use readable time format
        sleepTime,
        wakeTime,
        isActive: true
      }

      // Save active session
      saveToStorage('activeSleepSession', sleepSession)
      
      // Update state
      setIsTracking(true)
      setAlarmSet(true)
      saveSettings()

      // Request wake lock
      await requestWakeLock()

      // Set up alarm
      const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number)
      const wakeUpTime = new Date()
      wakeUpTime.setHours(wakeHours, wakeMinutes, 0, 0)
      
      // If wake time is before current time, set for next day
      if (wakeUpTime <= new Date()) {
        wakeUpTime.setDate(wakeUpTime.getDate() + 1)
      }

      const timeUntilWake = wakeUpTime.getTime() - Date.now()
      
      if (timeUntilWake > 0) {
        alarmTimeoutRef.current = setTimeout(() => {
          completeSession(sleepSession)
        }, timeUntilWake)
        
        console.log(`Alarm set for ${Math.round(timeUntilWake / 1000 / 60)} minutes`)
      }

      // Show notification using your notification manager
      if (settings.notifications && 'Notification' in window) {
        try {
          new Notification('Sleep Tracking Started', {
            body: 'Sweet dreams! Your sleep is being tracked.',
            icon: '/icons/icon-192x192.png'
          })
        } catch (error) {
          console.log('Notification failed:', error)
        }
      }

      return true
    } catch (error) {
      console.error('Failed to start sleep tracking:', error)
      setIsTracking(false)
      setAlarmSet(false)
      throw error
    }
  }

  // Complete session (by alarm or manual stop)
  const completeSession = (sessionData = null) => {
    try {
      const endTime = new Date()
      const startTime = sessionStartTimeRef.current || new Date()
      
      // Get active session data
      const activeSession = sessionData || getFromStorage('activeSleepSession') || {}
      
      const completedSession = {
        ...activeSession,
        endTime: endTime.toLocaleTimeString(),
        actualWakeTime: endTime.toLocaleTimeString(),
        duration: Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10,
        movementData: movementDataRef.current || [],
        isActive: false
      }

      // Save to sleep data using your storage utils
      const updatedSleepData = [...sleepData, completedSession]
      setSleepData(updatedSleepData)
      saveToStorage(STORAGE_KEYS.SLEEP_DATA, updatedSleepData)
      
      // Clean up
      localStorage.removeItem('activeSleepSession')
      setIsTracking(false)
      setAlarmSet(false)
      releaseWakeLock()
      
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current)
        alarmTimeoutRef.current = null
      }

      console.log('Sleep session completed:', completedSession)
      
      // Show wake up notification
      if (settings.notifications && 'Notification' in window) {
        try {
          new Notification('Good Morning!', {
            body: 'Your sleep session is complete.',
            icon: '/icons/icon-192x192.png'
          })
        } catch (error) {
          console.log('Wake notification failed:', error)
        }
      }

      return completedSession
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  // Stop sleep tracking
  const stopSleepTracking = () => {
    console.log('Stopping sleep tracking...')
    completeSession()
  }

  // Calculate statistics
  const calculateStats = () => {
    try {
      if (!sleepData || sleepData.length === 0) return null

      const completedSessions = sleepData.filter(session => !session.isActive && session.duration > 0)
      if (completedSessions.length === 0) return null

      const totalSleep = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
      const averageSleep = totalSleep / completedSessions.length
      const lastWeekData = completedSessions.slice(-7)
      const weeklyAverage = lastWeekData.length > 0 
        ? lastWeekData.reduce((sum, session) => sum + (session.duration || 0), 0) / lastWeekData.length 
        : 0

      const durations = completedSessions.map(s => s.duration || 0)

      return {
        totalSessions: completedSessions.length,
        averageSleep: Math.round(averageSleep * 100) / 100,
        weeklyAverage: Math.round(weeklyAverage * 100) / 100,
        lastSleep: completedSessions.length > 0 ? Math.round(completedSessions[completedSessions.length - 1].duration * 100) / 100 : 0,
        totalHours: Math.round(totalSleep * 100) / 100,
        longestSleep: durations.length > 0 ? Math.round(Math.max(...durations) * 100) / 100 : 0,
        shortestSleep: durations.length > 0 ? Math.round(Math.min(...durations) * 100) / 100 : 0
      }
    } catch (error) {
      console.error('Error calculating stats:', error)
      return null
    }
  }

  // Update setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // Save immediately
    setTimeout(() => {
      const newSettings = { ...settings, [key]: value, sleepTime, wakeTime }
      saveToStorage(STORAGE_KEYS.SETTINGS, newSettings)
    }, 0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current)
      }
      releaseWakeLock()
    }
  }, [])

  const value = {
    sleepTime,
    setSleepTime,
    wakeTime,
    setWakeTime,
    isTracking,
    sleepData,
    alarmSet,
    settings,
    startSleepTracking,
    stopSleepTracking,
    calculateStats,
    updateSetting,
    saveSettings,
    formatTime12Hour
  }

  return (
    <SleepTrackingContext.Provider value={value}>
      {children}
    </SleepTrackingContext.Provider>
  )
}