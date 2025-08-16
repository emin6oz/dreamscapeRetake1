export const APP_NAME = 'Sleep Tracker'
export const APP_VERSION = '1.0.0'

export const STORAGE_KEYS = {
  USER: 'user',
  SLEEP_DATA: 'sleepTrackerData',
  SETTINGS: 'sleepTrackerSettings',
  WELCOME_SEEN: 'hasSeenWelcome'
}

export const DEFAULT_SETTINGS = {
  sleepTime: '22:00',
  wakeTime: '07:00',
  notifications: true,
  vibration: true,
  darkMode: true,
  sleepReminders: true 
}

export const SLEEP_PHASES = {
  AWAKE: 'awake',
  LIGHT: 'light',
  DEEP: 'deep',
  REM: 'rem'
}

export const TAB_ROUTES = {
  SLEEP: 'sleep',
  SCAN: 'scan',
  STATISTICS: 'statistics',
  PROFILE: 'profile'
}