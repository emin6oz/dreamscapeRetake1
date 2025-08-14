import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-full transition-all duration-200 flex items-center justify-center'
  
  const variants = {
    primary: 'bg-white text-blue-600 hover:bg-gray-100 active:bg-gray-200',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    ghost: 'bg-transparent text-white border border-white/20 hover:bg-white/10',
    success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  const disabledStyles = 'opacity-50 cursor-not-allowed'
  
  const buttonStyles = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${disabled || loading ? disabledStyles : ''}
    ${className}
  `

  return (
    <button
      className={buttonStyles}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  )
}

export default Button