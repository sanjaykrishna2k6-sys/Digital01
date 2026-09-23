import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/formatters'

export function Loading({
  title = 'Loading...',
  description = 'This might take a moment',
  fullPage = false,
  size = 'md',
  className,
}) {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        className
      )}
    >
      <Loader2
        className={cn(
          'animate-spin text-[#4F46E5] mb-3.5',
          iconSizes[size] || iconSizes.md
        )}
      />
      {title && (
        <p className="text-sm font-semibold text-[#374151] mb-1">{title}</p>
      )}
      {description && (
        <p className="text-xs text-[#9CA3AF]">{description}</p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}
