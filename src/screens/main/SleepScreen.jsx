import React, { useState } from 'react'
import { Clock, TestTube, ChevronDown, ChevronUp } from 'lucide-react'
import useSleepTracking from '../../hooks/useSleepTracking'
import { formatTime12Hour } from '../../utils/timeUtils'
import CircularClock from '../../components/ui/CircularClock'
import Button from '../../components/common/Button'

const SleepScreen = () => {
  const {
    sleepTime,
    setSleepTime,
    wakeTime,
    setWakeTime,
    isTracking,
    alarmSet,
    startSleepTracking,
    stopSleepTracking
  } = useSleepTracking()

  const [testMode, setTestMode] = useState(false)
  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false)
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false)

  // Quick test function - simulates sleep session
  const quickTestSleep = () => {
    const now = new Date()
    const testSession = {
      id: Date.now(),
      date: now.toDateString(),
      startTime: now.toLocaleTimeString(),
      sleepTime: "23:00",
      wakeTime: "07:00",
      endTime: new Date(now.getTime() + 30000).toLocaleTimeString(),
      actualWakeTime: new Date(now.getTime() + 30000).toLocaleTimeString(),
      duration: Math.random() * 3 + 6,
      movementData: generateMockMovementData(),
      isActive: false
    }

    const existingData = JSON.parse(localStorage.getItem('sleepTrackerData') || '[]')
    const updatedData = [...existingData, testSession]
    localStorage.setItem('sleepTrackerData', JSON.stringify(updatedData))
    
    alert('Test sleep session added! Check Statistics tab.')
  }

  // Generate mock movement data for testing
  const generateMockMovementData = () => {
    const data = []
    for (let i = 0; i < 100; i++) {
      data.push({
        timestamp: Date.now() - (i * 30000),
        movement: Math.random() * 10 + 2,
        time: new Date(Date.now() - (i * 30000)).toLocaleTimeString()
      })
    }
    return data
  }

  // 30-second test alarm
  const startQuickTest = () => {
    setIsTracking(true)
    setAlarmSet(true)
    
    const startTime = new Date()
    const sleepSession = {
      id: Date.now(),
      date: startTime.toDateString(),
      startTime: startTime.toLocaleTimeString(),
      sleepTime,
      wakeTime,
      isActive: true
    }

    setTimeout(() => {
      const endTime = new Date()
      const completedSession = {
        ...sleepSession,
        endTime: endTime.toLocaleTimeString(),
        actualWakeTime: endTime.toLocaleTimeString(),
        duration: 0.01,
        movementData: generateMockMovementData(),
        isActive: false
      }

      const existingData = JSON.parse(localStorage.getItem('sleepTrackerData') || '[]')
      const updatedData = [...existingData, completedSession]
      localStorage.setItem('sleepTrackerData', JSON.stringify(updatedData))
      
      setIsTracking(false)
      setAlarmSet(false)
      
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
      
      alert('Quick test completed! Check Statistics tab.')
    }, 30000)
  }

  // Add multiple test sessions
  const addMultipleTestSessions = () => {
    const sessions = []
    const now = new Date()

    for (let i = 0; i < 7; i++) {
      const sessionDate = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000))
      sessions.push({
        id: Date.now() + i,
        date: sessionDate.toDateString(),
        startTime: "23:30",
        sleepTime: "23:30",
        wakeTime: "07:00",
        endTime: "07:00",
        actualWakeTime: "07:00",
        duration: Math.random() * 2 + 7,
        movementData: generateMockMovementData(),
        isActive: false
      })
    }

    const existingData = JSON.parse(localStorage.getItem('sleepTrackerData') || '[]')
    const updatedData = [...existingData, ...sessions]
    localStorage.setItem('sleepTrackerData', JSON.stringify(updatedData))
    
    alert('7 test sessions added! Check Statistics tab.')
  }

  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Clear all sleep data?')) {
      localStorage.removeItem('sleepTrackerData')
      alert('All data cleared!')
    }
  }

  // Handle time change and close picker
  const handleSleepTimeChange = (newTime) => {
    setSleepTime(newTime)
    setShowSleepTimePicker(false)
  }

  const handleWakeTimeChange = (newTime) => {
    setWakeTime(newTime)
    setShowWakeTimePicker(false)
  }

  // Time picker component
  const TimePicker = ({ value, onChange, onClose, label }) => (
    <div className="bg-gray-700 rounded-xl p-4 border border-gray-600">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium">{label}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      </div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
    </div>
  )

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 fade-in">
      <div className="max-w-md mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-medium">Sleep tracker</h1>
          <button
            onClick={() => setTestMode(!testMode)}
            className="p-2 bg-yellow-600 rounded-lg"
          >
            <TestTube className="w-5 h-5" />
          </button>
        </div>

        {/* Test Mode Panel */}
        {testMode && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-xl p-4 mb-6">
            <h3 className="text-yellow-400 font-semibold mb-3">🧪 Test Mode</h3>
            <div className="space-y-3">
              <Button
                onClick={quickTestSleep}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Add Single Test Session
              </Button>
              
              <Button
                onClick={startQuickTest}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                30-Second Live Test
              </Button>
              
              <Button
                onClick={addMultipleTestSessions}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Add 7 Days of Data
              </Button>
              
              <Button
                onClick={clearAllData}
                variant="danger"
                size="sm"
                className="w-full"
              >
                Clear All Data
              </Button>
            </div>
          </div>
        )}
        
        {/* Circular Clock */}
        <div className="flex-1 flex items-center justify-center mb-8">
          <CircularClock sleepTime={sleepTime} wakeTime={wakeTime} />
        </div>
        
        {/* Time Settings */}
        <div className="space-y-4 mb-8">
          {/* Bedtime Setting */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => {
                if (!isTracking) {
                  setShowSleepTimePicker(!showSleepTimePicker)
                  setShowWakeTimePicker(false)
                }
              }}
              disabled={isTracking}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 mr-3 bg-white rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-900 rounded"></div>
                </div>
                <span className="text-lg">Bedtime</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-3 font-medium text-blue-400">
                  {formatTime12Hour(sleepTime)}
                </span>
                {!isTracking && (
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                    showSleepTimePicker ? 'rotate-180' : ''
                  }`} />
                )}
              </div>
            </button>
            
            {showSleepTimePicker && (
              <div className="border-t border-gray-700 p-4">
                <TimePicker
                  value={sleepTime}
                  onChange={handleSleepTimeChange}
                  onClose={() => setShowSleepTimePicker(false)}
                  label="Set Bedtime"
                />
              </div>
            )}
          </div>
          
          {/* Wake Time Setting */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => {
                if (!isTracking) {
                  setShowWakeTimePicker(!showWakeTimePicker)
                  setShowSleepTimePicker(false)
                }
              }}
              disabled={isTracking}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-750 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 mr-3 bg-white rounded flex items-center justify-center">
                  <Clock className="w-3 h-3 text-gray-900" />
                </div>
                <span className="text-lg">Alarm</span>
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-3 font-medium text-green-400">
                  {formatTime12Hour(wakeTime)}
                </span>
                {!isTracking && (
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                    showWakeTimePicker ? 'rotate-180' : ''
                  }`} />
                )}
              </div>
            </button>
            
            {showWakeTimePicker && (
              <div className="border-t border-gray-700 p-4">
                <TimePicker
                  value={wakeTime}
                  onChange={handleWakeTimeChange}
                  onClose={() => setShowWakeTimePicker(false)}
                  label="Set Alarm"
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Sleep Button */}
        {!isTracking ? (
          <Button
            onClick={startSleepTracking}
            className="w-full mb-6"
            size="lg"
          >
            Sleep Now
          </Button>
        ) : (
          <div className="space-y-4 mb-6">
            <div className="bg-green-600/20 border border-green-500 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-2" />
                <p className="font-semibold text-green-400">Sleep Tracking Active</p>
              </div>
              <p className="text-sm text-green-300">Sweet dreams! 😴</p>
              {alarmSet && (
                <p className="text-sm mt-2 text-green-200">
                  ⏰ Alarm set for {formatTime12Hour(wakeTime)}
                </p>
              )}
            </div>
            
            <Button
              onClick={stopSleepTracking}
              variant="danger"
              className="w-full"
              size="lg"
            >
              Stop Tracking
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SleepScreen