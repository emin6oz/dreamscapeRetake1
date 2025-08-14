import React from 'react'
import { Moon, Smartphone, BarChart3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'

const WelcomeScreen = () => {
  const { completeWelcome } = useAuth()

  const features = [
    {
      icon: Moon,
      title: 'Smart Sleep Tracking',
      description: 'Monitor your sleep patterns using device sensors'
    },
    {
      icon: Smartphone,
      title: 'Intelligent Alarms',
      description: 'Wake up naturally with vibration and notifications'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'View comprehensive sleep statistics and trends'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
            <Moon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Sleep Tracker</h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Transform your sleep with intelligent tracking and personalized insights
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4 fade-in" style={{animationDelay: `${index * 0.2}s`}}>
              <div className="bg-white/10 p-3 rounded-full">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        <Button 
          onClick={completeWelcome}
          className="w-full"
          size="lg"
        >
          Get Started
        </Button>
        
        <p className="text-center text-xs text-gray-500 mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default WelcomeScreen