import React, { createContext, useContext, useState, useEffect } from 'react'
import { getFromStorage, saveToStorage } from '../utils/storage'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = getFromStorage('user')
        const hasSeenWelcome = getFromStorage('hasSeenWelcome')
        
        if (!hasSeenWelcome) {
          setShowWelcome(true)
        } else if (savedUser) {
          setUser(savedUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    try {
      // Simulate API call
      const userData = {
        id: Date.now(),
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString()
      }
      
      setUser(userData)
      saveToStorage('user', userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signup = async (email, password, name) => {
    try {
      // Simulate API call
      const userData = {
        id: Date.now(),
        email,
        name,
        createdAt: new Date().toISOString()
      }
      
      setUser(userData)
      saveToStorage('user', userData)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setUser(null)
    saveToStorage('user', null)
  }

  const completeWelcome = () => {
    setShowWelcome(false)
    saveToStorage('hasSeenWelcome', true)
  }

  const value = {
    user,
    isLoading,
    showWelcome,
    login,
    signup,
    logout,
    completeWelcome
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}