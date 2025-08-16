// Create src/components/ui/DetailedSleepView.jsx

import React, { useState } from 'react'
import { ArrowLeft, Clock, TrendingUp, Moon, Activity, BarChart3 } from 'lucide-react'
import Button from '../common/Button'

const DetailedSleepView = ({ session, onBack }) => {
  const [selectedTab, setSelectedTab] = useState('overview')

  // Format duration nicely
  const formatDuration = (duration) => {
    if (!duration) return '0h 0m'
    const hours = Math.floor(duration)
    const minutes = Math.round((duration - hours) * 60)
    return `${hours}h ${minutes}m`
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

  // Format date to readable format
  const formatDateDisplay = (isoString) => {
    if (!isoString) return 'Unknown';
    
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return isoString;
    }
  }

  const { bedtime, wakeTime } = getDisplayTimes();

  // Generate sleep phases based on movement data
  const generateSleepPhases = () => {
    // Handle both old movementData array and new movementDataSummary format
    let movementData = session.movementData;
    
    // If no movementData but we have movementDataSummary, create fake data for visualization
    if ((!movementData || movementData.length === 0) && session.movementDataSummary) {
      const { totalSamples, averageMovement, restlessPeriods } = session.movementDataSummary;
      
      // Create a simplified visualization based on summary data
      movementData = [];
      for (let i = 0; i < Math.min(totalSamples, 50); i++) {
        // Generate movement values based on averages and restless periods
        const isRestless = i < restlessPeriods;
        const movement = isRestless ? 
          averageMovement * 2 + Math.random() * 2 : 
          averageMovement + Math.random() * 0.5;
        
        movementData.push({
          movement,
          time: `Sample ${i + 1}`,
          intensity: movement > 6 ? 'restless' : movement > 3 ? 'light' : 'calm'
        });
      }
    }

    if (!movementData || movementData.length === 0) {
      return []
    }

    const phases = []
    const dataToUse = movementData.slice().reverse() // Start from earliest

    for (let i = 0; i < dataToUse.length; i++) {
      const movement = dataToUse[i].movement
      let phase = 'deep'
      
      if (movement > 8) phase = 'awake'
      else if (movement > 5) phase = 'light'
      else if (movement > 3) phase = 'rem'
      
      phases.push({
        time: dataToUse[i].time,
        phase,
        movement,
        index: i
      })
    }
    
    return phases
  }

  const sleepPhases = generateSleepPhases()

  // Calculate sleep quality score
  const calculateSleepQuality = () => {
    // Use movementDataSummary if available, otherwise fall back to old format
    if (session.movementDataSummary) {
      const { averageMovement, restlessPeriods, totalSamples } = session.movementDataSummary;
      
      const durationScore = Math.min(session.duration / 8 * 100, 100);
      const movementScore = Math.max(100 - (averageMovement * 10), 0);
      const restfulnessScore = totalSamples > 0 ? 
        Math.max(100 - ((restlessPeriods / totalSamples) * 100), 0) : 85;

      return Math.round((durationScore + movementScore + restfulnessScore) / 3);
    }

    // Fallback to old calculation if movementData exists
    if (!session.movementData || session.movementData.length === 0) return 85

    const avgMovement = session.movementData.reduce((sum, data) => sum + data.movement, 0) / session.movementData.length
    const restlessness = session.movementData.filter(data => data.movement > 6).length / session.movementData.length

    const durationScore = Math.min(session.duration / 8 * 100, 100)
    const movementScore = Math.max(100 - (avgMovement * 10), 0)
    const restfulnessScore = Math.max(100 - (restlessness * 100), 0)

    return Math.round((durationScore + movementScore + restfulnessScore) / 3)
  }

  const sleepQuality = calculateSleepQuality()

  // Movement Graph Component
  const MovementGraph = () => {
    // Handle both movementData and movementDataSummary
    let dataToDisplay = session.movementData;
    
    if ((!dataToDisplay || dataToDisplay.length === 0) && session.movementDataSummary) {
      // Generate visualization data from summary
      const { totalSamples, averageMovement, restlessPeriods } = session.movementDataSummary;
      dataToDisplay = [];
      
      for (let i = 0; i < Math.min(totalSamples, 50); i++) {
        const isRestless = i < restlessPeriods;
        const movement = isRestless ? 
          averageMovement * 2 + Math.random() * 2 : 
          averageMovement + Math.random() * 0.5;
        
        dataToDisplay.push({
          movement,
          time: `${Math.floor(i * (session.duration * 60) / totalSamples)}min`,
          intensity: movement > 6 ? 'restless' : movement > 3 ? 'light' : 'calm'
        });
      }
    }

    if (!dataToDisplay || dataToDisplay.length === 0) {
      return (
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400">No movement data available</p>
          {session.movementDataSummary && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Summary: {session.movementDataSummary.totalSamples} samples recorded</p>
              <p>Average movement: {session.movementDataSummary.averageMovement?.toFixed(2)}</p>
              <p>Restless periods: {session.movementDataSummary.restlessPeriods}</p>
            </div>
          )}
        </div>
      )
    }

    const maxMovement = Math.max(...dataToDisplay.map(d => d.movement))
    
    return (
      <div className="bg-gray-800 rounded-xl p-4">
        <h4 className="font-semibold mb-4 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-blue-400" />
          Movement During Sleep
        </h4>
        
        {/* Graph */}
        <div className="relative h-32 bg-gray-900 rounded-lg p-2 mb-4">
          <div className="flex items-end justify-between h-full">
            {dataToDisplay.slice(0, 50).map((data, index) => {
              const height = (data.movement / maxMovement) * 100
              const color = data.movement > 6 ? 'bg-red-400' : 
                           data.movement > 3 ? 'bg-yellow-400' : 'bg-green-400'
              
              return (
                <div
                  key={index}
                  className={`w-1 ${color} rounded-t`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`Movement: ${data.movement.toFixed(1)} at ${data.time}`}
                />
              )
            })}
          </div>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
            <span>High</span>
            <span>Low</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
            <span className="text-gray-400">Deep Sleep</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
            <span className="text-gray-400">Light Sleep</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
            <span className="text-gray-400">Restless</span>
          </div>
        </div>
        
        {/* Show summary if using generated data */}
        {session.movementDataSummary && (!session.movementData || session.movementData.length === 0) && (
          <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
            <p>* Graph generated from movement summary data</p>
          </div>
        )}
      </div>
    )
  }

  // Sleep Phases Timeline
  const SleepTimeline = () => {
    if (sleepPhases.length === 0) {
      return (
        <div className="bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400">No sleep phase data available</p>
          {session.movementDataSummary && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Movement summary shows {session.movementDataSummary.totalSamples} samples were recorded</p>
            </div>
          )}
        </div>
      )
    }

    const phaseColors = {
      awake: 'bg-red-400',
      light: 'bg-yellow-400', 
      rem: 'bg-blue-400',
      deep: 'bg-green-400'
    }

    return (
      <div className="bg-gray-800 rounded-xl p-4">
        <h4 className="font-semibold mb-4 flex items-center">
          <Moon className="w-4 h-4 mr-2 text-purple-400" />
          Sleep Phases Timeline
        </h4>
        
        {/* Timeline */}
        <div className="relative h-8 bg-gray-900 rounded-lg mb-4 overflow-hidden">
          <div className="flex h-full">
            {sleepPhases.map((phase, index) => (
              <div
                key={index}
                className={`${phaseColors[phase.phase]} flex-1`}
                title={`${phase.phase} sleep at ${phase.time}`}
              />
            ))}
          </div>
        </div>
        
        {/* Phase Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
            <span className="text-gray-400">Deep Sleep</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded mr-2"></div>
            <span className="text-gray-400">REM Sleep</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
            <span className="text-gray-400">Light Sleep</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded mr-2"></div>
            <span className="text-gray-400">Awake</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto">
      <div className="p-6 pb-24">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="mr-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Sleep Details</h1>
              <p className="text-gray-400 text-sm">{session.date}</p>
            </div>
          </div>

          {/* Sleep Quality Score */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 mb-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Sleep Quality Score</h3>
            <div className="text-4xl font-bold mb-2">{sleepQuality}</div>
            <p className="text-sm opacity-90">
              {sleepQuality >= 80 ? 'Excellent sleep!' : 
               sleepQuality >= 60 ? 'Good sleep' : 
               sleepQuality >= 40 ? 'Fair sleep' : 'Poor sleep'}
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('movement')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'movement' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Movement
            </button>
            <button
              onClick={() => setSelectedTab('phases')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedTab === 'phases' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Phases
            </button>
          </div>

          {/* Tab Content */}
          {selectedTab === 'overview' && (
            <div className="space-y-4">
              {/* Basic Stats */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-400" />
                  Sleep Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Bedtime</p>
                    <p className="font-semibold">{bedtime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Wake Time</p>
                    <p className="font-semibold">{wakeTime}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="font-semibold text-blue-400">{formatDuration(session.duration)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Efficiency</p>
                    <p className="font-semibold text-green-400">{sleepQuality}%</p>
                  </div>
                </div>
                
                {/* Debug info for development */}
                {/* {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-600">
                    <div>Raw bedtime: {session.startTime}</div>
                    <div>Raw wake time: {session.endTime}</div>
                    <div>Formatted: {bedtime} → {wakeTime}</div>
                  </div>
                )} */}
              </div>

              {/* Movement Summary */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                  Movement Summary
                </h4>
                
                {session.movementDataSummary ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Total Samples</p>
                      <p className="font-semibold">{session.movementDataSummary.totalSamples}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Average Movement</p>
                      <p className="font-semibold">{session.movementDataSummary.averageMovement?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Restless Periods</p>
                      <p className="font-semibold text-yellow-400">{session.movementDataSummary.restlessPeriods}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Sleep Quality</p>
                      <p className="font-semibold text-green-400">{sleepQuality}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Total Movements</p>
                      <p className="font-semibold">{session.movementData?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Restless Periods</p>
                      <p className="font-semibold text-yellow-400">
                        {session.movementData?.filter(d => d.movement > 6).length || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sleep Recommendations */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-purple-400" />
                  Recommendations
                </h4>
                <div className="space-y-2 text-sm text-gray-300">
                  {session.duration < 7 && (
                    <p>• Try to sleep 7-9 hours for optimal recovery</p>
                  )}
                  {((session.movementDataSummary?.restlessPeriods || 0) > 10 || 
                    (session.movementData?.filter(d => d.movement > 6).length || 0) > 10) && (
                    <p>• Consider a more comfortable mattress or pillow</p>
                  )}
                  {sleepQuality < 70 && (
                    <p>• Create a darker, quieter sleep environment</p>
                  )}
                  {sleepQuality >= 80 && (
                    <p>• Great sleep! Keep up the good routine</p>
                  )}
                  {session.duration >= 7 && session.duration <= 9 && sleepQuality >= 70 && (
                    <p>• Your sleep duration and quality are in the healthy range</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'movement' && <MovementGraph />}
          {selectedTab === 'phases' && <SleepTimeline />}
        </div>
      </div>
    </div>
  )
}

export default DetailedSleepView