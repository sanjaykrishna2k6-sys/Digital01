import React, { useState } from 'react'
import { CheckSquare, Clock, Check, MessageSquare, AlertCircle, FileText, ExternalLink } from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const PENDING_APPROVALS = [
  {
    id: 101,
    title: 'Diwali Festive Sale — Instagram 5-Slide Carousel',
    client: 'Acme Fitness & Gyms',
    submittedBy: 'Ananya Sharma (Creative Lead)',
    date: '14 Oct 2024',
    type: 'Social Graphic & Copy',
    notes: 'Please check slide 3 price tags before approving.',
    previewUrl: '#',
  },
  {
    id: 102,
    title: 'Q4 Performance Search Ads — Headline & Description Extensions',
    client: 'Starlight E-Commerce',
    submittedBy: 'Karan Patel (PPC Specialist)',
    date: '15 Oct 2024',
    type: 'Search Ad Copy',
    notes: 'Aligned with new promo discounts for festive season.',
    previewUrl: '#',
  },
]

export function ApprovalsPage() {
  const [approvedIds, setApprovedIds] = useState([])
  const [rejectedIds, setRejectedIds] = useState([])

  const activeApprovals = PENDING_APPROVALS.filter(
    (item) => !approvedIds.includes(item.id) && !rejectedIds.includes(item.id)
  )

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[16px] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/40">
              Quality & Compliance
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Client & Campaign Approvals</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Review marketing collateral, approve creative copy, and resolve client feedback before publishing live.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Pending Client Review" value={String(activeApprovals.length)} change="Awaiting Response" positive={false} icon={Clock} iconBg="#FFFBEB" iconColor="#D97706" />
        <KpiCard label="Approved This Week" value={String(approvedIds.length + 12)} change="+15% Speed" positive={true} icon={Check} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard label="Revision Requests" value={String(rejectedIds.length + 2)} change="Quality Checked" positive={true} icon={MessageSquare} iconBg="#EFF6FF" iconColor="#2563EB" />
      </div>

      {/* Approval Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Queue Awaiting Action</h2>

        {activeApprovals.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <CheckSquare className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800">All approval queues cleared!</p>
            <p className="text-xs text-slate-400 mt-1">No content items currently awaiting client or director approval.</p>
          </Card>
        ) : (
          activeApprovals.map((item) => (
            <Card key={item.id} className="p-6 border-l-4 border-l-amber-500 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{item.type}</Badge>
                    <span className="text-xs font-semibold text-slate-700">{item.client}</span>
                    <span className="text-xs text-slate-400">• Submitted {item.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Author:</span> {item.submittedBy}
                  </p>
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2">
                    "{item.notes}"
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <Button
                    variant="secondary"
                    className="text-xs gap-1.5 text-rose-600 hover:bg-rose-50 border-rose-200"
                    onClick={() => setRejectedIds([...rejectedIds, item.id])}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Request Changes
                  </Button>
                  <Button
                    variant="primary"
                    className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                    onClick={() => setApprovedIds([...approvedIds, item.id])}
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Item
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
