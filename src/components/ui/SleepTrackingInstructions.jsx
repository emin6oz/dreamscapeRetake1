import React from 'react'
import { useSleepTrackingContext } from '../../context/SleepTrackingContext'
import { Moon, Zap } from 'lucide-react'

const TrackingStatusBanner = () => {
  const { isTracking, alarmSet, formatTime12Hour, wakeTime } = useSleepTrackingContext()

  if (!isTracking) return null

  return (
    <div className="bg-green-600/20 border border-green-500 rounded-xl p-3 mb-4 mx-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3" />
          <div>
            <div className="flex items-center">
              <Moon className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-green-400 font-medium text-sm">Sleep Tracking Active</span>
            </div>
            {alarmSet && (
              <div className="flex items-center mt-1">
                <Zap className="w-3 h-3 text-green-300 mr-1" />
                <span className="text-green-300 text-xs">
                  Alarm: {formatTime12Hour(wakeTime)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-green-300 text-xs">
          Tracking continues
        </div>
      </div>
    </div>
  )
}

export default TrackingStatusBanner