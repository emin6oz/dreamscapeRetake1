import React from 'react'
import { timeToAngle } from '../../utils/timeUtils'

const CircularClock = ({ sleepTime, wakeTime, size = 320 }) => {
  const sleepAngle = timeToAngle(sleepTime)
  const wakeAngle = timeToAngle(wakeTime)
  
  const centerX = size / 2
  const centerY = size / 2
  const radius = (size / 2) - 40
  
  const sleepX = centerX + radius * Math.cos((sleepAngle - 90) * Math.PI / 180)
  const sleepY = centerY + radius * Math.sin((sleepAngle - 90) * Math.PI / 180)
  const wakeX = centerX + radius * Math.cos((wakeAngle - 90) * Math.PI / 180)
  const wakeY = centerY + radius * Math.sin((wakeAngle - 90) * Math.PI / 180)
  
  // Calculate arc direction
  let sleepDuration = wakeAngle - sleepAngle
  if (sleepDuration < 0) sleepDuration += 360
  const largeArcFlag = sleepDuration > 180 ? 1 : 0

  return (
    <div className="relative">
      <svg width={size} height={size} className="mx-auto">
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth="8"
        />
        
        {/* Sleep period arc */}
        <path
          d={`M ${sleepX} ${sleepY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${wakeX} ${wakeY}`}
          fill="none"
          stroke="#FCD34D"
          strokeWidth="8"
          strokeLinecap="round"
          className="drop-shadow-lg"
        />
        
        {/* Time labels */}
        <text x={centerX} y="50" textAnchor="middle" className="fill-white text-sm font-medium">
          12AM
        </text>
        <text x={size - 50} y={centerY + 5} textAnchor="middle" className="fill-white text-sm font-medium">
          6AM
        </text>
        <text x={centerX} y={size - 30} textAnchor="middle" className="fill-white text-sm font-medium">
          12PM
        </text>
        <text x="50" y={centerY + 5} textAnchor="middle" className="fill-white text-sm font-medium">
          6PM
        </text>
        
        {/* Sleep time indicator */}
        <circle cx={sleepX} cy={sleepY} r="8" fill="#FCD34D" className="drop-shadow-md" />
        <circle cx={sleepX} cy={sleepY} r="4" fill="#1F2937" />
        
        {/* Wake time indicator */}
        <circle cx={wakeX} cy={wakeY} r="12" fill="#9CA3AF" className="drop-shadow-md" />
        <text x={wakeX} y={wakeY + 2} textAnchor="middle" className="fill-white text-xs">
          🌙
        </text>
      </svg>
    </div>
  )
}

export default CircularClock