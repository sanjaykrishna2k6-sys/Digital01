import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '../../utils/formatters'
import { Button } from './Button'

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'Get started by creating your first entry.',
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E5E7EB] rounded-[12px] p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-[12px] bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] mb-3.5">
        <Icon className="w-6 h-6" />
      </div>

      <h4 className="text-sm font-semibold text-[#374151] mb-1.5">{title}</h4>
      <p className="text-xs text-[#9CA3AF] mb-5 max-w-xs">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
