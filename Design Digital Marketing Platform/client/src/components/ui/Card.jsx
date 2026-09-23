import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../../utils/formatters'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 border-b border-[#F3F4F6] mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('pt-4 border-t border-[#F3F4F6] mt-4 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * KPI Metric Card matching the Figma Design System and Dashboard specification
 */
export function KpiCard({
  label,
  value,
  change,
  positive = true,
  icon: Icon,
  iconBg = '#EEF2FF',
  iconColor = '#4F46E5',
  timeframe = 'vs last month',
  className,
}) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm flex flex-col justify-between transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-[#6B7280] tracking-wide mb-2 uppercase">{label}</p>
          <p className="text-2xl font-bold text-[#111827] tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
        )}
      </div>

      {change && (
        <div className="flex items-center gap-1.5 mt-4 pt-2 border-t border-[#F9FAFB]">
          {positive ? (
            <ArrowUpRight className="w-4 h-4 text-[#16A34A]" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-[#DC2626]" />
          )}
          <span
            className={cn(
              'text-xs font-bold',
              positive ? 'text-[#16A34A]' : 'text-[#DC2626]'
            )}
          >
            {change}
          </span>
          <span className="text-xs text-[#9CA3AF] ml-1">{timeframe}</span>
        </div>
      )}
    </div>
  )
}
