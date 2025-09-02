// src/components/UI/Button.jsx
import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

const Button = forwardRef(({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  asChild = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  type = 'button',
  ...props
}, ref) => {
  
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'relative overflow-hidden'
  ]

  const variants = {
    default: [
      'bg-primary text-white shadow-sm',
      'hover:bg-primary/90 focus:ring-primary',
      'border border-primary'
    ],
    secondary: [
      'bg-secondary text-white shadow-sm',
      'hover:bg-secondary/90 focus:ring-secondary',
      'border border-secondary'
    ],
    outline: [
      'bg-transparent text-primary border border-primary',
      'hover:bg-primary hover:text-white focus:ring-primary'
    ],
    ghost: [
      'bg-transparent text-text-secondary border border-transparent',
      'hover:bg-background hover:text-text focus:ring-primary'
    ],
    danger: [
      'bg-red-500 text-white shadow-sm',
      'hover:bg-red-600 focus:ring-red-500',
      'border border-red-500'
    ],
    success: [
      'bg-green-500 text-white shadow-sm',
      'hover:bg-green-600 focus:ring-green-500',
      'border border-green-500'
    ],
    warning: [
      'bg-yellow-500 text-white shadow-sm',
      'hover:bg-yellow-600 focus:ring-yellow-500',
      'border border-yellow-500'
    ]
  }

  const sizes = {
    xs: 'h-6 px-2 text-xs rounded',
    sm: 'h-8 px-3 text-sm rounded-md',
    md: 'h-10 px-4 text-sm rounded-md',
    lg: 'h-11 px-6 text-base rounded-md',
    xl: 'h-12 px-8 text-base rounded-lg'
  }

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-5 w-5'
  }

  const classes = clsx(
    baseClasses,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  )

  const content = (
    <>
      {/* Loading spinner overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-inherit"
        >
          <Loader2 className={clsx('animate-spin', iconSizes[size])} />
        </motion.div>
      )}

      {/* Button content */}
      <span className={clsx('flex items-center', loading && 'invisible')}>
        {leftIcon && (
          <span className={clsx('mr-2', iconSizes[size])}>
            {leftIcon}
          </span>
        )}
        
        <span>{children}</span>
        
        {rightIcon && (
          <span className={clsx('ml-2', iconSizes[size])}>
            {rightIcon}
          </span>
        )}
      </span>
    </>
  )

  if (asChild) {
    return React.cloneElement(children, {
      className: clsx(classes, children.props.className),
      disabled: disabled || loading,
      ...props
    })
  }

  return (
    <motion.button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      type={type}
      onClick={onClick}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {content}
    </motion.button>
  )
})

Button.displayName = 'Button'

export default Button
