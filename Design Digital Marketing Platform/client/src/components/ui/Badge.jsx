import React from 'react'
import { cn } from '../../utils/formatters'

const variantStyles = {
  success: 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]',
  warning: 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
  error:   'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]',
  info:    'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
  neutral: 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]',
  primary: 'bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]',
}

const dotStyles = {
  success: 'bg-[#16A34A]',
  warning: 'bg-[#D97706]',
  error:   'bg-[#DC2626]',
  info:    'bg-[#2563EB]',
  neutral: 'bg-[#4B5563]',
  primary: 'bg-[#4F46E5]',
}

export function Badge({
  children,
  variant = 'neutral',
  withDot = false,
  className,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        variantStyles[variant] || variantStyles.neutral,
        className
      )}
      {...props}
    >
      {withDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotStyles[variant] || dotStyles.neutral
          )}
        />
      )}
      {children}
    </span>
  )
}
