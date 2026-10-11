import React, { useState } from 'react'
import { Search, Bell, HelpCircle, Sparkles } from 'lucide-react'
import { cn } from '../../utils/formatters'
import { AIAssistantModal } from '../ui/AIAssistantModal'

export function Topbar({
  title = 'Overview',
  section = 'Agency',
  onSearch,
  className,
}) {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)

  return (
    <>
      <header
        className={cn(
          'h-[58px] bg-white border-b border-[#E5E7EB] px-7 flex items-center justify-between shrink-0 select-none z-10',
          className
        )}
      >
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#9CA3AF] font-normal">{section}</span>
          <span className="text-[#9CA3AF]">/</span>
          <span className="text-[#374151] font-semibold">{title}</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* AI Assistant Quick Trigger */}
          <button
            type="button"
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
            <span>Ask AI Assistant</span>
          </button>

          {/* Quick Search */}
          <div className="relative flex items-center w-60">
            <Search className="absolute left-3 w-3.5 h-3.5 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              placeholder="Search clients, projects..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-[#374151] placeholder-[#9CA3AF] outline-none focus:border-[#4F46E5] focus:bg-white transition-all"
            />
          </div>

          {/* Notifications Icon Button */}
          <button
            type="button"
            className="relative w-9 h-9 border border-[#E5E7EB] rounded-[8px] bg-white hover:bg-[#F9FAFB] flex items-center justify-center text-[#6B7280] transition-colors"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          </button>

          {/* Help Icon Button */}
          <button
            type="button"
            className="w-9 h-9 border border-[#E5E7EB] rounded-[8px] bg-white hover:bg-[#F9FAFB] flex items-center justify-center text-[#6B7280] transition-colors"
            title="Help & Support"
            aria-label="Help and Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Agency Quick Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#F3F4F6]">
            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5] text-xs font-bold">
              KP
            </div>
            <span className="text-xs font-medium text-[#374151] hidden sm:inline">Krishpo HQ</span>
          </div>
        </div>
      </header>

      <AIAssistantModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
    </>
  )
}
