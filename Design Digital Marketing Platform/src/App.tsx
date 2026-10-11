import { useState } from 'react'
import AgencyDashboard from './pages/AgencyDashboard'
import Authentication from './pages/Authentication'
import ClientPortal from './pages/ClientPortal'
import DesignSystem from './pages/DesignSystem'
import PublicWebsite from './pages/PublicWebsite'

const PAGES = [
  { id: 'auth', label: 'Authentication' },
  { id: 'agency', label: 'Agency Dashboard' },
  { id: 'client', label: 'Client Portal' },
  { id: 'website', label: 'Public Website' },
]

export default function App() {
  const [activePage, setActivePage] = useState('agency')

  return (
    <div className="min-h-screen" style={{ background: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Page Switcher Bar */}
      <div style={{ background: '#0F172A', borderBottom: '1px solid #1E293B', position: 'sticky', top: 0, zIndex: 9999 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingLeft: 16, height: 44 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginRight: 16, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Viewflow</span>
          {PAGES.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              style={{
                padding: '0 16px',
                height: 44,
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                background: activePage === p.id ? '#4F46E5' : 'transparent',
                color: activePage === p.id ? '#fff' : '#94A3B8',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {activePage === 'design-system' && <DesignSystem />}
      {activePage === 'auth' && <Authentication />}
      {activePage === 'agency' && <AgencyDashboard />}
      {activePage === 'client' && <ClientPortal />}
      {activePage === 'website' && <PublicWebsite />}
    </div>
  )
}
