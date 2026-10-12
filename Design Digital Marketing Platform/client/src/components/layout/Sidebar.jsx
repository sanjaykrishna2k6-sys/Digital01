import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Zap,
  LayoutDashboard,
  Target,
  Users,
  ShoppingBag,
  FolderOpen,
  FileText,
  Megaphone,
  Search,
  BarChart3,
  PieChart,
  Receipt,
  UserSquare2,
  Settings,
  LogOut,
  CheckSquare,
  Layers,
  FileCheck,
  Bell,
} from 'lucide-react'
import { cn } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'

const NAV_GROUPS = [
  {
    title: 'Core Platform',
    items: [
      { icon: Search, label: 'SEO Intelligence', path: '/seo', badge: 'Core' },
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    title: 'Client Management',
    items: [
      { icon: Users, label: 'Clients', path: '/clients', roleRestricted: true },
      { icon: Target, label: 'Leads', path: '/leads', roleRestricted: true },
      { icon: Layers, label: 'Services', path: '/services' },
    ],
  },
  {
    title: 'Work Management',
    items: [
      { icon: FolderOpen, label: 'Projects', path: '/projects' },
      { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
      { icon: FileText, label: 'Content', path: '/content' },
      { icon: FileCheck, label: 'Approvals', path: '/approvals' },
      { icon: Megaphone, label: 'Campaigns', path: '/campaigns' },
    ],
  },
  {
    title: 'Marketing Intelligence',
    items: [
      { icon: ShoppingBag, label: 'Shopify Store', path: '/shopify', roleRestricted: true },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: PieChart, label: 'Reports', path: '/reports' },
    ],
  },
  {
    title: 'Business Management',
    items: [
      { icon: Receipt, label: 'Billing', path: '/billing', roleRestricted: true },
      { icon: Bell, label: 'Notifications', path: '/notifications' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { icon: UserSquare2, label: 'Users', path: '/users', roleRestricted: true },
      { icon: Settings, label: 'Settings', path: '/settings', roleRestricted: true },
    ],
  },
]

export function Sidebar({ className }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isClient = user?.role === 'client'

  return (
    <aside
      className={cn(
        'w-[230px] bg-white border-r border-[#E5E7EB] flex flex-col h-full shrink-0 select-none overflow-y-auto',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-5 border-b border-[#F3F4F6]">
        <div className="w-8 h-8 bg-[#4F46E5] rounded-[8px] flex items-center justify-center shrink-0 shadow-sm">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div className="leading-tight">
          <h1 className="text-sm font-bold text-[#111827] tracking-tight">Krishpo</h1>
          <p className="text-[11px] text-[#9CA3AF] font-medium">Agency Platform</p>
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4">
        {NAV_GROUPS.map((group) => {
          // Filter items based on client role restrictions
          const visibleItems = group.items.filter((item) => !(isClient && item.roleRestricted))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.title} className="space-y-1">
              <p className="px-2 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">
                {group.title}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))

                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={cn(
                      'sidebar-nav-item flex items-center justify-between',
                      isActive && 'active'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-[#4F46E5] px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User Profile Footer & Logout */}
      <div className="p-3 border-t border-[#F3F4F6] mt-auto">
        <div className="flex items-center gap-2.5 p-2 rounded-[8px] bg-[#F9FAFB] border border-[#F3F4F6]">
          <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'KP'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#111827] truncate">{user?.name || 'Krishpo User'}</p>
            <p className="text-[10px] text-[#9CA3AF] truncate capitalize">
              {user?.role ? user.role.replace('_', ' ') : 'Agency Manager'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out of Krishpo"
            className="text-[#9CA3AF] hover:text-[#DC2626] p-1.5 rounded-md hover:bg-rose-50 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
