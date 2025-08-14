import React from 'react'

const Loading = ({ size = 'md', text = '', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`
        border-4 border-blue-500 border-t-transparent 
        rounded-full animate-spin ${sizes[size]}
      `} />
      {text && (
        <p className="text-gray-400 text-sm mt-3">{text}</p>
      )}
    </div>
  )
}

export default Loading