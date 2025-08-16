// useSleepTracking.js - Fixed version using your existing storage utilities

import { useState, useEffect, useRef } from 'react';
import { formatTime12Hour } from '../utils/timeUtils';
import { notificationManager, vibrationManager } from '../utils/notifications';
import { 
  STORE_NAMES, 
  saveToStorage, 
  getFromStorage, 
  getAllFromStorage, 
  clearStorage 
} from '../utils/storage';

// Default settings
const DEFAULT_SETTINGS = {
  sleepTime: '23:00',
  wakeTime: '07:00',
  notifications: true,
  vibration: true,
  sleepReminders: true,
};

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
    console.log('🔍 useSleepTracking state updated:', {
      sleepTime,
      wakeTime,
      isTracking,
      alarmSet,
      sleepDataLength: sleepData.length,
      movementDataLength: movementData.length,
      settings
    });
  }, [sleepTime, wakeTime, isTracking, alarmSet, sleepData.length, movementData.length, settings]);

  // Helper functions
  const createLocalDateTime = (timeString, targetDate = new Date()) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const localDate = new Date(targetDate);
    localDate.setHours(hours, minutes, 0, 0);
    return localDate;
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Initialize app and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing sleep tracking app...');
        
        // Load existing sleep sessions
        const savedSleepData = await getAllFromStorage(STORE_NAMES.SESSIONS);
        if (savedSleepData?.length) {
          console.log(`📊 Loaded ${savedSleepData.length} existing sleep sessions`);
          // Filter out invalid and active sessions for stats
          const validSessions = savedSleepData.filter(session => 
            session && 
            session.id && 
            !session.isActive && 
            session.duration > 0
          );
          console.log(`📊 Valid completed sessions: ${validSessions.length}`);
          setSleepData(savedSleepData); // Keep all sessions for potential recovery
        } else {
          console.log('📊 No existing sleep sessions found');
          setSleepData([]);
        }

        // Load saved settings
        const savedSettings = await getFromStorage(STORE_NAMES.SETTINGS, 'settings');
        if (savedSettings) {
          console.log('⚙️ Loaded saved settings:', savedSettings);
          setSettings(savedSettings);
          setSleepTime(savedSettings.sleepTime || DEFAULT_SETTINGS.sleepTime);
          setWakeTime(savedSettings.wakeTime || DEFAULT_SETTINGS.wakeTime);
        } else {
          console.log('⚙️ Using default settings');
          await saveSettings(DEFAULT_SETTINGS);
        }

        // Try to recover active session
        await recoverActiveSession();

        // Request notification permission if enabled
        if (savedSettings?.notifications !== false) {
          console.log('🔔 Requesting notification permission...');
          const permissionGranted = await notificationManager.requestPermission();
          console.log('🔔 Notification permission granted:', permissionGranted);
        }

        // Test vibration
        if (savedSettings?.vibration !== false) {
          const vibrationSupported = vibrationManager.isSupported;
          console.log('🔸 Vibration supported:', vibrationSupported);
        }

        console.log('✅ App initialization complete');
      } catch (err) {
        console.error('❌ Initialization error:', err);
        setSleepData([]);
        setSettings(DEFAULT_SETTINGS);
      }
    };

    initializeApp();
  }, []);

  // Recover active session on app restart
  const recoverActiveSession = async () => {
    try {
      console.log('🔍 Checking for active session...');
      const activeSession = await getFromStorage(STORE_NAMES.ACTIVE, 'active');
      
      if (activeSession?.isActive) {
        console.log('🔄 Found active session:', activeSession);
        const now = Date.now();
        const sessionStart = new Date(activeSession.sessionStartTime).getTime();
        const timeSinceStart = now - sessionStart;

        // Only recover if session is less than 12 hours old
        if (timeSinceStart < 12 * 60 * 60 * 1000) {
          console.log('⚡ Recovering active session...');
          
          // Restore session state
          setIsTracking(true);
          setAlarmSet(true);
          sessionStartTimeRef.current = new Date(sessionStart);

          // Restore movement data
          const savedMovement = await getAllFromStorage(STORE_NAMES.MOVEMENT);
          if (savedMovement?.length) {
            console.log(`📈 Restored ${savedMovement.length} movement samples`);
            movementSamplesRef.current = savedMovement;
            setMovementData(savedMovement);
          }

          // Restart movement tracking
          await startMovementTracking();

          // Restore alarm with proper timezone handling
          const wakeTimeToUse = activeSession.wakeTime || wakeTime;
          const wakeUpTime = createLocalDateTime(wakeTimeToUse, new Date());
          
          if (wakeUpTime <= new Date()) {
            wakeUpTime.setDate(wakeUpTime.getDate() + 1);
          }
          
          const timeUntilWake = wakeUpTime.getTime() - now;
          
          if (timeUntilWake > 0 && timeUntilWake < 24 * 60 * 60 * 1000) {
            console.log(`⏰ Recovered alarm set for ${Math.round(timeUntilWake / 1000 / 60)} minutes from now`);
            alarmTimeoutRef.current = setTimeout(() => {
              console.log('🚨 Recovered alarm triggered');
              triggerAlarm(activeSession);
            }, timeUntilWake);
          } else {
            console.log('⏰ Wake time has passed, completing session');
            await completeSession(activeSession);
          }
        } else {
          console.log('🗑️ Active session too old, clearing...');
          await clearStorage(STORE_NAMES.ACTIVE);
        }
      } else {
        console.log('💤 No active session found');
      }
    } catch (error) {
      console.error('❌ Error recovering active session:', error);
    }
  };

  // Bedtime reminder setup
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
      
      const now = new Date();
      const reminderTime = createLocalDateTime(sleepTime, now);
      reminderTime.setTime(reminderTime.getTime() - 30 * 60000); // 30 minutes before
      
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      console.log(`🛏️ Bedtime reminder set for ${Math.round(timeUntilReminder / 1000 / 60)} minutes from now`);
      
      bedtimeReminderRef.current = setTimeout(() => {
        console.log('🛏️ Bedtime reminder triggered');
        if (settings.notifications) {
          notificationManager.showBedtimeReminder(formatTime12Hour(sleepTime));
        }
        if (settings.vibration) {
          vibrationManager.vibrate([200, 100, 200]);
        }
        setupBedtimeReminder(); // Schedule next reminder
      }, timeUntilReminder);
    } catch (error) {
      console.error('❌ Error setting up bedtime reminder:', error);
    }
  };

  const clearBedtimeReminder = () => {
    if (bedtimeReminderRef.current) {
      clearTimeout(bedtimeReminderRef.current);
      bedtimeReminderRef.current = null;
      console.log('🛏️ Bedtime reminder cleared');
    }
  };

  // Settings management
  const saveSettings = async (newSettings = null) => {
    try {
      const settingsToSave = newSettings || { ...settings, sleepTime, wakeTime };
      console.log('💾 Saving settings:', settingsToSave);
      setSettings(settingsToSave);
      await saveToStorage(STORE_NAMES.SETTINGS, settingsToSave, 'settings');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
    }
  };

  const updateSetting = async (key, value) => {
    try {
      console.log(`⚙️ Updating setting ${key} to ${value}`);
      const newSettings = { ...settings, [key]: value };
      
      if (key === 'notifications' && value === true) {
        const granted = await notificationManager.requestPermission();
        if (!granted) {
          alert('Please enable notifications in your browser settings.');
          return;
        }
      }
      
      if (key === 'vibration' && value === true) {
        if (vibrationManager.isSupported) {
          vibrationManager.vibrate([200, 100, 200]);
        } else {
          alert('Vibration is not supported on this device.');
        }
      }
      
      await saveSettings(newSettings);
    } catch (error) {
      console.error('❌ Error updating setting:', error);
    }
  };

  // Movement tracking
  const startMovementTracking = async () => {
    try {
      console.log('📈 Starting movement tracking...');
      
      // Clean up any existing tracking
      if (motionCleanupRef.current) {
        motionCleanupRef.current();
      }

      // Check if DeviceMotionEvent is available
      if (typeof DeviceMotionEvent === 'undefined') {
        console.warn('⚠️ DeviceMotionEvent not supported on this device');
        return;
      }

      // Request permission for iOS devices
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        console.log('📱 Requesting DeviceMotion permission...');
        const response = await DeviceMotionEvent.requestPermission();
        console.log('📱 DeviceMotion permission response:', response);
        
        if (response !== 'granted') {
          console.error('❌ DeviceMotion permission denied');
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

          await saveToStorage(STORE_NAMES.MOVEMENT, sample, sample.timestamp);
        } catch (error) {
          console.error('❌ Error sampling movement:', error);
        }
      };

      // Add event listener
      window.addEventListener('devicemotion', handleMotion);
      console.log('📈 DeviceMotion event listener added');

      // Start sampling interval
      sampleIntervalRef.current = setInterval(sampleMovement, SAMPLE_INTERVAL);
      console.log(`📈 Movement sampling started (${SAMPLE_INTERVAL}ms interval)`);

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
        console.log('📈 Movement tracking cleaned up');
      };

      console.log('✅ Movement tracking started successfully');
    } catch (error) {
      console.error('❌ Failed to start movement tracking:', error);
      throw error;
    }
  };

  // Start sleep tracking
  const startSleepTracking = async () => {
    try {
      console.log('🌙 Starting sleep tracking...');
      
      // Validate required data
      if (!sleepTime || !wakeTime) {
        throw new Error('Sleep time and wake time must be set');
      }
      
      console.log(`🌙 Sleep: ${sleepTime}, Wake: ${wakeTime}`);
      
      // Update state
      setIsTracking(true);
      setAlarmSet(true);
      
      // Save current settings
      await saveSettings();
      console.log('💾 Settings saved');

      // Create session data with local time
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

      // Save active session to storage
      await saveToStorage(STORE_NAMES.ACTIVE, sleepSession, 'active');
      console.log('💾 Active session saved');

      // Start movement tracking (non-blocking)
      try {
        await startMovementTracking();
        console.log('📈 Movement tracking started successfully');
      } catch (motionError) {
        console.warn('⚠️ Movement tracking failed, continuing without it:', motionError);
      }

      // Schedule wake-up alarm using local time
      const now = new Date();
      const wakeUpTime = createLocalDateTime(wakeTime, now);
      
      // If wake time is earlier than or equal to current time, set it for tomorrow
      if (wakeUpTime <= now) {
        wakeUpTime.setDate(wakeUpTime.getDate() + 1);
      }

      const timeUntilWake = wakeUpTime.getTime() - now.getTime();
      console.log(`⏰ Current time: ${getCurrentTimeString()}`);
      console.log(`⏰ Wake time set for: ${wakeTime} (${wakeUpTime.toLocaleString()})`);
      console.log(`⏰ Time until wake: ${Math.round(timeUntilWake / 1000 / 60)} minutes`);
      
      if (timeUntilWake > 0 && timeUntilWake < 24 * 60 * 60 * 1000) { // Max 24 hours
        alarmTimeoutRef.current = setTimeout(() => {
          console.log('🚨 Alarm triggered automatically at:', new Date().toLocaleString());
          triggerAlarm(sleepSession);
        }, timeUntilWake);
        console.log('✅ Alarm scheduled successfully');
      } else {
        console.warn('⚠️ Invalid alarm time, not scheduling');
      }

      // Send notifications (non-blocking)
      try {
        if (settings.notifications) {
          notificationManager.showNotification('Sleep Tracking Started', {
            body: 'Sweet dreams! We\'ll track your sleep and wake you up.',
            tag: 'sleep-started'
          });
        }
        if (settings.vibration) {
          vibrationManager.vibrate([200, 100, 200]);
        }
      } catch (notifError) {
        console.warn('⚠️ Notification failed:', notifError);
      }

      console.log('✅ Sleep tracking started successfully');
      
    } catch (err) {
      console.error('❌ Failed to start sleep tracking:', err);
      
      // Reset state on error
      setIsTracking(false);
      setAlarmSet(false);
      
      // Clean up any partial state
      try {
        await clearStorage(STORE_NAMES.ACTIVE);
      } catch (clearError) {
        console.error('❌ Failed to clear active store on error:', clearError);
      }
      
      // Re-throw with more context
      throw new Error(`Sleep tracking failed: ${err.message}`);
    }
  };

  // Enhanced alarm trigger
  const triggerAlarm = async (sessionData) => {
    try {
      console.log('🚨 ALARM TRIGGERED! 🚨');
      console.log('🚨 Triggering wake-up alarm at:', new Date().toLocaleString());
      console.log('🚨 Session data:', sessionData);
      
      // 1. Enhanced vibration pattern
      if (settings.vibration && vibrationManager.isSupported) {
        console.log('🔸 Starting wake-up vibrations');
        vibrationManager.wakeUpVibration();
      }

      // 2. Multiple persistent notifications
      if (settings.notifications) {
        console.log('🔔 Checking notification permission:', Notification?.permission);
        
        if (notificationManager.permission === 'granted') {
          console.log('📱 Showing wake-up notifications');
          
          // Show main alarm notification
          await notificationManager.showWakeUpNotification();

          // Show additional notifications every 15 seconds for 2 minutes
          let notificationCount = 0;
          const notificationInterval = setInterval(async () => {
            if (notificationCount < 8 && isTracking) { // 8 * 15 seconds = 2 minutes
              notificationCount++;
              console.log(`🔔 Alarm notification ${notificationCount}/8`);
              
              await notificationManager.showNotification(`⏰ WAKE UP! (${notificationCount}/8)`, {
                body: `ALARM! Time to wake up! Tap to stop.`,
                tag: `wake-up-alarm-${notificationCount}`,
                requireInteraction: true,
                vibrate: [500, 200, 500]
              });
            } else {
              clearInterval(notificationInterval);
              console.log('🔔 Alarm notification sequence completed');
            }
          }, 15000); // Every 15 seconds
        } else {
          console.error('❌ Cannot show notifications - permission not granted');
          alert('WAKE UP! Your alarm is going off but notifications are disabled.');
        }
      }

      // 3. Browser alert as fallback
      setTimeout(() => {
        if (isTracking) {
          console.log('🚨 Showing browser alert as backup');
          const userResponse = confirm('⏰ WAKE UP! Your alarm is going off. Click OK to stop tracking.');
          if (userResponse) {
            completeSession(sessionData);
          }
        }
      }, 5000); // 5 seconds after alarm starts

      // 4. Auto-complete session after 3 minutes if not manually stopped
      setTimeout(() => {
        if (isTracking) {
          console.log('⏱️ Auto-completing session after 3 minutes');
          completeSession(sessionData);
        }
      }, 180000); // 3 minutes

      // 5. Audio alarm (if supported)
      try {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('Wake up! Your alarm is going off!');
          utterance.volume = 1;
          utterance.rate = 1;
          utterance.pitch = 1;
          speechSynthesis.speak(utterance);
        }
      } catch (audioError) {
        console.warn('⚠️ Audio alarm failed:', audioError);
      }

      console.log('✅ Wake-up alarm sequence initiated');
    } catch (error) {
      console.error('❌ Error triggering alarm:', error);
      // Emergency fallback
      alert('WAKE UP! Your alarm failed but tracking is complete.');
      completeSession(sessionData);
    }
  };

  // Stop sleep tracking
  const stopSleepTracking = async () => {
    try {
      console.log('🛑 Stopping sleep tracking...');
      const activeSession = await getFromStorage(STORE_NAMES.ACTIVE, 'active');
      
      if (activeSession) {
        await completeSession(activeSession);
      } else {
        console.log('💤 No active session found, resetting state');
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
      console.error('❌ Error stopping sleep tracking:', error);
    }
  };

  // Complete sleep session
  const completeSession = async (sessionData) => {
    try {
      console.log('💾 Completing sleep session...');
      console.log('💾 Session data to complete:', sessionData);
      
      const endTime = new Date();
      const startTime = sessionStartTimeRef.current || new Date(sessionData.sessionStartTime);
      const duration = Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10;

      // Store actual wake time in readable format
      const localWakeTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      const completedSession = {
        ...sessionData,
        endTime: endTime.toISOString(),
        actualWakeTime: localWakeTime, // Store as HH:MM format for display
        actualWakeTimestamp: endTime.toISOString(), // Keep ISO for calculations
        duration: duration,
        movementData: [...movementSamplesRef.current],
        isActive: false,
        completedAt: endTime.toISOString()
      };

      console.log('💾 Saving completed session:', {
        id: completedSession.id,
        duration: completedSession.duration,
        actualWakeTime: completedSession.actualWakeTime,
        movementDataLength: completedSession.movementData.length
      });

      // Save completed session to storage
      try {
        await saveToStorage(STORE_NAMES.SESSIONS, completedSession);
        console.log('✅ Session saved to storage successfully');
        
        // Update state immediately - replace any existing session with same ID
        setSleepData(prev => {
          const filtered = prev.filter(s => s.id !== completedSession.id);
          const updated = [...filtered, completedSession];
          console.log('📊 Updated sleep data state, total sessions:', updated.length);
          console.log('📊 Completed sessions:', updated.filter(s => !s.isActive).length);
          return updated;
        });
      } catch (saveError) {
        console.error('❌ Failed to save session to storage:', saveError);
        // Still update state even if storage save fails
        setSleepData(prev => {
          const filtered = prev.filter(s => s.id !== completedSession.id);
          return [...filtered, completedSession];
        });
      }

      // Reset all tracking state
      console.log('🔄 Resetting tracking state...');
      setIsTracking(false);
      setAlarmSet(false);
      sessionStartTimeRef.current = null;
      movementSamplesRef.current = [];
      setMovementData([]);

      // Clean up storage
      try {
        await clearStorage(STORE_NAMES.ACTIVE);
        await clearStorage(STORE_NAMES.MOVEMENT);
        console.log('🗑️ Cleaned up temporary data');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup stores:', cleanupError);
      }

      // Clean up intervals and timeouts
      if (motionCleanupRef.current) {
        motionCleanupRef.current();
        motionCleanupRef.current = null;
      }

      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
        alarmTimeoutRef.current = null;
      }

      // Send completion notification
      try {
        if (settings.notifications) {
          await notificationManager.showNotification('Sleep Session Complete', {
            body: `You slept for ${duration} hours. Session saved successfully!`,
            tag: 'session-complete',
            vibrate: [200, 100, 200]
          });
        }
      } catch (notifError) {
        console.warn('⚠️ Completion notification failed:', notifError);
      }

      console.log(`✅ Sleep session completed successfully: ${duration} hours, woke up at ${localWakeTime}`);
      
    } catch (error) {
      console.error('❌ Error completing session:', error);
      
      // Emergency state reset
      setIsTracking(false);
      setAlarmSet(false);
      
      if (alarmTimeoutRef.current) {
        clearTimeout(alarmTimeoutRef.current);
        alarmTimeoutRef.current = null;
      }
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    try {
      console.log('📊 Calculating stats from sleepData:', sleepData.length, 'total sessions');
      
      if (!sleepData.length) {
        console.log('📊 No sleep data available for stats');
        return null;
      }
      
      // Filter for completed sessions only
      const completed = sleepData.filter(s => 
        !s.isActive && 
        s.duration > 0 && 
        typeof s.duration === 'number'
      );
      
      console.log('📊 Completed sessions for stats:', completed.length);
      
      if (!completed.length) {
        console.log('📊 No completed sessions for stats');
        return null;
      }
      
      const durations = completed.map(s => s.duration);
      const total = durations.reduce((sum, d) => sum + d, 0);
      const avg = total / completed.length;
      
      const lastWeek = completed.slice(-7);
      const weeklyTotal = lastWeek.reduce((sum, s) => sum + s.duration, 0);
      const weeklyAvg = weeklyTotal / lastWeek.length;

      const stats = {
        totalSessions: completed.length,
        averageSleep: Math.round(avg * 100) / 100,
        weeklyAverage: Math.round(weeklyAvg * 100) / 100,
        lastSleep: Math.round((completed.at(-1)?.duration || 0) * 100) / 100,
        totalHours: Math.round(total * 100) / 100,
        shortestSleep: Math.min(...durations),
        longestSleep: Math.max(...durations),
      };

      console.log('📊 Calculated stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error calculating stats:', error);
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

export default useSleepTracking;git a