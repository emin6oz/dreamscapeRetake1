import React, { useState, useMemo } from 'react'
import { Moon, TrendingUp, Calendar, BarChart3, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import useSleepTracking from '../../hooks/useSleepTracking'
import StatCard from '../../components/ui/StatCard'
import SleepCard from '../../components/ui/SleepCard'
import DetailedSleepView from '../../components/ui/DetailedSleepView'

const StatisticsScreen = () => {
  const { sleepData, movementData, calculateStats } = useSleepTracking()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState(null)
  const [showDetailed, setShowDetailed] = useState(false)

  // Helper function to format hours nicely
  const formatHours = (hours) => {
    if (hours === 0) return '0h'
    if (hours < 0.1) return '0.1h'
    return `${hours.toFixed(1)}h`
  }

  // Get available dates (dates with sleep data)
  const availableDates = useMemo(() => {
    const dates = new Set()
    sleepData.forEach(session => {
      if (!session.isActive) {
        const sessionDate = new Date(session.date)
        dates.add(sessionDate.toDateString())
      }
    })
    return Array.from(dates).sort((a, b) => new Date(b) - new Date(a))
  }, [sleepData])

  // Filter data by selected date
  const filteredData = useMemo(() => {
    const selectedDateString = selectedDate.toDateString()
    return sleepData.filter(session => 
      !session.isActive && session.date === selectedDateString
    )
  }, [sleepData, selectedDate])

  // Calculate stats for selected date or all data
  const stats = calculateStats()
  
  // Generate date picker dates (30 days range)
  const generateDateRange = () => {
    const dates = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      dates.push(date)
    }
    
    return dates
  }

  const dateRange = generateDateRange()

  // Handle sleep card click
  const handleSleepCardClick = (session) => {
    setSelectedSession(session)
    setShowDetailed(true)
  }

  // Date picker component
  const DatePicker = () => {
    const scrollToToday = () => {
      setSelectedDate(new Date())
      // Scroll to today in the date picker
      const todayElement = document.getElementById('date-today')
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-400" />
            Select Date
          </h3>
          <button
            onClick={scrollToToday}
            className="text-blue-400 text-sm hover:text-blue-300"
          >
            Today
          </button>
        </div>
        
        <div className="overflow-x-auto scrollbar-custom">
          <div className="flex space-x-2 pb-2">
            {dateRange.map((date, index) => {
              const dateString = date.toDateString()
              const hasData = availableDates.includes(dateString)
              const isSelected = selectedDate.toDateString() === dateString
              const isToday = new Date().toDateString() === dateString
              
              return (
                <button
                  key={index}
                  id={isToday ? 'date-today' : undefined}
                  onClick={() => setSelectedDate(date)}
                  disabled={!hasData}
                  className={`
                    flex flex-col items-center p-3 rounded-xl min-w-16 transition-all
                    ${isSelected 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : hasData 
                        ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                        : 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                    }
                    ${isToday ? 'ring-2 ring-yellow-400' : ''}
                  `}
                >
                  <span className="text-xs font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-bold">
                    {date.getDate()}
                  </span>
                  <span className="text-xs opacity-75">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  {hasData && (
                    <div className="w-1 h-1 bg-green-400 rounded-full mt-1" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (showDetailed && selectedSession) {
    return (
      <DetailedSleepView 
        session={selectedSession} 
        onBack={() => setShowDetailed(false)} 
      />
    )
  }

  return (
    <div className="flex-1 bg-gray-900 text-white p-6 fade-in">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-medium text-center mb-8">Sleep Statistics</h1>

        {/* Date Picker */}
        <DatePicker />

        {stats ? (
          <div className="space-y-6">
            {/* Show different content based on selection */}
            {filteredData.length > 0 ? (
              <>
                {/* Selected Date Stats */}
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h3 className="font-semibold mb-4 text-center">
                    {selectedDate.toDateString() === new Date().toDateString() 
                      ? "Today's Sleep" 
                      : selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                    }
                  </h3>
                  
                  <div className="space-y-3">
                    {filteredData.map((session) => (
                      <div key={session.id} onClick={() => handleSleepCardClick(session)}>
                        <SleepCard 
                          session={session} 
                          isActive={session.isActive}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 rounded-2xl p-6 text-center">
                <Moon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <h3 className="font-semibold mb-2">No sleep data</h3>
                <p className="text-gray-400 text-sm">
                  No sleep sessions recorded for {selectedDate.toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Overall Stats - Always Show */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="font-semibold mb-4 text-center text-gray-300">Overall Statistics</h3>
              
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard
                  title="Average Sleep"
                  value={formatHours(stats.averageSleep)}
                  icon={TrendingUp}
                  color="blue"
                  subtitle="All time"
                />
                
                <StatCard
                  title="This Week"
                  value={formatHours(stats.weeklyAverage)}
                  icon={Calendar}
                  color="green"
                  subtitle="7 day average"
                />
              </div>

              {/* Extended Stats */}
              <div className="grid grid-cols-1 gap-4 mb-6">
                <StatCard
                  title="Total Sleep Sessions"
                  value={stats.totalSessions}
                  icon={BarChart3}
                  color="purple"
                  subtitle={`${formatHours(stats.totalHours)} total recorded`}
                />
              </div>

              {/* Sleep Quality Metrics */}
              <div className="bg-gray-800 rounded-2xl p-4 mb-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Sleep Quality Overview
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-400">Longest Sleep</p>
                    <p className="text-lg font-semibold text-blue-400">
                      {formatHours(stats.longestSleep)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400">Shortest Sleep</p>
                    <p className="text-lg font-semibold text-yellow-400">
                      {formatHours(stats.shortestSleep)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-400">Last Sleep</p>
                      <p className="text-md font-semibold text-green-400">
                        {formatHours(stats.lastSleep)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Sleep Consistency</p>
                      <p className="text-md font-semibold text-purple-400">
                        {stats.totalSessions > 3 ? 'Good' : 'Building'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sleep Sessions */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-400" />
                  Recent Sleep Sessions
                </h3>
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-custom">
                  {sleepData.slice(-10).reverse().map((session) => (
                    <div key={session.id} onClick={() => handleSleepCardClick(session)}>
                      <SleepCard 
                        session={session} 
                        isActive={session.isActive}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Session Movement Data */}
            {movementData.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Current Session Data
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Movement Samples:</span>
                    <span className="font-semibold">{movementData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Reading:</span>
                    <span className="font-semibold">
                      {movementData[movementData.length - 1]?.time || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-green-400">Active</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <Moon className="w-20 h-20 mx-auto mb-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">No sleep data yet</h2>
            <p className="text-gray-500 mb-6">Start tracking your sleep to see detailed statistics</p>
            <div className="bg-gray-800 rounded-xl p-4 text-left max-w-xs mx-auto">
              <h4 className="font-medium text-white mb-2">Getting Started:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Set your bedtime and wake time</li>
                <li>• Tap "Sleep Now" to start tracking</li>
                <li>• Place your phone on the nightstand</li>
                <li>• Wake up to your alarm</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatisticsScreen