import React, { useState } from 'react'
import BottomTabNavigator from '../../components/navigation/BottomTabNavigator'
import SleepScreen from './SleepScreen'
import StatisticsScreen from './StatisticsScreen'
import ScanScreen from './ScanScreen'
import ProfileScreen from './ProfileScreen'
import IOSInstallPrompt from '../../components/ui/IOSInstallPrompt'
import { TAB_ROUTES } from '../../utils/constants'

const MainApp = () => {
  const [currentScreen, setCurrentScreen] = useState(TAB_ROUTES.SLEEP)

  const renderScreen = () => {
    switch (currentScreen) {
      case TAB_ROUTES.SLEEP:
        return <SleepScreen />
      case TAB_ROUTES.SCAN:
        return <ScanScreen />
      case TAB_ROUTES.STATISTICS:
        return <StatisticsScreen />
      case TAB_ROUTES.PROFILE:
        return <ProfileScreen />
      default:
        return <SleepScreen />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 relative">
      {/* Main content area with padding for bottom nav */}
      <div className="flex-1 pb-20 overflow-y-auto">
        {renderScreen()}
      </div>
      
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomTabNavigator 
          currentScreen={currentScreen} 
          setCurrentScreen={setCurrentScreen} 
        />
      </div>

      {/* iOS Install Prompt */}
      <IOSInstallPrompt />
    </div>
  )
}

export default MainApp