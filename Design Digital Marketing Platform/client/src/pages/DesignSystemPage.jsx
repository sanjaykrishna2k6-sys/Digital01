import React, { useState } from 'react'
import { Search, ChevronDown, Eye, EyeOff, AlertCircle, Info, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 52 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 20px' }}>{title}</h2>
      {children}
    </div>
  )
}

function Swatch({ name, hex }) {
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

export function DesignSystemPage() {
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 40px 80px', background: '#F9FAFB' }}>
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
      <Section title="Typography - Inter">
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          {typeScale.map((t, i) => (
            <div key={t.name} style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '16px 24px', borderBottom: i < typeScale.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width: 100, flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', margin: 0 }}>{t.name}</p>
                <p style={{ fontSize: 11, color: '#D1D5DB', margin: '2px 0 0' }}>{t.size} / {t.weight}</p>
              </div>
              <p style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: t.lh, color: '#111827', margin: 0 }}>
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
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" leftIcon={Search} />
            <Button disabled>Disabled</Button>
            <Button isLoading>Loading</Button>
          </div>
        </div>
      </Section>

      {/* Inputs */}
      <Section title="Inputs">
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
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
          </div>
        </div>
      </Section>

      {/* Badges */}
      <Section title="Badges & Status">
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Badge variant="success">Active</Badge>
            <Badge variant="warning">At Risk</Badge>
            <Badge variant="error">Overdue</Badge>
            <Badge variant="info">In Progress</Badge>
            <Badge variant="neutral">Completed</Badge>
            <Badge variant="primary">Paid Media</Badge>
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
                <p style={{ fontSize: 13, color, opacity: 0.8, margin: '2px 0 0' }}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
