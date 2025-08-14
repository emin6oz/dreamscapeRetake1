import React from 'react'

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  subtitle,
  trend,
  className = '' 
}) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400'
  }

  return (
    <div className={`bg-gray-800 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center mb-2">
        {Icon && <Icon className={`w-5 h-5 mr-2 ${colorClasses[color]}`} />}
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        {trend && (
          <div className={`text-xs px-2 py-1 rounded-full ${
            trend.type === 'up' 
              ? 'bg-green-900/30 text-green-400' 
              : trend.type === 'down'
              ? 'bg-red-900/30 text-red-400'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {trend.value}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard