import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/formatters'

const variantStyles = {
  primary: 'bg-[#4F46E5] hover:bg-[#4338CA] text-white border-transparent shadow-sm',
  secondary: 'bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#374151] border-transparent',
  outline: 'bg-transparent text-[#4F46E5] border-[#4F46E5] hover:bg-[#EEF2FF]',
  ghost: 'bg-transparent text-[#4F46E5] border-transparent hover:bg-[#EEF2FF]',
  danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white border-transparent shadow-sm',
}

const sizeStyles = {
  sm: 'text-xs px-3 py-1.5 rounded-[6px] gap-1.5',
  md: 'text-sm px-4 py-2 rounded-[8px] gap-2',
  lg: 'text-base px-6 py-3 rounded-[10px] gap-2.5',
  icon: 'p-2 rounded-[8px] justify-center',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors border outline-none select-none',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        isDisabled && 'opacity-60 cursor-not-allowed pointer-events-none bg-[#F3F4F6] text-[#9CA3AF] border-transparent shadow-none',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />}
          {children}
          {RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  )
}
