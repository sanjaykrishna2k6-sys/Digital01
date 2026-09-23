import React, { useState } from 'react'
import { Eye, EyeOff, Search, AlertCircle } from 'lucide-react'
import { cn } from '../../utils/formatters'

export function Input({
  label,
  type = 'text',
  error,
  helperText,
  icon: Icon,
  isSearch = false,
  className,
  containerClassName,
  id,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const computedType = isPassword ? (showPassword ? 'text' : 'password') : type
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#374151] tracking-wide"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {isSearch && (
          <Search className="absolute left-3 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
        )}
        {!isSearch && Icon && (
          <Icon className="absolute left-3 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
        )}

        <input
          id={inputId}
          type={computedType}
          className={cn(
            'w-full text-sm text-[#111827] placeholder-[#9CA3AF] bg-white rounded-[8px] transition-all outline-none',
            'border-[1.5px]',
            error
              ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/15'
              : 'border-[#E5E7EB] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15',
            'py-2 px-3',
            (isSearch || Icon) && 'pl-9',
            isPassword && 'pr-10',
            className
          )}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-0.5 text-[#9CA3AF] hover:text-[#4B5563] transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error ? (
        <p className="flex items-center gap-1 text-xs text-[#EF4444] font-medium mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-[#9CA3AF] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  )
}
