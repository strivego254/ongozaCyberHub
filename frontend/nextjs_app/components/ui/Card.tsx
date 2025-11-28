import { ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
  glow?: boolean
  gradient?: 'defender' | 'leadership' | 'none'
}

export const Card = ({ children, className, glow = false, gradient = 'none' }: CardProps) => {
  const gradientClasses = {
    defender: 'bg-defender-gradient',
    leadership: 'bg-leadership-gradient',
    none: 'bg-och-midnight border border-och-steel/20',
  }
  
  return (
    <div
      className={clsx(
        'rounded-xl p-6 shadow-lg',
        gradientClasses[gradient],
        glow && 'animate-pulse-glow',
        className
      )}
    >
      {children}
    </div>
  )
}

