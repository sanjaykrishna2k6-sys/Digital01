import React, { useState } from 'react'
import { BrowserRouter, Link, useLocation } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { Eye, EyeOff } from 'lucide-react'

const PAGES = [
  { id: 'agency', label: 'Agency Dashboard', path: '/dashboard' },
  { id: 'auth', label: 'Authentication', path: '/login' },
  { id: 'client', label: 'Client Portal', path: '/portal' },
  { id: 'design-system', label: 'Design System', path: '/design-system' },
  { id: 'website', label: 'Public Website', path: '/website' },
]

function ViewflowSwitcher() {
  const location = useLocation()
  const [minimized, setMinimized] = useState(false)

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 99999,
          background: '#0F172A',
          color: '#fff',
          border: '1px solid #334155',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        Viewflow Bar ▾
      </button>
    )
  }

  return (
    <div
      style={{
        background: '#0F172A',
        borderBottom: '1px solid #1E293B',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 44,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#64748B',
            marginRight: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Viewflow
        </span>
        {PAGES.map((p) => {
          const isActive =
            location.pathname === p.path ||
            (p.path === '/dashboard' && location.pathname === '/')
          return (
            <Link
              key={p.id}
              to={p.path}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 16px',
                height: 44,
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? '#4F46E5' : 'transparent',
                color: isActive ? '#fff' : '#94A3B8',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </Link>
          )
        })}
      </div>

      <button
        onClick={() => setMinimized(true)}
        title="Minimize switcher"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748B',
          fontSize: 12,
          cursor: 'pointer',
          padding: '4px 8px',
        }}
      >
        Hide
      </button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col" style={{ background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <ViewflowSwitcher />
        <div className="flex-1">
          <AppRoutes />
        </div>
      </div>
    </BrowserRouter>
  )
}
