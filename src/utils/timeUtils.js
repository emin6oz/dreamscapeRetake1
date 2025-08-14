// Convert time string to angle for circular clock
export const timeToAngle = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const totalMinutes = (hours % 12) * 60 + minutes
  return (totalMinutes / (12 * 60)) * 360
}

// Format time to 12-hour format with AM/PM
export const formatTime12Hour = (timeStr) => {
  if (timeStr === '00:00') return '12:00 AM'
  
  try {
    return new Date(`2024-01-01T${timeStr}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    return timeStr
  }
}

// Calculate sleep duration in hours
export const calculateSleepDuration = (sleepTime, wakeTime) => {
  const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number)
  const [wakeHours, wakeMinutes] = wakeTime.split(':').map(Number)
  
  const sleepTotalMinutes = sleepHours * 60 + sleepMinutes
  let wakeTotalMinutes = wakeHours * 60 + wakeMinutes
  
  if (wakeTotalMinutes <= sleepTotalMinutes) {
    wakeTotalMinutes += 24 * 60
  }
  
  const durationMinutes = wakeTotalMinutes - sleepTotalMinutes
  return Math.round((durationMinutes / 60) * 10) / 10
}

// Get time difference in readable format
export const getTimeDifference = (date1, date2) => {
  const diffMs = Math.abs(date2 - date1)
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHours === 0) {
    return `${diffMinutes}m`
  }
  return `${diffHours}h ${diffMinutes}m`
}

// Check if current time is within sleep window
export const isInSleepWindow = (sleepTime, wakeTime) => {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  const [sleepHour, sleepMin] = sleepTime.split(':').map(Number)
  const [wakeHour, wakeMin] = wakeTime.split(':').map(Number)
  const [currentHour, currentMin] = currentTime.split(':').map(Number)
  
  const sleepMinutes = sleepHour * 60 + sleepMin
  const wakeMinutes = wakeHour * 60 + wakeMin
  const currentMinutes = currentHour * 60 + currentMin
  
  if (sleepMinutes > wakeMinutes) {
    // Sleep time crosses midnight
    return currentMinutes >= sleepMinutes || currentMinutes <= wakeMinutes
  } else {
    // Sleep time is within same day
    return currentMinutes >= sleepMinutes && currentMinutes <= wakeMinutes
  }
}