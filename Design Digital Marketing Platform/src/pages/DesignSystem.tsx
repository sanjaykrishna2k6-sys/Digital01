import { useState } from 'react'
import { Search, ChevronDown, Eye, EyeOff, Check, X, AlertCircle, Info, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 52 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>{title}</h2>
      {children}
    </div>
  )
}

function Swatch({ name, hex, textDark = false }: { name: string; hex: string; textDark?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
      <div style={{ height: 52, borderRadius: 8, background: hex, border: '1px solid rgba(0,0,0,0.06)' }} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>{name}</p>
        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>{hex}</p>
      </div>
    </div>
  )
}

function Btn({ variant, children }: { variant: string; children: React.ReactNode }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: '#4F46E5', color: '#fff', border: 'none' },
    secondary: { background: '#F3F4F6', color: '#374151', border: 'none' },
    outline: { background: 'transparent', color: '#4F46E5', border: '1.5px solid #4F46E5' },
    ghost: { background: 'transparent', color: '#4F46E5', border: '1.5px solid transparent' },
    danger: { background: '#EF4444', color: '#fff', border: 'none' },
  }
  return (
    <button style={{ ...styles[variant], padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'opacity 0.15s' }}>
      {children}
    </button>
  )
}

export default function DesignSystem() {
  const [showPass, setShowPass] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const colors = [
    { group: 'Primary (Indigo)', swatches: [
      { name: 'primary-50', hex: '#EEF2FF' },
      { name: 'primary-100', hex: '#E0E7FF' },
      { name: 'primary-200', hex: '#C7D2FE' },
      { name: 'primary-400', hex: '#818CF8' },
      { name: 'primary-600', hex: '#4F46E5' },
      { name: 'primary-800', hex: '#3730A3' },
      { name: 'primary-900', hex: '#312E81' },
    ]},
    { group: 'Neutral', swatches: [
      { name: 'neutral-50', hex: '#F9FAFB' },
      { name: 'neutral-100', hex: '#F3F4F6' },
      { name: 'neutral-200', hex: '#E5E7EB' },
      { name: 'neutral-400', hex: '#9CA3AF' },
      { name: 'neutral-600', hex: '#4B5563' },
      { name: 'neutral-800', hex: '#1F2937' },
      { name: 'neutral-900', hex: '#111827' },
    ]},
    { group: 'Semantic', swatches: [
      { name: 'success', hex: '#22C55E' },
      { name: 'warning', hex: '#F59E0B' },
      { name: 'error', hex: '#EF4444' },
      { name: 'info', hex: '#3B82F6' },
    ]},
  ]

  const typeScale = [
    { name: 'Display', size: '36px', weight: '800', lh: '1.1', sample: 'Scalevo Agency Suite' },
    { name: 'H1', size: '28px', weight: '700', lh: '1.2', sample: 'Agency Dashboard' },
    { name: 'H2', size: '22px', weight: '700', lh: '1.25', sample: 'Campaign Performance' },
    { name: 'H3', size: '16px', weight: '600', lh: '1.4', sample: 'Revenue Overview' },
    { name: 'Body Large', size: '16px', weight: '400', lh: '1.6', sample: 'Manage all your clients and campaigns from one place.' },
    { name: 'Body', size: '14px', weight: '400', lh: '1.6', sample: 'Track campaign performance, approvals, and reports in real-time.' },
    { name: 'Body Small', size: '13px', weight: '400', lh: '1.5', sample: 'Last updated 2 minutes ago' },
    { name: 'Caption', size: '11px', weight: '500', lh: '1.4', sample: 'ACTIVE CLIENTS' },
  ]

  const spacing = [4, 8, 12, 16, 24, 32, 48]
  const radii = [
    { name: 'Small', px: 6 },
    { name: 'Medium', px: 8 },
    { name: 'Large', px: 12 },
    { name: 'XL', px: 16 },
    { name: 'Full', px: 9999 },
  ]

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', borderRadius: 6, padding: '4px 10px', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Design System</span>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Scalevo Design System</h1>
        <p style={{ fontSize: 15, color: '#6B7280', margin: '8px 0 0' }}>Design tokens, typography, components, and patterns for the Scalevo Agency Suite.</p>
      </div>

      {/* Colors */}
      <Section title="Color System">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {colors.map(({ group, swatches }) => (
            <div key={group}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>{group}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {swatches.map(s => <Swatch key={s.name} {...s} />)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography — Inter">
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {typeScale.map((t, i) => (
            <div key={t.name} style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '16px 24px', borderBottom: i < typeScale.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width: 100, flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', margin: 0 }}>{t.name}</p>
                <p style={{ fontSize: 11, color: '#D1D5DB', margin: '2px 0 0' }}>{t.size} / {t.weight}</p>
              </div>
              <p style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: t.lh, color: '#111827', margin: 0, textTransform: t.name === 'Caption' ? 'uppercase' : 'none', letterSpacing: t.name === 'Caption' ? '0.08em' : t.weight === '800' ? '-0.02em' : 'normal' }}>
                {t.sample}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Spacing */}
      <Section title="Spacing Scale (8px base)">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {spacing.map(s => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ background: '#4F46E5', opacity: 0.8, width: s, height: s, borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>{s}px</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Radius */}
      <Section title="Border Radius">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {radii.map(r => (
            <div key={r.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 64, height: 64, background: '#EEF2FF', border: '1.5px solid #4F46E5', borderRadius: r.px }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>{r.name}</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{r.px === 9999 ? 'full' : r.px + 'px'}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Buttons">
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn variant="primary">Primary</Btn>
            <Btn variant="secondary">Secondary</Btn>
            <Btn variant="outline">Outline</Btn>
            <Btn variant="ghost">Ghost</Btn>
            <Btn variant="danger">Danger</Btn>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
            <button style={{ padding: '7px 14px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Small</button>
            <button style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Medium</button>
            <button style={{ padding: '13px 28px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Large</button>
            <button style={{ width: 36, height: 36, background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={16} />
            </button>
            <button disabled style={{ padding: '10px 20px', background: '#F3F4F6', color: '#9CA3AF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'not-allowed' }}>
              Disabled
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#818CF8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'not-allowed' }}>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Loading
            </button>
          </div>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Text Input</label>
              <input value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Enter value..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', color: '#374151' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Focused State</label>
              <input placeholder="Focused input..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #4F46E5', fontSize: 14, outline: 'none', color: '#374151', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Error State</label>
              <input placeholder="error@" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #EF4444', fontSize: 14, outline: 'none', color: '#374151' }} />
              <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} />This field is required</p>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} defaultValue="mysecretpass" style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', color: '#374151' }} />
                <button onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input placeholder="Search..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', color: '#374151' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Select</label>
              <div style={{ position: 'relative' }}>
                <select style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', color: '#374151', appearance: 'none', background: '#fff', cursor: 'pointer' }}>
                  <option>Choose option...</option>
                  <option>Option A</option>
                  <option>Option B</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Textarea</label>
              <textarea placeholder="Write your message here..." rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', color: '#374151', resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges & Status">
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge badge-success"><Check size={11} /> Success</span>
            <span className="badge badge-warning"><AlertTriangle size={11} /> Warning</span>
            <span className="badge badge-error"><X size={11} /> Error</span>
            <span className="badge badge-info"><Info size={11} /> Info</span>
            <span className="badge badge-primary">Primary</span>
            <span className="badge badge-neutral">Neutral</span>
            <span className="badge" style={{ background: '#F0FDF4', color: '#15803D' }}>On Track</span>
            <span className="badge" style={{ background: '#FEF3C7', color: '#B45309' }}>At Risk</span>
            <span className="badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>Pending</span>
            <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>Completed</span>
          </div>
        </div>
      </Section>

      {/* Feedback */}
      <Section title="Feedback & Alerts">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', title: 'Invoice paid successfully', body: 'Payment of ₹48,000 received from Urban Homes.' },
            { icon: AlertTriangle, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', title: 'Campaign budget at 80%', body: 'Acme Fitness Meta Ads spend is approaching the monthly limit.' },
            { icon: AlertCircle, color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', title: 'Content approval overdue', body: 'GreenLeaf Foods — Blog post approval is 3 days past the deadline.' },
            { icon: Info, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', title: 'New feature: SEO Rank Tracker', body: 'Track keyword rankings for all your clients directly in Scalevo.' },
          ].map(({ icon: Icon, color, bg, border, title, body }) => (
            <div key={title} style={{ display: 'flex', gap: 12, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: '14px 16px' }}>
              <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color, margin: 0 }}>{title}</p>
                <p style={{ fontSize: 13, color: color, opacity: 0.8, margin: '2px 0 0' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Cards */}
      <Section title="Card Variants">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* KPI Card */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF', margin: 0 }}>Monthly Revenue</p>
              <div style={{ width: 36, height: 36, background: '#EEF2FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16 }}>💰</span>
              </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: 0 }}>₹4.82L</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#16A34A' }}>↑ +18%</span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>vs last month</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>KPI Card</p>
          </div>

          {/* Client Card */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: '#FEF3C7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>AF</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>Acme Fitness</p>
                <span className="badge badge-success" style={{ fontSize: 11 }}>Active</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: '#9CA3AF' }}>3 active projects</span>
              <span style={{ color: '#4F46E5', fontWeight: 500 }}>View →</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', margin: '12px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Client Card</p>
          </div>

          {/* Project Card */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="badge badge-success">On Track</span>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Due Nov 15</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Meta Ads Q4</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 14px' }}>Acme Fitness · Paid Media</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                <div style={{ width: '72%', height: '100%', background: '#4F46E5', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>72%</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF', margin: '12px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Project Card</p>
          </div>
        </div>
      </Section>

      {/* Empty / Loading / Error states */}
      <Section title="States">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {/* Empty */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: '#F3F4F6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <span style={{ fontSize: 24 }}>📭</span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>No campaigns yet</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px' }}>Create your first campaign to start tracking performance.</p>
            <button style={{ padding: '8px 18px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create Campaign</button>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#D1D5DB', margin: '14px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Empty State</p>
          </div>

          {/* Loading */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={28} color="#4F46E5" style={{ animation: 'spin 1s linear infinite', marginBottom: 14 }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: 0 }}>Loading campaigns...</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>This might take a moment</p>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#D1D5DB', margin: '14px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Loading State</p>
          </div>

          {/* Error */}
          <div style={{ background: '#fff', border: '1px solid #FECACA', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: '#FEF2F2', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <AlertCircle size={24} color="#EF4444" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>Failed to load data</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 16px' }}>There was an error fetching campaign data. Please try again.</p>
            <button style={{ padding: '8px 18px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#D1D5DB', margin: '14px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Error State</p>
          </div>
        </div>
      </Section>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
