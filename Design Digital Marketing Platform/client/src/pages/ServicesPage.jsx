import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Layers,
  Search,
  CheckCircle2,
  DollarSign,
  Users,
  Briefcase,
  Star,
  Zap,
  Tag,
  ArrowUpRight,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatINR } from '../utils/formatters'

const SERVICES_CATALOG = [
  {
    id: 'seo-pro',
    name: 'SEO & Technical Optimization',
    category: 'Search Marketing',
    tier: 'Retainer',
    priceMonthly: 45000,
    activeClients: 18,
    rating: 4.9,
    description: 'Comprehensive technical SEO audits, keyword strategy, schema markup, and monthly backlinks.',
    deliverables: ['Weekly Keyword Reports', 'On-Page Optimization', 'Monthly Backlink Outreach', 'Core Web Vitals Tuning'],
    status: 'Active',
  },
  {
    id: 'ppc-ads',
    name: 'Google & Meta Performance Ads',
    category: 'Paid Acquisition',
    tier: 'Retainer + % Spend',
    priceMonthly: 65000,
    activeClients: 24,
    rating: 4.8,
    description: 'Data-driven ad campaigns targeting high-intent leads on Google Search, Meta Ads, and LinkedIn.',
    deliverables: ['Ad Copy & Visuals', 'Audience Segmentation', 'Conversion Rate Optimization', 'Daily Spend Monitoring'],
    status: 'Active',
  },
  {
    id: 'social-growth',
    name: 'Social Media Management & Reels',
    category: 'Content Marketing',
    tier: 'Monthly Package',
    priceMonthly: 35000,
    activeClients: 15,
    rating: 4.7,
    description: 'Full-service social media strategy, reel creation, graphic design, and community engagement.',
    deliverables: ['16 High-Quality Posts', '8 Trending Reels', 'Community Moderation', 'Monthly Performance Deck'],
    status: 'Active',
  },
  {
    id: 'ecom-shopify',
    name: 'Shopify E-Commerce Optimization',
    category: 'E-Commerce',
    tier: 'Project / Retainer',
    priceMonthly: 85000,
    activeClients: 12,
    rating: 4.9,
    description: 'Store design, custom app integrations, checkout optimization, and abandoned cart recovery automation.',
    deliverables: ['Store Theme Tuning', 'Klaviyo Email Flows', 'CRO Experiments', 'Payment Gateway Setup'],
    status: 'Active',
  },
  {
    id: 'brand-strategy',
    name: 'Brand Identity & Strategy',
    category: 'Branding',
    tier: 'One-Time Project',
    priceMonthly: 120000,
    activeClients: 6,
    rating: 5.0,
    description: 'Complete brand positioning, visual style guide, typography, logo design, and brand voice book.',
    deliverables: ['Logo & Assets Kit', 'Brand Book PDF', 'Social Templates', 'Stationery Design'],
    status: 'Active',
  },
]

export function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', 'Search Marketing', 'Paid Acquisition', 'Content Marketing', 'E-Commerce', 'Branding']

  const filteredServices = SERVICES_CATALOG.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCat = selectedCategory === 'All' || service.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[16px] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/40">
              Agency Service Offerings
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Services & Product Packages</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Manage your digital marketing agency's core retainers, pricing tiers, and client package catalog.
          </p>
        </div>

        <Link to="/clients">
          <Button variant="primary" className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md">
            <Zap className="w-3.5 h-3.5" />
            Attach to Client Account
          </Button>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Service Offerings" value={String(SERVICES_CATALOG.length)} change="Available in Catalog" positive={true} icon={Layers} iconBg="#EEF2FF" iconColor="#4F46E5" />
        <KpiCard label="Subscribed Client Packages" value="75" change="+8 this month" positive={true} icon={Users} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard label="Average Retainer Value" value={formatINR(58000)} change="Per client / mo" positive={true} icon={DollarSign} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard label="Client Satisfaction" value="4.86 / 5.0" change="Based on 42 reviews" positive={true} icon={Star} iconBg="#FFFBEB" iconColor="#D97706" />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex items-center w-full sm:w-72">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search agency services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredServices.map((service) => (
          <Card key={service.id} className="p-6 flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge variant="primary">{service.category}</Badge>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {service.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">{service.name}</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{service.description}</p>

              <div className="space-y-2 mb-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Included Deliverables</p>
                {service.deliverables.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">{service.tier}</span>
                <span className="text-lg font-bold text-slate-900">{formatINR(service.priceMonthly)}</span>
                <span className="text-[11px] text-slate-500"> / mo</span>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 block">{service.activeClients} Active Clients</span>
                <span className="text-xs text-amber-600 font-medium">★ {service.rating}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
