import React, { useState } from 'react'
import { Clock, ChevronDown, ChevronUp, Info } from 'lucide-react'
import useSleepTracking from '../../hooks/useSleepTracking'
import { formatTime12Hour } from '../../utils/timeUtils'
import CircularClock from '../../components/ui/CircularClock'
import Button from '../../components/common/Button'
import SleepTrackingInstructions from '../../components/ui/SleepTrackingInstructions'

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

  const [showSleepTimePicker, setShowSleepTimePicker] = useState(false)
  const [showWakeTimePicker, setShowWakeTimePicker] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  // Handle time change and close picker
  const handleSleepTimeChange = (newTime) => {
    setSleepTime(newTime)
    setShowSleepTimePicker(false)
  }

  const handleWakeTimeChange = (newTime) => {
    setWakeTime(newTime)
    setShowWakeTimePicker(false)
  }

  // Handle start tracking
  const handleStartTracking = async () => {
    setIsStarting(true)
    try {
      await startSleepTracking()
    } catch (error) {
      console.error('Failed to start tracking:', error)
      alert('Failed to start sleep tracking. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  // Handle stop tracking - no confirmation dialog
  const handleStopTracking = () => {
    stopSleepTracking()
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
            onClick={() => setShowInstructions(true)}
            className="p-2 bg-blue-600 rounded-lg"
            title="Instructions"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Tracking Status Indicator */}
        {isTracking && (
          <div className="bg-green-600/20 border border-green-500 rounded-xl p-3 mb-4 text-center">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
              <span className="text-green-400 font-medium text-sm">
                Sleep tracking is active
              </span>
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
            onClick={handleStartTracking}
            disabled={isStarting}
            className="w-full mb-6"
            size="lg"
          >
            {isStarting ? 'Starting...' : 'Sleep Now'}
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
              <p className="text-xs mt-2 text-green-300">
                ✨ You can switch between tabs - tracking continues!
              </p>
            </div>
            
            <Button
              onClick={handleStopTracking}
              variant="danger"
              className="w-full"
              size="lg"
            >
              Stop Tracking & Save Session
            </Button>
          </div>
        )}

        {/* Instructions Modal */}
        {showInstructions && (
          <SleepTrackingInstructions
            onClose={() => setShowInstructions(false)}
            onStartTracking={handleStartTracking}
          />
        )}
      </div>
    </div>
  )
}

export default SleepScreen