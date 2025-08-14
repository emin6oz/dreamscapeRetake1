import React from 'react'
import { Moon, Scan, BarChart3, User } from 'lucide-react'
import { TAB_ROUTES } from '../../utils/constants'

const BottomTabNavigator = ({ currentScreen, setCurrentScreen }) => {
  const tabs = [
    { id: TAB_ROUTES.SLEEP, label: 'Sleep', icon: Moon },
    { id: TAB_ROUTES.SCAN, label: 'Scan', icon: Scan },
    { id: TAB_ROUTES.STATISTICS, label: 'Statistics', icon: BarChart3 },
    { id: TAB_ROUTES.PROFILE, label: 'Profile', icon: User }
  ]

  return (
    <div className="bg-gray-800 border-t border-gray-700 backdrop-blur-sm bg-gray-800/95">
      <div className="flex justify-around py-3 px-2 safe-area-bottom">
        {tabs.map((tab) => {
          const IconComponent = tab.icon
          const isActive = currentScreen === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentScreen(tab.id)}
              className={`
                flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200
                min-w-0 flex-1 max-w-20
                ${isActive 
                  ? 'text-blue-400 bg-blue-400/10' 
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                }
              `}
            >
              <IconComponent className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-xs font-medium truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomTabNavigator