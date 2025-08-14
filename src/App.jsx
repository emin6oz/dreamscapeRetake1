import React from 'react'
import './App.css'
import { useAuth } from './context/AuthContext'
import AuthFlow from './screens/auth/AuthFlow'
import MainApp from './screens/main/MainApp'
import WelcomeScreen from './screens/onboarding/WelcomeScreen'

function App() {
  const { user, isLoading, showWelcome } = useAuth()

  if (isLoading) {
    return (
      <div className="app-container items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Sleep Tracker...</p>
        </div>
      </div>
    )
  }

  if (showWelcome) {
    return <WelcomeScreen />
  }

  if (!user) {
    return <AuthFlow />
  }

  return <MainApp />
}

export default App