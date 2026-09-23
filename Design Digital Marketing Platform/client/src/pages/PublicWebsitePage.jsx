import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Check, Star, TrendingUp, Users,
  Target, BarChart3, Search, Mail, Globe, Award, Zap
} from 'lucide-react'

const services = [
  { icon: Target, title: 'Paid Advertising', desc: 'Google Ads, Meta Ads, and programmatic campaigns optimized for maximum ROAS.' },
  { icon: Search, title: 'SEO & Content', desc: 'Rank higher, attract qualified traffic, and build authority in your industry.' },
  { icon: Users, title: 'Social Media', desc: 'Build community and drive engagement across Instagram, LinkedIn, and Facebook.' },
  { icon: Mail, title: 'Email Marketing', desc: 'High-converting email sequences and newsletters that nurture leads into customers.' },
  { icon: BarChart3, title: 'Analytics & Reporting', desc: 'Real-time dashboards and monthly reports that make your ROI crystal clear.' },
  { icon: Globe, title: 'Web & Landing Pages', desc: 'Conversion-optimized websites and landing pages designed to turn visitors into leads.' },
]

const process = [
  { num: '01', title: 'Discovery', desc: 'We audit your current marketing, understand your business goals, and identify the biggest growth opportunities.' },
  { num: '02', title: 'Strategy', desc: 'We build a tailored marketing plan with clear KPIs, channels, budget allocation, and timelines.' },
  { num: '03', title: 'Execution', desc: 'Our team launches, manages, and continuously optimizes your campaigns for peak performance.' },
  { num: '04', title: 'Reporting', desc: 'Monthly reports with full transparency — every rupee spent, every lead generated, and every insight shared.' },
]

const results = [
  { metric: '₹50Cr+', label: 'Revenue Generated for Clients' },
  { metric: '3.8x', label: 'Average ROAS Delivered' },
  { metric: '200+', label: 'Clients Across India' },
  { metric: '94%', label: 'Client Retention Rate' },
]

const testimonials = [
  {
    name: 'Rohit Kapoor', role: 'Founder, FreshMart', initials: 'RK',
    text: 'Scalevo helped us go from ₹2L to ₹18L in monthly revenue from digital channels in under 6 months. Exceptional team.',
  },
  {
    name: 'Priya Mehta', role: 'CMO, TechNova Pvt. Ltd', initials: 'PM',
    text: 'The transparency and data-driven approach is what sets them apart. We finally know exactly where our marketing budget is going.',
  },
  {
    name: 'Arjun Sharma', role: 'Director, Urban Homes', initials: 'AS',
    text: 'Our cost per lead dropped by 40% in the first quarter. The Scalevo team treats our business like their own.',
  },
]

const plans = [
  {
    name: 'Growth', price: '₹25,000', period: '/month', popular: false,
    desc: 'Perfect for small businesses starting their digital journey.',
    features: ['1 paid channel (Google or Meta)', 'SEO basics', 'Monthly report', 'Dedicated account manager', 'Email support'],
  },
  {
    name: 'Scale', price: '₹55,000', period: '/month', popular: true,
    desc: 'For growing businesses ready to accelerate digital marketing.',
    features: ['2 paid channels', 'SEO + content (4 posts/month)', 'Social media (3 platforms)', 'Bi-weekly reports', 'Priority support', 'Dedicated strategist'],
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', popular: false,
    desc: 'For established brands needing full-service marketing.',
    features: ['All channels', 'Custom content strategy', 'Weekly reviews', 'Dedicated team', '24/7 support', 'Custom integrations'],
  },
]

export function PublicWebsitePage() {
  return (
    <div style={{ background: '#fff', fontFamily: 'Inter, sans-serif', color: '#111827' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, zIndex: 100, background: '#fff' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Scalevo</span>
          </div>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {['Services', 'Process', 'Case Studies', 'Pricing', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ fontSize: 14, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Login
            </Link>
            <Link to="/dashboard" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#4F46E5', fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              Dashboard <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', borderRadius: 9999, padding: '5px 14px', marginBottom: 28 }}>
            <Award size={13} color="#4F46E5" />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>India's fastest growing agency management platform</span>
          </div>

          <h1 style={{ fontSize: 54, fontWeight: 800, color: '#111827', lineHeight: 1.1, margin: '0 auto 24px', maxWidth: 820, letterSpacing: '-0.025em' }}>
            Grow Your Business With<br />
            <span style={{ color: '#4F46E5' }}>Data-Driven Digital Marketing</span>
          </h1>

          <p style={{ fontSize: 18, color: '#6B7280', lineHeight: 1.65, margin: '0 auto 40px', maxWidth: 600 }}>
            We help businesses build their online presence, generate qualified leads and turn digital marketing into measurable growth.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, border: 'none', background: '#4F46E5', fontSize: 15, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
              Launch Agency Workspace <ArrowRight size={15} />
            </Link>
            <a href="#services" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: '#fff', fontSize: 15, fontWeight: 600, color: '#374151', textDecoration: 'none' }}>
              View Our Services
            </a>
          </div>

          {/* Social proof */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', marginTop: 48 }}>
            <div style={{ display: 'flex' }}>
              {['RK', 'PM', 'AS', 'ND'].map((init, i) => (
                <div key={init} style={{ width: 32, height: 32, borderRadius: '50%', background: ['#4F46E5','#7C3AED','#059669','#D97706'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -8 : 0, border: '2px solid #F9FAFB' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{init}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280' }}>
              <strong style={{ color: '#111827' }}>200+ businesses</strong> trust Scalevo for their digital growth
            </div>
          </div>
        </div>
      </section>

      {/* Results bar */}
      <section style={{ background: '#0F172A', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {results.map(({ metric, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 34, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{metric}</p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '6px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Services</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: '0 0 16px', letterSpacing: '-0.02em' }}>Everything your brand needs to grow online</h2>
            <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 540, margin: '0 auto' }}>From awareness to conversion — we manage every stage of your digital marketing with precision.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {services.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 12, padding: 28 }}>
                <div style={{ width: 44, height: 44, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color="#4F46E5" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" style={{ background: '#F9FAFB', padding: '96px 24px', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>How We Work</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Our proven process</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {process.map(({ num, title, desc }) => (
              <div key={num}>
                <div style={{ width: 44, height: 44, background: '#EEF2FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: '#4F46E5' }}>{num}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Testimonials</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Trusted by ambitious brands</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map(({ name, role, initials, text }) => (
              <div key={name} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 28 }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />)}
                </div>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, margin: '0 0 20px', fontStyle: 'italic' }}>"{text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{initials}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{name}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: '#F9FAFB', padding: '96px 24px', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Pricing</p>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Transparent, results-driven pricing</h2>
            <p style={{ fontSize: 15, color: '#6B7280' }}>No hidden fees. Cancel anytime. 30-day performance guarantee.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
            {plans.map(({ name, price, period, popular, desc, features }) => (
              <div key={name} style={{
                background: popular ? '#4F46E5' : '#fff',
                border: popular ? 'none' : '1px solid #E5E7EB',
                borderRadius: 14,
                padding: 32,
                position: 'relative',
              }}>
                {popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#F59E0B', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: '3px 14px', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    Most Popular
                  </div>
                )}
                <p style={{ fontSize: 15, fontWeight: 700, color: popular ? '#C7D2FE' : '#9CA3AF', margin: '0 0 4px' }}>{name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, color: popular ? '#fff' : '#111827', letterSpacing: '-0.02em' }}>{price}</span>
                  <span style={{ fontSize: 13, color: popular ? '#A5B4FC' : '#9CA3AF' }}>{period}</span>
                </div>
                <p style={{ fontSize: 13, color: popular ? '#A5B4FC' : '#9CA3AF', margin: '0 0 28px', lineHeight: 1.5 }}>{desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: popular ? 'rgba(255,255,255,0.2)' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={10} color={popular ? '#fff' : '#16A34A'} strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 13, color: popular ? '#C7D2FE' : '#374151', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/dashboard" style={{ width: '100%', padding: '12px', borderRadius: 8, border: popular ? 'none' : '1.5px solid #E5E7EB', background: popular ? '#fff' : 'transparent', fontSize: 14, fontWeight: 700, color: popular ? '#4F46E5' : '#374151', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                  {name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0F172A', borderTop: '1px solid #1E293B', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, background: '#4F46E5', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={14} color="#fff" fill="#fff" />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Scalevo</span>
              </div>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
                India's premium digital marketing agency platform. Helping businesses generate qualified leads and measurable ROI.
              </p>
            </div>
            {[
              { title: 'Services', links: ['Paid Advertising', 'SEO & Content', 'Social Media', 'Email Marketing'] },
              { title: 'Company', links: ['About Us', 'Case Studies', 'Careers', 'Contact'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>{title}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {links.map(l => <a key={l} href="#" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}>{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1E293B', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>© 2024 Scalevo Digital Pvt. Ltd. All rights reserved.</p>
            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Made with ♥ in Mumbai, India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
