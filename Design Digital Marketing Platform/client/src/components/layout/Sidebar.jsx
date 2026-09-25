import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Zap,
  LayoutDashboard,
  Target,
  Users,
  FolderOpen,
  FileText,
  Megaphone,
  Search,
  BarChart3,
  PieChart,
  Receipt,
  UserSquare2,
  Plug,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '../../utils/formatters'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
  { icon: UserSquare2, label: 'Users', path: '/users' },
  { icon: Target, label: 'Leads', path: '/dashboard#leads' },
  { icon: Users, label: 'Clients', path: '/dashboard#clients' },
  { icon: FolderOpen, label: 'Projects', path: '/dashboard#projects' },
  { icon: FileText, label: 'Content', path: '/dashboard#content' },
  { icon: Megaphone, label: 'Campaigns', path: '/dashboard#campaigns' },
  { icon: Search, label: 'SEO', path: '/dashboard#seo' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard#analytics' },
  { icon: PieChart, label: 'Reports', path: '/dashboard#reports' },
  { icon: Receipt, label: 'Invoices', path: '/dashboard#invoices' },
]

const NAV_BOTTOM = [
  { icon: UserSquare2, label: 'Team', path: '/dashboard#team' },
  { icon: Plug, label: 'Integrations', path: '/dashboard#integrations' },
  { icon: Settings, label: 'Settings', path: '/dashboard#settings' },
]

import { useAuth } from '../../context/AuthContext'

export function Sidebar({ className }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // Hide Users from clients as per security requirements
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.path === '/users' && user?.role === 'client') {
      return false
    }
    return true
  })

  return (
    <aside
      className={cn(
        'w-[220px] bg-white border-r border-[#E5E7EB] flex flex-col h-full shrink-0 select-none overflow-y-auto',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-6">
        <div className="w-8 h-8 bg-[#4F46E5] rounded-[8px] flex items-center justify-center shrink-0 shadow-sm">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-[#111827] tracking-tight">Scalevo</h1>
          <p className="text-[11px] text-[#9CA3AF] font-medium">Agency Suite</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/')

          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                'sidebar-nav-item',
                isActive && 'active'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="h-[1px] bg-[#F3F4F6] my-3 mx-1" />

        {NAV_BOTTOM.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              to={item.path}
              className="sidebar-nav-item"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[#F3F4F6] mt-2">
        <div className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-[#F9FAFB] transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'SA'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#111827] truncate">{user?.name || 'Super Admin'}</p>
            <p className="text-[10px] text-[#9CA3AF] truncate capitalize">
              {user?.role ? user.role.replace('_', ' ') : 'Agency Manager'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="text-[#9CA3AF] hover:text-[#DC2626] p-1 rounded transition-colors"
            aria-label="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
