import React, { useState } from 'react'
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Instagram,
  Facebook,
  Linkedin,
  Globe,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const CONTENT_ITEMS = [
  {
    id: 1,
    title: 'Diwali Festive Sale — Instagram Carousel Post',
    client: 'Acme Fitness & Gyms',
    platform: 'Instagram',
    type: 'Carousel Post',
    scheduledDate: '18 Oct 2024',
    status: 'Pending Client Approval',
    author: 'Ananya Sharma',
  },
  {
    id: 2,
    title: 'Google Ads Search Campaign — Q4 Lead Gen Copy',
    client: 'Starlight E-Commerce',
    platform: 'Google Ads',
    type: 'Search Ad Copy',
    scheduledDate: '20 Oct 2024',
    status: 'Approved',
    author: 'Karan Patel',
  },
  {
    id: 3,
    title: 'SEO Blog — 10 Proven Marketing Trends for 2025',
    client: 'DigiEdge Growth',
    platform: 'Website Blog',
    type: 'Longform Article',
    scheduledDate: '22 Oct 2024',
    status: 'In Review',
    author: 'Neha Verma',
  },
  {
    id: 4,
    title: 'LinkedIn Thought Leadership — B2B SaaS Case Study',
    client: 'Krishpo Media',
    platform: 'LinkedIn',
    type: 'Document Post',
    scheduledDate: '25 Oct 2024',
    status: 'Drafting',
    author: 'Vikram Sethi',
  },
]

export function ContentPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredContent = CONTENT_ITEMS.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[16px] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/40">
              Agency Content Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Content & Asset Hub</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Schedule social media creatives, ad copy, blogs, and manage client approval workflows.
          </p>
        </div>

        <Button variant="primary" className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md">
          <Plus className="w-3.5 h-3.5" />
          Create New Content Item
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Planned Content" value={String(CONTENT_ITEMS.length)} change="This Month" positive={true} icon={FileText} iconBg="#EEF2FF" iconColor="#4F46E5" />
        <KpiCard label="Awaiting Client Approval" value="1" change="Requires Action" positive={false} icon={Clock} iconBg="#FFFBEB" iconColor="#D97706" />
        <KpiCard label="Approved & Ready" value="1" change="Scheduled for Publish" positive={true} icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard label="Drafting / In Progress" value="2" change="Team Assigned" positive={true} icon={Calendar} iconBg="#EFF6FF" iconColor="#2563EB" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex items-center w-full sm:w-80">
          <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search content by title or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {['All', 'Pending Client Approval', 'Approved', 'In Review', 'Drafting'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content List Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Content Title</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Platform</th>
                <th className="py-3.5 px-4">Scheduled Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredContent.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-semibold text-slate-900">{item.title}</td>
                  <td className="py-4 px-4 font-medium text-slate-700">{item.client}</td>
                  <td className="py-4 px-4">
                    <Badge variant="primary">{item.platform}</Badge>
                  </td>
                  <td className="py-4 px-4 text-slate-500">{item.scheduledDate}</td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        item.status === 'Approved'
                          ? 'success'
                          : item.status === 'Pending Client Approval'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-slate-500">{item.author}</td>
                  <td className="py-4 px-5 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
