// src/components/UI/Card.jsx
import React, { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

const Card = forwardRef(({
  children,
  className = '',
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  border = 'default',
  hover = false,
  interactive = false,
  gradient = false,
  onClick,
  ...props
}, ref) => {

  const baseClasses = [
    'bg-surface rounded-lg transition-all duration-200'
  ]

  const variants = {
    default: 'bg-surface',
    elevated: 'bg-surface border border-card-border',
    outlined: 'bg-transparent border border-card-border',
    filled: 'bg-background',
    glass: 'bg-surface/80 backdrop-blur-sm border border-white/10'
  }

  const paddings = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    md: 'p-5',
    lg: 'p-6',
    xl: 'p-8'
  }

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-md',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  }

  const borders = {
    none: '',
    default: 'border border-card-border',
    primary: 'border border-primary',
    secondary: 'border border-secondary',
    success: 'border border-green-500',
    warning: 'border border-yellow-500',
    danger: 'border border-red-500'
  }

  const hoverClasses = hover ? [
    'hover:shadow-lg hover:-translate-y-0.5',
    'hover:border-primary/20'
  ] : []

  const interactiveClasses = interactive || onClick ? [
    'cursor-pointer',
    'hover:shadow-md hover:border-primary/30',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    'active:scale-95'
  ] : []

  const gradientClasses = gradient ? [
    'bg-gradient-to-br from-primary/5 to-secondary/5'
  ] : []

  const classes = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    shadows[shadow],
    borders[border],
    hoverClasses,
    interactiveClasses,
    gradientClasses,
    className
  )

  const Component = interactive || onClick ? motion.div : 'div'
  const motionProps = interactive || onClick ? {
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 },
    transition: { duration: 0.2 }
  } : {}

  return (
    <Component
      ref={ref}
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
        }
      } : undefined}
      {...motionProps}
      {...props}
    >
      {children}
    </Component>
  )
})

Card.displayName = 'Card'

// Sub-components for better organization
const CardHeader = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={clsx('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  >
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(({ 
  children, 
  className = '',
  as: Component = 'h3',
  ...props 
}, ref) => (
  <Component
    ref={ref}
    className={clsx('text-lg font-semibold leading-none tracking-tight text-text', className)}
    {...props}
  >
    {children}
  </Component>
))

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <p
    ref={ref}
    className={clsx('text-sm text-text-secondary', className)}
    {...props}
  >
    {children}
  </p>
))

CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={clsx('pt-0', className)}
    {...props}
  >
    {children}
  </div>
))

CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={clsx('flex items-center pt-4', className)}
    {...props}
  >
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'

// Export all components
Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
