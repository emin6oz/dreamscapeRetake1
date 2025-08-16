// useSleepTracking.js - Complete updated version with fixes and debugging

import { useState, useEffect, useRef } from 'react';
import { openDB } from 'idb';

// Default settings - fallback if constants file doesn't exist
const DEFAULT_SETTINGS = {
  sleepTime: '23:00',
  wakeTime: '07:00',
  notifications: true,
  vibration: true,
  sleepReminders: true,
};

// Utility function - fallback if timeUtils doesn't exist
const formatTime12Hour = (timeStr) => {
  try {
    if (!timeStr) return '12:00 AM';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeStr || '12:00 AM';
  }
};

// Notification manager - fallback if notifications util doesn't exist
const notificationManager = {
  async requestPermission() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  },

  showBedtimeReminder(time) {
    try {
      if (Notification.permission === 'granted') {
        new Notification('Bedtime Reminder', {
          body: `Time to start winding down for bed at ${time}`,
          icon: '/icon-192x192.png',
          tag: 'bedtime-reminder'
        });
      }
    } catch (error) {
      console.error('Bedtime notification error:', error);
    }
  },

  showSleepTrackingStarted() {
    try {
      if (Notification.permission === 'granted') {
        new Notification('Sleep Tracking Started', {
          body: 'Sweet dreams! We\'ll track your sleep and wake you up.',
          icon: '/icon-192x192.png',
          tag: 'sleep-started'
        });
      }
    } catch (error) {
      console.error('Sleep start notification error:', error);
    }
  },

  showWakeUpNotification() {
    try {
      if (Notification.permission === 'granted') {
        new Notification('Good Morning!', {
          body: 'Hope you had a restful sleep. Your session has been saved.',
          icon: '/icon-192x192.png',
          tag: 'wake-up'
        });
      }
    } catch (error) {
      console.error('Wake up notification error:', error);
    }
  }
};

// Vibration manager - fallback if vibration util doesn't exist
const vibrationManager = {
  isVibrationSupported() {
    return 'vibrate' in navigator;
  },

  notificationVibration() {
    try {
      if (this.isVibrationSupported()) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (error) {
      console.error('Notification vibration error:', error);
    }
  },

  wakeUpVibration() {
    try {
      if (this.isVibrationSupported()) {
        navigator.vibrate([1000, 500, 1000, 500, 1000]);
      }
    } catch (error) {
      console.error('Wake up vibration error:', error);
    }
  }
};

// IndexedDB config
const DB_NAME = 'sleepTrackerDB';
const DB_VERSION = 1;
const STORE_NAMES = {
  SESSIONS: 'sessions',
  MOVEMENT: 'movement',
  SETTINGS: 'settings',
  ACTIVE: 'activeSession',
};

// --- IndexedDB helpers ---
async function initDB() {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAMES.SESSIONS)) {
          db.createObjectStore(STORE_NAMES.SESSIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.MOVEMENT)) {
          db.createObjectStore(STORE_NAMES.MOVEMENT, { keyPath: 'timestamp' });
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
          db.createObjectStore(STORE_NAMES.SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORE_NAMES.ACTIVE)) {
          db.createObjectStore(STORE_NAMES.ACTIVE);
        }
      },
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

async function saveItem(store, value, key = undefined) {
  try {
    const db = await initDB();
    return await db.put(store, value, key);
  } catch (error) {
    console.error(`Failed to save item to ${store}:`, error);
    throw error;
  }
}

async function getItem(store, key) {
  try {
    const db = await initDB();
    return await db.get(store, key);
  } catch (error) {
    console.error(`Failed to get item from ${store}:`, error);
    return null;
  }
}

async function getAll(store) {
  try {
    const db = await initDB();
    return await db.getAll(store);
  } catch (error) {
    console.error(`Failed to get all items from ${store}:`, error);
    return [];
  }
}

async function clearStore(store) {
  try {
    const db = await initDB();
    return await db.clear(store);
  } catch (error) {
    console.error(`Failed to clear store ${store}:`, error);
  }
}

// --- Main Hook ---
const useSleepTracking = () => {
  // State
  const [sleepTime, setSleepTime] = useState(DEFAULT_SETTINGS.sleepTime);
  const [wakeTime, setWakeTime] = useState(DEFAULT_SETTINGS.wakeTime);
  const [isTracking, setIsTracking] = useState(false);
  const [sleepData, setSleepData] = useState([]);
  const [movementData, setMovementData] = useState([]);
  const [alarmSet, setAlarmSet] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Refs
  const sessionStartTimeRef = useRef(null);
  const currentMovementRef = useRef(0);
  const movementSamplesRef = useRef([]);
  const trackingIntervalRef = useRef(null);
  const sampleIntervalRef = useRef(null);
  const alarmTimeoutRef = useRef(null);
  const bedtimeReminderRef = useRef(null);
  const motionCleanupRef = useRef(null);

  // Constants
  const SAMPLE_INTERVAL = 30000; // 30 seconds
  const MOVEMENT_THRESHOLD = 0.5;
  const RESTLESS_THRESHOLD = 2.0;

  // Debug logging
  useEffect(() => {
    console.log('useSleepTracking state updated:', {
      sleepTime,
      wakeTime,
      isTracking,
      alarmSet,
      sleepDataLength: sleepData.length,
      movementDataLength: movementData.length,
      settings
    });
  }, [sleepTime, wakeTime, isTracking, alarmSet, sleepData.length, movementData.length, settings]);

  // --- Initialize ---
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing sleep tracking app...');
        
        // Load saved data
        const savedSleepData = await getAll(STORE_NAMES.SESSIONS);
        const savedSettings = await getItem(STORE_NAMES.SETTINGS, 'settings');

        if (savedSleepData?.length) {
          console.log(`Loaded ${savedSleepData.length} sleep sessions`);
          setSleepData(savedSleepData);
        }

        if (savedSettings) {
          console.log('Loaded saved settings:', savedSettings);
          setSettings(savedSettings);
          setSleepTime(savedSettings.sleepTime || DEFAULT_SETTINGS.sleepTime);
          setWakeTime(savedSettings.wakeTime || DEFAULT_SETTINGS.wakeTime);
        }

        // Try to recover active session
        await recoverActiveSession();

        // Request notification permission if enabled
        if (savedSettings?.notifications !== false) {
          const permissionGranted = await notificationManager.requestPermission();
          console.log('Notification permission granted:', permissionGranted);
        }

        console.log('App initialization complete');
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };

    initializeApp();
  }, []);

  // --- Recover active session ---
  const recoverActiveSession = async () => {
    try {
      console.log('Checking for active session...');
      const activeSession = await getItem(STORE_NAMES.ACTIVE, 'active');
      
      if (activeSession?.isActive) {
        console.log('Found active session:', activeSession);
        const now = Date.now();
        const sessionStart = new Date(activeSession.sessionStartTime).getTime();
        const timeSinceStart = now - sessionStart;

        // Only recover if session is less than 12 hours old
        if (timeSinceStart < 12 * 60 * 60 * 1000) {
          console.log('Recovering active session...');
          
          // Restore session state
          setIsTracking(true);
          setAlarmSet(true);
          sessionStartTimeRef.current = new Date(sessionStart);

          // Restore movement data
          const savedMovement = await getAll(STORE_NAMES.MOVEMENT);
          if (savedMovement?.length) {
            console.log(`Restored ${savedMovement.length} movement samples`);
            movementSamplesRef.current = savedMovement;
            setMovementData(savedMovement);
          }

          // Restart movement tracking
          await startMovementTracking();

          // Restore alarm
          const wakeTimeToUse = activeSession.wakeTime || wakeTime;
          const [wakeHours, wakeMinutes] = wakeTimeToUse.split(':').map(Number);
          const wakeUpTime = new Date();
          wakeUpTime.setHours(wakeHours, wakeMinutes, 0, 0);
          
          if (wakeUpTime <= new Date()) {
            wakeUpTime.setDate(wakeUpTime.getDate() + 1);
          }
          
          const timeUntilWake = wakeUpTime.getTime() - now;
          
          if (timeUntilWake > 0) {
            console.log(`Alarm set for ${timeUntilWake}ms from now`);
            alarmTimeoutRef.current = setTimeout(() => {
              console.log('Recovered alarm triggered');
              completeSession(activeSession);
            }, timeUntilWake);
          } else {
            console.log('Wake time has passed, completing session');
            await completeSession(activeSession);
          }
        } else {
          console.log('Active session too old, clearing...');
          await clearStore(STORE_NAMES.ACTIVE);
        }
      } else {
        console.log('No active session found');
      }
    } catch (error) {
      console.error('Error recovering active session:', error);
    }
  };

  // --- Bedtime reminder ---
  useEffect(() => {
    if (settings.sleepReminders && settings.notifications) {
      setupBedtimeReminder();
    } else {
      clearBedtimeReminder();
    }
    
    return () => clearBedtimeReminder();
  }, [settings.sleepReminders, settings.notifications, sleepTime]);

  const setupBedtimeReminder = () => {
    try {
      clearBedtimeReminder();
      
      const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(sleepHours, sleepMinutes, 0, 0);
      reminderTime.setTime(reminderTime.getTime() - 30 * 60000); // 30 minutes before
      
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      console.log(`Bedtime reminder set for ${timeUntilReminder}ms from now`);
      
      bedtimeReminderRef.current = setTimeout(() => {
        console.log('Bedtime reminder triggered');
        if (settings.notifications) {
          notificationManager.showBedtimeReminder(formatTime12Hour(sleepTime));
        }
        if (settings.vibration) {
          vibrationManager.notificationVibration();
        }
        setupBedtimeReminder(); // Schedule next reminder
      }, timeUntilReminder);
    } catch (error) {
      console.error('Error setting up bedtime reminder:', error);
    }
  };

  const clearBedtimeReminder = () => {
    if (bedtimeReminderRef.current) {
      clearTimeout(bedtimeReminderRef.current);
      bedtimeReminderRef.current = null;
      console.log('Bedtime reminder cleared');
    }
  };

  // --- Settings management ---
  const saveSettings = async (newSettings = null) => {
    try {
      const settingsToSave = newSettings || { ...settings, sleepTime, wakeTime };
      console.log('Saving settings:', settingsToSave);
      setSettings(settingsToSave);
      await saveItem(STORE_NAMES.SETTINGS, settingsToSave, 'settings');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      console.log(`Updating setting ${key} to ${value}`);
      const newSettings = { ...settings, [key]: value };
      
      if (key === 'notifications' && value === true) {
        const granted = await notificationManager.requestPermission();
        if (!granted) {
          alert('Please enable notifications in your browser settings.');
          return;
        }
      }
      
      if (key === 'vibration' && value === true) {
        if (vibrationManager.isVibrationSupported()) {
          vibrationManager.notificationVibration();
        } else {
          alert('Vibration is not supported on this device.');
        }
      }
      
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  // --- Movement tracking ---
  const startMovementTracking = async () => {
    try {
      console.log('Starting movement tracking...');
      
      // Clean up any existing tracking
      if (motionCleanupRef.current) {
        motionCleanupRef.current();
      }

      // Check if DeviceMotionEvent is available
      if (typeof DeviceMotionEvent === 'undefined') {
        console.warn('DeviceMotionEvent not supported on this device');
        return;
      }

      // Request permission for iOS devices
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        console.log('Requesting DeviceMotion permission...');
        const response = await DeviceMotionEvent.requestPermission();
        console.log('DeviceMotion permission response:', response);
        
        if (response !== 'granted') {
          console.error('DeviceMotion permission denied');
          throw new Error('Motion permission denied');
        }
      }

      // Initialize movement tracking
      currentMovementRef.current = 0;

      const handleMotion = (event) => {
        const acc = event.accelerationIncludingGravity;
        if (acc && (acc.x !== null || acc.y !== null || acc.z !== null)) {
          currentMovementRef.current = Math.sqrt(
            Math.pow(acc.x || 0, 2) + 
            Math.pow(acc.y || 0, 2) + 
            Math.pow(acc.z || 0, 2)
          );
        }
      };

      const sampleMovement = async () => {
        try {
          const now = Date.now();
          const movement = currentMovementRef.current;
          let intensity = 'calm';
          
          if (movement > RESTLESS_THRESHOLD) {
            intensity = 'restless';
          } else if (movement > MOVEMENT_THRESHOLD) {
            intensity = 'light';
          }

          const sample = {
            timestamp: now,
            movement: Math.round(movement * 100) / 100,
            intensity,
            time: new Date(now).toLocaleTimeString(),
          };

          movementSamplesRef.current.push(sample);
          
          // Keep only last 960 samples (8 hours at 30-second intervals)
          if (movementSamplesRef.current.length > 960) {
            movementSamplesRef.current = movementSamplesRef.current.slice(-960);
          }

          await saveItem(STORE_NAMES.MOVEMENT, sample, sample.timestamp);
        } catch (error) {
          console.error('Error sampling movement:', error);
        }
      };

      // Add event listener
      window.addEventListener('devicemotion', handleMotion);
      console.log('DeviceMotion event listener added');

      // Start sampling interval
      sampleIntervalRef.current = setInterval(sampleMovement, SAMPLE_INTERVAL);
      console.log(`Movement sampling started (${SAMPLE_INTERVAL}ms interval)`);

      // Update UI every minute
      trackingIntervalRef.current = setInterval(() => {
        setMovementData([...movementSamplesRef.current]);
      }, 60000);

      // Setup cleanup function
      motionCleanupRef.current = () => {
        window.removeEventListener('devicemotion', handleMotion);
        if (sampleIntervalRef.current) {
          clearInterval(sampleIntervalRef.current);
          sampleIntervalRef.current = null;
        }
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = null;
        }
        console.log('Movement tracking cleaned up');
      };

      console.log('Movement tracking started successfully');
    } catch (error) {
      console.error('Failed to start movement tracking:', error);
      throw error;
    }
  };

  // --- Sleep tracking control ---
  const startSleepTracking = async () => {
    try {
      console.log('Starting sleep tracking...');
      
      // Validate required data
      if (!sleepTime || !wakeTime) {
        throw new Error('Sleep time and wake time must be set');
      }
      
      console.log(`Sleep: ${sleepTime}, Wake: ${wakeTime}`);
      
      // Update state
      setIsTracking(true);
      setAlarmSet(true);
      
      // Save current settings
      await saveSettings();
      console.log('Settings saved');

      // Create session data
      const startTime = new Date();
      sessionStartTimeRef.current = startTime;

      const sleepSession = {
        id: Date.now(),
        date: startTime.toDateString(),
        startTime: startTime.toISOString(),
        sessionStartTime: startTime.toISOString(),
        sleepTime,
        wakeTime,
        isActive: true,
      };

      // Save active session to IndexedDB
      await saveItem(STORE_NAMES.ACTIVE, sleepSession, 'active');
      console.log('Active session saved');

      // Start movement tracking (non-blocking)
      try {
        await startMovementTracking();
        console.log('Movement tracking started successfully');
      } catch (motionError) {
        console.warn('Movement tracking failed, continuing without it:', motionError);
        // Don't fail the whole process if motion tracking fails
      }

      // Schedule wake-up alarm
      const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number);
      const wakeUpTime = new Date();
      wakeUpTime.setHours(wakeHours, wakeMinutes, 0, 0);
      
      // If wake time is in the past, set it for tomorrow
      if (wakeUpTime <= new Date()) {
        wakeUpTime.setDate(wakeUpTime.getDate() + 1);
      }

      const timeUntilWake = wakeUpTime.getTime() - Date.now();
      console.log(`Alarm set for ${timeUntilWake}ms from now (${wakeUpTime.toLocaleString()})`);
      
      if (timeUntilWake > 0) {
        alarmTimeoutRef.current = setTimeout(() => {
          console.log('Alarm triggered automatically');
          completeSession(sleepSession);
        }, timeUntilWake);
      }

      // Send notifications (non-blocking)
      try {
        if (settings.notifications) {
          notificationManager.showSleepTrackingStarted();
        }
        if (settings.vibration) {
          vibrationManager.notificationVibration();
        }
      } catch (notifError) {
        console.warn('Notification failed:', notifError);
      }

      console.log('Sleep tracking started successfully');
      
    } catch (err) {
      console.error('Failed to start sleep tracking:', err);
      
      // Reset state on error
      setIsTracking(false);
      setAlarmSet(false);
      
      // Clean up any partial state
      try {
        await clearStore(STORE_NAMES.ACTIVE);
      } catch (clearError) {
        console.error('Failed to clear active store on error:', clearError);
      }
      
      // Re-throw with more context
      throw new Error(`Sleep tracking failed: ${err.message}`);
    }
  };

  const stopSleepTracking = async () => {
    try {
      console.log('Stopping sleep tracking...');
      const activeSession = await getItem(STORE_NAMES.ACTIVE, 'active');
      
      if (activeSession) {
        await completeSession(activeSession);
      } else {
        console.log('No active session found, resetting state');
        setIsTracking(false);
        setAlarmSet(false);
        
        if (motionCleanupRef.current) {
          motionCleanupRef.current();
        }
        
        if (alarmTimeoutRef.current) {
          clearTimeout(alarmTimeoutRef.current);
          alarmTimeoutRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error stopping sleep tracking:', error);
    }
  };

  const completeSession = async (sessionData) => {
    try {
      console.log('Completing sleep session...');
      
      const endTime = new Date();
      const startTime = sessionStartTimeRef.current || new Date(sessionData.sessionStartTime);
      const duration = Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10;

      const completedSession = {
        ...sessionData,
        endTime: endTime.toISOString(),
        actualWakeTime: endTime.toISOString(),
        duration,
        movementData: [...movementSamplesRef.current],
        isActive: false,
      };

      // Save completed session
      await saveItem(STORE_NAMES.SESSIONS, completedSession);
      setSleepData(prev => [...prev, completedSession]);
      
      console.log(`Session completed: ${duration} hours`);

      // Reset state
      setIsTracking(false);
      setAlarmSet(false);
      sessionStartTimeRef.current = null;
      movementSamplesRef.current = [];
      setMovementData([]);

      // Clean up
      await clearStore(STORE_NAMES.ACTIVE);
      await clearStore(STORE_NAMES.MOVEMENT);

      if (motionCleanupRef.current) {
        motionCleanupRef.current();
      }

      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
        alarmTimeoutRef.current = null;
      }

      // Send wake-up notifications
      try {
        if (settings.vibration) {
          vibrationManager.wakeUpVibration();
        }
        if (settings.notifications) {
          notificationManager.showWakeUpNotification();
        }
      } catch (notifError) {
        console.warn('Wake-up notification failed:', notifError);
      }

      console.log('Sleep session completed successfully');
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  // --- Stats calculation ---
  const calculateStats = () => {
    try {
      if (!sleepData.length) return null;
      
      const completed = sleepData.filter(s => !s.isActive && s.duration > 0);
      if (!completed.length) return null;
      
      const durations = completed.map(s => s.duration);
      const total = durations.reduce((sum, d) => sum + d, 0);
      const avg = total / completed.length;
      
      const lastWeek = completed.slice(-7);
      const weeklyTotal = lastWeek.reduce((sum, s) => sum + s.duration, 0);
      const weeklyAvg = weeklyTotal / lastWeek.length;

      return {
        totalSessions: completed.length,
        averageSleep: Math.round(avg * 100) / 100,
        weeklyAverage: Math.round(weeklyAvg * 100) / 100,
        lastSleep: Math.round((completed.at(-1)?.duration || 0) * 100) / 100,
        totalHours: Math.round(total * 100) / 100,
        shortestSleep: Math.min(...durations),
        longestSleep: Math.max(...durations),
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (motionCleanupRef.current) {
        motionCleanupRef.current();
      }
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
      }
      if (bedtimeReminderRef.current) {
        clearTimeout(bedtimeReminderRef.current);
      }
    };
  }, []);

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
    updateSetting,
    calculateStats,
    formatTime12Hour, // Export for use in components
  };
};

export default useSleepTracking;