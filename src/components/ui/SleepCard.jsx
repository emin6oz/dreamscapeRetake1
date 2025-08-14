import React from 'react'
import { ChevronRight } from 'lucide-react'
import { formatTime12Hour, getTimeDifference } from '../../utils/timeUtils'

const SleepCard = ({ session, isActive = false, onClick }) => {
  // Helper function to format duration nicely
  const formatDuration = (duration) => {
    if (!duration || duration === 0) return '0h'
    if (duration < 0.1) return '0.1h'
    return `${duration.toFixed(1)}h`
  }

  return (
    <div 
      className={`
        bg-gray-700 rounded-xl p-3 border transition-all duration-200 
        ${isActive 
          ? 'border-green-500 bg-green-900/20' 
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-650 cursor-pointer'
        }
      `}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="font-medium text-white">{session.date}</p>
          <p className="text-sm text-gray-400">
            {session.startTime} → {session.endTime || 'Active'}
          </p>
        </div>
        <div className="flex items-center">
          <div className="text-right mr-2">
            {isActive ? (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                <span className="text-green-400 font-semibold">Tracking...</span>
              </div>
            ) : (
              <p className="font-semibold text-blue-400 text-lg">
                {formatDuration(session.duration)}
              </p>
            )}
          </div>
          {!isActive && (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
      
      {session.movementData && session.movementData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-500">
            {session.movementData.length} movement samples recorded
          </p>
        </div>
      )}
      
      {isActive && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            Sleep tracking started at {session.startTime}
          </p>
        </div>
      )}
    </div>
  )
}

export default SleepCard