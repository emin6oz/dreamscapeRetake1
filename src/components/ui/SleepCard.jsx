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

  // Helper function to format ISO timestamps to readable time
  const formatTimeFromISO = (isoString) => {
    if (!isoString) return 'Unknown';
    
    try {
      // If it's already in HH:MM format, return as is
      if (typeof isoString === 'string' && isoString.match(/^\d{2}:\d{2}$/)) {
        return isoString;
      }
      
      // Convert ISO string to local time
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return isoString; // Return original if conversion fails
    }
  }

  // Get properly formatted times for display
  const getDisplayTimes = () => {
    // For bedtime, prefer sleepTime (HH:MM format), then convert startTime
    const bedtime = session.sleepTime || formatTimeFromISO(session.startTime);
    
    // For wake time, prefer actualWakeTime, then wakeTime, then convert endTime
    const wakeTime = session.actualWakeTime || session.wakeTime || formatTimeFromISO(session.endTime);
    
    return { bedtime, wakeTime };
  }

  const { bedtime, wakeTime } = getDisplayTimes();

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
            {isActive 
              ? `Started at ${bedtime}` 
              : `${bedtime} → ${wakeTime}`
            }
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
      
      {/* Show movement data summary if available */}
      {session.movementData && session.movementData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-500">
            {session.movementData.length} movement samples recorded
          </p>
        </div>
      )}
      
      {/* Show movement data summary from the new format */}
      {session.movementDataSummary && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{session.movementDataSummary.totalSamples} samples</span>
            <span>{session.movementDataSummary.restlessPeriods} restless periods</span>
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="mt-3 pt-3 border-t border-gray-600">
          <p className="text-xs text-gray-400">
            Sleep tracking started at {bedtime}
          </p>
        </div>
      )}
      
      {/* Debug info - remove this once everything works */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-600">
          <div>Raw times: {session.startTime} → {session.endTime}</div>
          <div>Formatted: {bedtime} → {wakeTime}</div>
          <div>Duration: {session.duration}h | Active: {session.isActive ? 'Yes' : 'No'}</div>
        </div>
      )} */}
    </div>
  )
}

export default SleepCard