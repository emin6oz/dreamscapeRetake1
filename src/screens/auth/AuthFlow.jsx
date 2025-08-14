import React, { useState } from 'react'
import LoginScreen from './LoginScreen'
import SignupScreen from './SignupScreen'

const AuthFlow = () => {
  const [currentAuth, setCurrentAuth] = useState('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {currentAuth === 'login' ? (
        <LoginScreen onSwitchToSignup={() => setCurrentAuth('signup')} />
      ) : (
        <SignupScreen onSwitchToLogin={() => setCurrentAuth('login')} />
      )}
    </div>
  )
}

export default AuthFlow