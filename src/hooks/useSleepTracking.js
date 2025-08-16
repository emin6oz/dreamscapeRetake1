// useSleepTracking.js with persistent tracking state

import { useState, useEffect, useRef } from 'react'
import { openDB } from 'idb'
import { DEFAULT_SETTINGS } from '../utils/constants'
import { notificationManager, vibrationManager } from '../utils/notifications'

// IndexedDB config
const DB_NAME = 'sleepTrackerDB'
const DB_VERSION = 1
const STORE_NAMES = {
  SESSIONS: 'sessions',
  MOVEMENT: 'movement',
  SETTINGS: 'settings',
  ACTIVE: 'activeSession'
}

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAMES.SESSIONS)) {
        db.createObjectStore(STORE_NAMES.SESSIONS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.MOVEMENT)) {
        db.createObjectStore(STORE_NAMES.MOVEMENT, { keyPath: 'timestamp' })
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
        db.createObjectStore(STORE_NAMES.SETTINGS)
      }
      if (!db.objectStoreNames.contains(STORE_NAMES.ACTIVE)) {
        db.createObjectStore(STORE_NAMES.ACTIVE)
      }
    }
  })
}

// IndexedDB helpers
async function saveItem(store, value, key) {
  const db = await initDB()
  return db.put(store, value, key)
}

async function getItem(store, key) {
  const db = await initDB()
  return db.get(store, key)
}

async function getAll(store) {
  const db = await initDB()
  return db.getAll(store)
}

async function deleteItem(store, key) {
  const db = await initDB()
  return db.delete(store, key)
}

async function clearStore(store) {
  const db = await initDB()
  return db.clear(store)
}

const useSleepTracking = () => {
  const [sleepTime, setSleepTime] = useState(DEFAULT_SETTINGS.sleepTime)
  const [wakeTime, setWakeTime] = useState(DEFAULT_SETTINGS.wakeTime)
  const [isTracking, setIsTracking] = useState(false)
  const [sleepData, setSleepData] = useState([])
  const [movementData, setMovementData] = useState([])
  const [alarmSet, setAlarmSet] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const trackingIntervalRef = useRef(null)
  const alarmTimeoutRef = useRef(null)
  const bedtimeReminderRef = useRef(null)
  const motionCleanupRef = useRef(null)
  const sessionStartTimeRef = useRef(null)

  const currentMovementRef = useRef(0)
  const movementSamplesRef = useRef([])

  const SAMPLE_INTERVAL = 30000
  const MOVEMENT_THRESHOLD = 0.5
  const RESTLESS_THRESHOLD = 2.0

  // Load saved sessions and settings
  useEffect(() => {
    (async () => {
      const savedSleepData = await getAll(STORE_NAMES.SESSIONS)
      const savedSettings = await getItem(STORE_NAMES.SETTINGS, 'settings')

      if (savedSleepData?.length) setSleepData(savedSleepData)
      if (savedSettings) {
        setSettings(savedSettings)
        setSleepTime(savedSettings.sleepTime || DEFAULT_SETTINGS.sleepTime)
        setWakeTime(savedSettings.wakeTime || DEFAULT_SETTINGS.wakeTime)
      }

      if (savedSettings?.notifications !== false) {
        notificationManager.requestPermission()
      }
    })()
  }, [])

  // Always attempt to recover an active session whenever the hook mounts
  useEffect(() => {
    recoverActiveSession()
  }, [])

  const recoverActiveSession = async () => {
    const activeSession = await getItem(STORE_NAMES.ACTIVE, 'active')
    if (activeSession?.isActive) {
      const now = Date.now()
      const sessionStart = new Date(activeSession.sessionStartTime).getTime()
      const timeSinceStart = now - sessionStart

      if (timeSinceStart < 12 * 60 * 60 * 1000) {
        setIsTracking(true)
        setAlarmSet(true)
        sessionStartTimeRef.current = new Date(sessionStart)
        startMovementTracking()

        const [wakeHours, wakeMinutes] = (activeSession.wakeTime || wakeTime).split(':').map(Number)
        const wakeUpTime = new Date()
        wakeUpTime.setHours(wakeHours, wakeMinutes, 0, 0)
        if (wakeUpTime <= new Date()) wakeUpTime.setDate(wakeUpTime.getDate() + 1)

        const timeUntilWake = wakeUpTime.getTime() - now
        if (timeUntilWake > 0) {
          alarmTimeoutRef.current = setTimeout(() => completeSession(activeSession), timeUntilWake)
        }

        const savedMovement = await getAll(STORE_NAMES.MOVEMENT)
        if (savedMovement.length) {
          movementSamplesRef.current = savedMovement
          setMovementData(savedMovement)
        }

        return true
      } else {
        await clearStore(STORE_NAMES.ACTIVE)
      }
    }
    return false
  }

  // Bedtime reminder
  useEffect(() => {
    if (settings.sleepReminders && settings.notifications) setupBedtimeReminder()
    else clearBedtimeReminder()
    return () => clearBedtimeReminder()
  }, [settings.sleepReminders, settings.notifications, sleepTime])

  const setupBedtimeReminder = () => {
    clearBedtimeReminder()
    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number)
    const now = new Date()
    const reminderTime = new Date()
    reminderTime.setHours(sleepHours, sleepMinutes, 0, 0)
    reminderTime.setTime(reminderTime.getTime() - 30 * 60000)
    if (reminderTime <= now) reminderTime.setDate(reminderTime.getDate() + 1)

    const timeUntilReminder = reminderTime.getTime() - now.getTime()
    bedtimeReminderRef.current = setTimeout(() => {
      if (settings.notifications) notificationManager.showBedtimeReminder(formatTime12Hour(sleepTime))
      if (settings.vibration) vibrationManager.notificationVibration()
      setupBedtimeReminder()
    }, timeUntilReminder)
  }

  const clearBedtimeReminder = () => {
    if (bedtimeReminderRef.current) {
      clearTimeout(bedtimeReminderRef.current)
      bedtimeReminderRef.current = null
    }
  }

  const formatTime12Hour = (timeStr) => {
    try {
      return new Date(`2024-01-01T${timeStr}:00`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeStr
    }
  }

  const saveSettings = async (newSettings = null) => {
    const settingsToSave = newSettings || { ...settings, sleepTime, wakeTime }
    setSettings(settingsToSave)
    await saveItem(STORE_NAMES.SETTINGS, settingsToSave, 'settings')
  }

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    if (key === 'notifications' && value === true) {
      const granted = await notificationManager.requestPermission()
      if (!granted) return alert('Enable notifications in browser settings.')
    }
    if (key === 'vibration' && value === true) {
      if (vibrationManager.isVibrationSupported()) vibrationManager.notificationVibration()
      else alert('Vibration not supported.')
    }
    await saveSettings(newSettings)
  }

  const startMovementTracking = () => {
    if (motionCleanupRef.current) motionCleanupRef.current()

    if (typeof DeviceMotionEvent !== 'undefined') {
      currentMovementRef.current = 0
      movementSamplesRef.current = []

      const handleMotion = (event) => {
        const acc = event.accelerationIncludingGravity
        if (acc) currentMovementRef.current = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2)
      }

      const sampleMovement = async () => {
        const now = Date.now()
        const movement = currentMovementRef.current
        let intensity = 'calm'
        if (movement > RESTLESS_THRESHOLD) intensity = 'restless'
        else if (movement > MOVEMENT_THRESHOLD) intensity = 'light'

        const sample = { timestamp: now, movement: Math.round(movement * 100) / 100, intensity, time: new Date(now).toLocaleTimeString() }
        movementSamplesRef.current.push(sample)
        if (movementSamplesRef.current.length > 960) movementSamplesRef.current = movementSamplesRef.current.slice(-960)
        await saveItem(STORE_NAMES.MOVEMENT, sample, sample.timestamp)
      }

      window.addEventListener('devicemotion', handleMotion)
      const sampleInterval = setInterval(sampleMovement, SAMPLE_INTERVAL)
      trackingIntervalRef.current = setInterval(() => setMovementData(() => [...movementSamplesRef.current]), 60000)

      motionCleanupRef.current = () => {
        window.removeEventListener('devicemotion', handleMotion)
        clearInterval(sampleInterval)
        if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current)
      }
    }
  }

  const completeSession = async (sessionData) => {
    const endTime = new Date()
    const startTime = sessionStartTimeRef.current || new Date()
    const duration = Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10

    const completedSession = { ...sessionData, endTime: endTime.toISOString(), actualWakeTime: endTime.toISOString(), duration, movementData: [...movementSamplesRef.current], isActive: false }
    await saveItem(STORE_NAMES.SESSIONS, completedSession)
    setSleepData(prev => [...prev, completedSession])

    setIsTracking(false)
    setAlarmSet(false)
    await clearStore(STORE_NAMES.ACTIVE)
    await clearStore(STORE_NAMES.MOVEMENT)

    if (motionCleanupRef.current) motionCleanupRef.current()
    if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current)

    if (settings.vibration) vibrationManager.wakeUpVibration()
    if (settings.notifications) notificationManager.showWakeUpNotification()
  }

  const startSleepTracking = async () => {
    try {
      setIsTracking(true)
      setAlarmSet(true)
      await saveSettings()

      const startTime = new Date()
      sessionStartTimeRef.current = startTime
      const sleepSession = { id: Date.now(), date: startTime.toDateString(), startTime: startTime.toISOString(), sessionStartTime: startTime.toISOString(), sleepTime, wakeTime, isActive: true }

      await saveItem(STORE_NAMES.ACTIVE, sleepSession, 'active')
      if (settings.notifications) notificationManager.showSleepTrackingStarted()
      if (settings.vibration) vibrationManager.notificationVibration()

      if (typeof DeviceMotionEvent?.requestPermission === 'function') {
        try {
          const response = await DeviceMotionEvent.requestPermission()
          if (response === 'granted') startMovementTracking()
        } catch (err) { console.error('Motion permission error:', err) }
      } else startMovementTracking()

      const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number)
      const wakeUpTime = new Date()
      wakeUpTime.setHours(wakeHours, wakeMinutes, 0, 0)
      if (wakeUpTime <= new Date()) wakeUpTime.setDate(wakeUpTime.getDate() + 1)

      const timeUntilWake = wakeUpTime.getTime() - Date.now()
      if (timeUntilWake > 0) alarmTimeoutRef.current = setTimeout(() => completeSession(sleepSession), timeUntilWake)
    } catch (error) {
      setIsTracking(false)
      setAlarmSet(false)
      await clearStore(STORE_NAMES.ACTIVE)
      throw error
    }
  }

  const stopSleepTracking = async () => {
    const activeSession = await getItem(STORE_NAMES.ACTIVE, 'active')
    if (activeSession) await completeSession(activeSession)
    else {
      setIsTracking(false)
      setAlarmSet(false)
      if (motionCleanupRef.current) motionCleanupRef.current()
      if (alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current)
    }
  }

  const calculateStats = () => {
    if (!sleepData.length) return null
    const completed = sleepData.filter(s => !s.isActive)
    const total = completed.reduce((sum, s) => sum + (s.duration || 0), 0)
    const avg = total / completed.length || 0
    const lastWeek = completed.slice(-7)
    const weeklyAvg = lastWeek.reduce((sum, s) => sum + (s.duration || 0), 0) / lastWeek.length || 0
    const durations = completed.map(s => s.duration || 0).filter(d => d > 0)

    return {
      totalSessions: completed.length,
      averageSleep: Math.round(avg * 100) / 100,
      weeklyAverage: Math.round(weeklyAvg * 100) / 100,
      lastSleep: Math.round((completed.at(-1)?.duration || 0) * 100) / 100,
      totalHours: Math.round(total * 100) / 100,
      longestSleep: durations.length ? Math.round(Math.max(...durations) * 100) / 100 : 0,
      shortestSleep: durations.length ? Math.round(Math.min(...durations) * 100) / 100 : 0
    }
  }

  return {
    sleepTime,
    wakeTime,
    isTracking,
    alarmSet,
    sleepData,
    movementData,
    settings,
    startSleepTracking,
    stopSleepTracking,
    updateSetting,
    saveSettings,
    calculateStats
  }
}

export default useSleepTracking
