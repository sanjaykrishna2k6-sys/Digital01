import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { cn } from '../../utils/formatters'
import { Button } from './Button'

export function ErrorState({
  title = 'Failed to load data',
  description = 'There was an error retrieving the requested information. Please try again.',
  retryLabel = 'Try Again',
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        'bg-white border border-[#FECACA] rounded-[12px] p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-[12px] bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] mb-3.5">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h4 className="text-sm font-semibold text-[#374151] mb-1.5">{title}</h4>
      <p className="text-xs text-[#9CA3AF] mb-5 max-w-xs">{description}</p>

      {onRetry && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRetry}
          leftIcon={RotateCcw}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
