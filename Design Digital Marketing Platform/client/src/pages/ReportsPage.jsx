import React, { useState } from 'react'
import { PieChart, FileText, Download, Calendar, Filter, Sparkles, Share2, CheckCircle2 } from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const REPORTS_LIST = [
  {
    id: 'rep-01',
    name: 'September 2024 — Agency Executive Summary',
    client: 'All Clients Aggregate',
    date: '01 Oct 2024',
    type: 'Monthly Executive Deck',
    fileSize: '4.2 MB PDF',
    status: 'Ready',
  },
  {
    id: 'rep-02',
    name: 'Q3 2024 — E-Commerce ROAS & Shopify Attribution Report',
    client: 'Acme Fitness & Gyms',
    date: '30 Sep 2024',
    type: 'Quarterly Audit',
    fileSize: '8.1 MB PDF',
    status: 'Ready',
  },
  {
    id: 'rep-03',
    name: 'SEO Rankings & Keyword Growth Audit — Q3',
    client: 'Starlight E-Commerce',
    date: '28 Sep 2024',
    type: 'SEO Performance',
    fileSize: '3.6 MB PDF',
    status: 'Ready',
  },
  {
    id: 'rep-04',
    name: 'Google & Meta Paid Campaign Lead Attribution',
    client: 'DigiEdge Growth',
    date: '25 Sep 2024',
    type: 'PPC Analytics',
    fileSize: '5.0 MB PDF',
    status: 'Ready',
  },
]

export function ReportsPage() {
  const [downloaded, setDownloaded] = useState({})

  const handleDownload = (id) => {
    setDownloaded((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[16px] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/40">
              Client Reporting Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Reports & Analytics Decks</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Export automated client reports, campaign attribution decks, and executive summary PDFs.
          </p>
        </div>

        <Button variant="primary" className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md">
          <Sparkles className="w-3.5 h-3.5" />
          Generate New Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Reports Generated" value={String(REPORTS_LIST.length)} change="This Month" positive={true} icon={FileText} iconBg="#EEF2FF" iconColor="#4F46E5" />
        <KpiCard label="Automated Deliveries" value="100%" change="Sent to Clients" positive={true} icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard label="Average Open Rate" value="94.2%" change="Client Engagement" positive={true} icon={PieChart} iconBg="#EFF6FF" iconColor="#2563EB" />
      </div>

      {/* Reports Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Generated Reports Archive</h3>
          <span className="text-xs text-slate-500">4 total documents</span>
        </div>

        <div className="divide-y divide-slate-100">
          {REPORTS_LIST.map((rep) => (
            <div key={rep.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{rep.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Badge variant="primary">{rep.client}</Badge>
                    <span>• {rep.type}</span>
                    <span>• {rep.fileSize}</span>
                    <span>• Generated {rep.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  variant="secondary"
                  className="text-xs gap-1.5"
                  onClick={() => handleDownload(rep.id)}
                >
                  {downloaded[rep.id] ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Downloaded
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
