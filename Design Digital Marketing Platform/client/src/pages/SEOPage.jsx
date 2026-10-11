import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Globe,
  TrendingUp,
  AlertTriangle,
  FileText,
  Key,
  Link as LinkIcon,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  Filter,
  CheckSquare,
  BarChart3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import * as seoService from '../services/seoService'
import * as clientService from '../services/clientService'
import { formatDate } from '../utils/formatters'

export function SEOPage() {
  const { user } = useAuth()

  // Active Tab
  const [activeTab, setActiveTab] = useState('dashboard')

  // Global & Filter States
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState('all')

  // Data Collections
  const [dashboardData, setDashboardData] = useState(null)
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [issues, setIssues] = useState([])
  const [pages, setPages] = useState([])
  const [keywords, setKeywords] = useState([])
  const [backlinks, setBacklinks] = useState([])
  const [competitors, setCompetitors] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [reports, setReports] = useState([])

  // Modal States
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false)
  const [isBacklinkModalOpen, setIsBacklinkModalOpen] = useState(false)
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  // Sub-filters
  const [issueSeverityFilter, setIssueSeverityFilter] = useState('all')
  const [issueStatusFilter, setIssueStatusFilter] = useState('all')
  const [keywordIntentFilter, setKeywordIntentFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Form States
  const [projectForm, setProjectForm] = useState({
    name: '',
    website: '',
    clientId: '',
    primaryCountry: 'IN',
    industry: 'Digital Marketing',
    targetKeywords: '',
  })

  const [keywordForm, setKeywordForm] = useState({
    seoProjectId: '',
    keyword: '',
    searchVolume: 1200,
    keywordDifficulty: 45,
    searchIntent: 'Informational',
    targetPage: '',
  })

  const [backlinkForm, setBacklinkForm] = useState({
    seoProjectId: '',
    sourceDomain: '',
    sourceUrl: '',
    targetUrl: '',
    anchorText: '',
    linkType: 'dofollow',
    domainAuthority: 50,
  })

  const [competitorForm, setCompetitorForm] = useState({
    seoProjectId: '',
    domain: '',
    name: '',
  })

  const [reportForm, setReportForm] = useState({
    seoProjectId: '',
    title: '',
    summary: '',
  })

  // Action Pending
  const [actionLoading, setActionLoading] = useState(false)

  // 1. Fetch Projects & Clients for Selectors
  const loadInitialOptions = useCallback(async () => {
    try {
      const [projList, clientList] = await Promise.all([
        seoService.fetchSEOProjects(),
        clientService.getClients ? clientService.getClients() : [],
      ])
      setProjects(projList)
      setClients(clientList.clients || clientList || [])
    } catch (err) {
      console.warn('Initial options load notice:', err.message)
    }
  }, [])

  // 2. Fetch Data for Active Tab
  const loadTabData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const pid = selectedProjectId === 'all' ? undefined : selectedProjectId

      if (activeTab === 'dashboard') {
        const data = await seoService.fetchSEODashboard({ projectId: pid })
        setDashboardData(data)
      } else if (activeTab === 'projects') {
        const projList = await seoService.fetchSEOProjects({ search: searchTerm })
        setProjects(projList)
      } else if (activeTab === 'audit') {
        const issueList = await seoService.fetchSEOIssues({
          projectId: pid,
          severity: issueSeverityFilter,
          status: issueStatusFilter,
          search: searchTerm,
        })
        setIssues(issueList)
      } else if (activeTab === 'onpage') {
        const pageList = await seoService.fetchSEOPages({ projectId: pid, search: searchTerm })
        setPages(pageList)
      } else if (activeTab === 'keywords') {
        const kwList = await seoService.fetchSEOKeywords({
          projectId: pid,
          searchIntent: keywordIntentFilter,
          search: searchTerm,
        })
        setKeywords(kwList)
      } else if (activeTab === 'backlinks') {
        const blList = await seoService.fetchSEOBacklinks({ projectId: pid })
        setBacklinks(blList)
      } else if (activeTab === 'competitors') {
        const compList = await seoService.fetchSEOCompetitors({ projectId: pid })
        setCompetitors(compList)
      } else if (activeTab === 'recommendations') {
        const recList = await seoService.fetchSEORecommendations({ projectId: pid })
        setRecommendations(recList)
      } else if (activeTab === 'reports') {
        const repList = await seoService.fetchSEOReports({ projectId: pid })
        setReports(repList)
      }
    } catch (err) {
      setError(err.message || 'Failed to load SEO data.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedProjectId, issueSeverityFilter, issueStatusFilter, keywordIntentFilter, searchTerm])

  useEffect(() => {
    loadInitialOptions()
  }, [loadInitialOptions])

  useEffect(() => {
    loadTabData()
  }, [loadTabData])

  // Handlers
  const handleCreateProject = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const formattedKw = projectForm.targetKeywords ? projectForm.targetKeywords.split(',').map((k) => k.trim()) : []
      await seoService.createSEOProject({
        ...projectForm,
        targetKeywords: formattedKw,
      })
      setFeedback({ type: 'success', message: 'SEO Project created successfully!' })
      setIsProjectModalOpen(false)
      loadInitialOptions()
      loadTabData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create project.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRunAudit = async (projectId) => {
    const targetId = projectId || (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?._id)
    if (!targetId) {
      setFeedback({ type: 'error', message: 'Please select an SEO project first.' })
      return
    }
    try {
      setActionLoading(true)
      const res = await seoService.runSEOAudit(targetId)
      setFeedback({ type: 'success', message: res.message || 'Audit executed successfully!' })
      loadTabData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Audit failed.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddKeyword = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const pid = keywordForm.seoProjectId || (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?._id)
      if (!pid) throw new Error('SEO Project is required.')
      await seoService.createSEOKeyword({ ...keywordForm, seoProjectId: pid })
      setFeedback({ type: 'success', message: 'Keyword added to rank tracker.' })
      setIsKeywordModalOpen(false)
      loadTabData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add keyword.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddBacklink = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const pid = backlinkForm.seoProjectId || (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?._id)
      if (!pid) throw new Error('SEO Project is required.')
      await seoService.createSEOBacklink({ ...backlinkForm, seoProjectId: pid })
      setFeedback({ type: 'success', message: 'Backlink logged successfully.' })
      setIsBacklinkModalOpen(false)
      loadTabData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add backlink.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddCompetitor = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const pid = competitorForm.seoProjectId || (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?._id)
      if (!pid) throw new Error('SEO Project is required.')
      await seoService.createSEOCompetitor({ ...competitorForm, seoProjectId: pid })
      setFeedback({ type: 'success', message: 'Competitor added.' })
      setIsCompetitorModalOpen(false)
      loadTabData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add competitor.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleConvertTask = async (recId) => {
    try {
      setActionLoading(true)
      await seoService.convertSEORecommendationToTask(recId)
      setFeedback({ type: 'success', message: 'SEO Recommendation converted into an assigned Krishpo task!' })
      loadTabData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Task conversion failed.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateReport = async (e) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const pid = reportForm.seoProjectId || (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?._id)
      if (!pid) throw new Error('SEO Project is required.')
      await seoService.createSEOReport({ ...reportForm, seoProjectId: pid })
      setFeedback({ type: 'success', message: 'SEO Report generated.' })
      setIsReportModalOpen(false)
      loadTabData()
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to generate report.' })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">SEO Management Module</h1>
            <p className="text-xs text-[#6B7280]">
              Agency-grade Technical Audit, Rank Tracking, On-Page Optimization, Backlink & Competitor Intelligence.
            </p>
          </div>
        </div>

        {/* Global Project Scope & Main Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
          >
            <option value="all">All SEO Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.website})
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRunAudit()}
            disabled={actionLoading}
            className="gap-1.5 text-[#4F46E5] border-[#C7D2FE] bg-[#EEF2FF] hover:bg-[#E0E7FF]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run SEO Audit</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProjectModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New SEO Project</span>
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-[10px] text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
              : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'SEO Dashboard', icon: BarChart3 },
          { id: 'projects', label: 'SEO Projects', icon: Globe, count: projects.length },
          { id: 'audit', label: 'Technical Audit', icon: AlertTriangle, count: issues.length },
          { id: 'onpage', label: 'On-Page SEO', icon: FileText },
          { id: 'keywords', label: 'Keywords', icon: Key },
          { id: 'backlinks', label: 'Backlinks', icon: LinkIcon },
          { id: 'competitors', label: 'Competitors', icon: Users },
          { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#4F46E5] text-[#4F46E5]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827] hover:border-[#D1D5DB]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Loading & Error States */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loading size="lg" message="Loading SEO module metrics..." />
        </div>
      ) : error ? (
        <ErrorState title="Error Loading SEO Data" description={error} onRetry={loadTabData} />
      ) : (
        <>
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && dashboardData && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="SEO Health Score"
                  value={`${dashboardData.metrics.healthScore}/100`}
                  icon={ShieldCheck}
                  iconBg="#EEF2FF"
                  iconColor="#4F46E5"
                  timeframe="Audit Aggregate"
                />
                <KpiCard
                  label="Organic Traffic"
                  value={dashboardData.metrics.organicTraffic.toLocaleString()}
                  icon={TrendingUp}
                  iconBg="#F0FDF4"
                  iconColor="#16A34A"
                  timeframe="Monthly Visits"
                />
                <KpiCard
                  label="Ranking Keywords"
                  value={dashboardData.metrics.rankingKeywords}
                  icon={Key}
                  iconBg="#EFF6FF"
                  iconColor="#2563EB"
                  timeframe={`Top 10: ${dashboardData.metrics.top10Keywords}`}
                />
                <KpiCard
                  label="Technical Issues"
                  value={dashboardData.metrics.technicalIssues}
                  icon={AlertTriangle}
                  iconBg="#FEF2F2"
                  iconColor="#DC2626"
                  timeframe={`Resolved: ${dashboardData.metrics.resolvedIssues}`}
                />
              </div>

              {/* Visualization Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#111827]">Organic Traffic Trend</h3>
                      <p className="text-xs text-[#6B7280]">Estimated monthly organic search volume</p>
                    </div>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2">
                    {dashboardData.charts.trafficTrend.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold text-[#4F46E5]">{item.organic.toLocaleString()}</span>
                        <div
                          className="w-full bg-[#4F46E5] rounded-t-[6px] transition-all hover:bg-[#4338CA]"
                          style={{ height: `${Math.max(20, (item.organic / (dashboardData.metrics.organicTraffic || 1)) * 140)}px` }}
                        />
                        <span className="text-xs font-semibold text-[#6B7280]">{item.month}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="space-y-4">
                  <h3 className="text-sm font-bold text-[#111827]">Keyword Position Distribution</h3>
                  <div className="space-y-3 text-xs">
                    {[
                      { label: 'Top 3 Positions', count: dashboardData.charts.keywordDistribution.top3, color: '#16A34A' },
                      { label: 'Top 4-10 Positions', count: dashboardData.charts.keywordDistribution.top10, color: '#2563EB' },
                      { label: 'Top 11-20 Positions', count: dashboardData.charts.keywordDistribution.top20, color: '#D97706' },
                      { label: 'Top 21-50 Positions', count: dashboardData.charts.keywordDistribution.top50, color: '#9CA3AF' },
                    ].map((row, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>{row.label}</span>
                          <span className="font-bold">{row.count}</span>
                        </div>
                        <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: row.color,
                              width: `${Math.min(100, row.count * 10)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search SEO projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-[8px] border border-[#D1D5DB] bg-white text-[#111827]"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                    <tr>
                      <th className="px-5 py-3">Project Name</th>
                      <th className="px-4 py-3">Website Domain</th>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3">Health Score</th>
                      <th className="px-4 py-3">Organic Traffic</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#6B7280]">
                          No SEO projects created yet. Click "New SEO Project" to begin.
                        </td>
                      </tr>
                    ) : (
                      projects.map((p) => (
                        <tr key={p._id} className="hover:bg-[#F9FAFB]">
                          <td className="px-5 py-3 font-bold text-[#111827]">{p.name}</td>
                          <td className="px-4 py-3 font-medium text-[#4F46E5]">{p.website}</td>
                          <td className="px-4 py-3 text-[#4B5563]">{p.clientId?.companyName || 'Agency'}</td>
                          <td className="px-4 py-3 font-bold text-[#16A34A]">{p.healthScore}/100</td>
                          <td className="px-4 py-3 font-semibold">{p.organicTraffic?.toLocaleString() || 0}</td>
                          <td className="px-4 py-3">
                            <Badge variant={p.status === 'active' ? 'success' : 'default'} dot>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleRunAudit(p._id)}>
                              Audit
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TECHNICAL AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={issueSeverityFilter}
                    onChange={(e) => setIssueSeverityFilter(e.target.value)}
                    className="text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white"
                  >
                    <option value="all">Severity: All</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                    <tr>
                      <th className="px-5 py-3">Affected URL</th>
                      <th className="px-4 py-3">Issue Type</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {issues.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                          No technical issues detected. Run an audit to scan website structure.
                        </td>
                      </tr>
                    ) : (
                      issues.map((i) => (
                        <tr key={i._id} className="hover:bg-[#F9FAFB]">
                          <td className="px-5 py-3 font-medium text-[#111827] max-w-xs truncate">{i.url}</td>
                          <td className="px-4 py-3 font-semibold text-[#4B5563]">{i.issueType}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                i.severity === 'Critical'
                                  ? 'danger'
                                  : i.severity === 'High'
                                  ? 'warning'
                                  : 'default'
                              }
                            >
                              {i.severity}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={i.status === 'Resolved' ? 'success' : 'info'}>{i.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-[#6B7280] max-w-md">{i.recommendation || i.description}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ON-PAGE SEO */}
          {activeTab === 'onpage' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                    <tr>
                      <th className="px-5 py-3">Page URL</th>
                      <th className="px-4 py-3">Page Title</th>
                      <th className="px-4 py-3">Meta Description</th>
                      <th className="px-4 py-3">H1 Heading</th>
                      <th className="px-4 py-3">SEO Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {pages.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                          No tracked pages configured yet.
                        </td>
                      </tr>
                    ) : (
                      pages.map((pg) => (
                        <tr key={pg._id} className="hover:bg-[#F9FAFB]">
                          <td className="px-5 py-3 font-bold text-[#111827]">{pg.url}</td>
                          <td className="px-4 py-3 text-[#4B5563]">{pg.pageTitle || '—'}</td>
                          <td className="px-4 py-3 text-[#6B7280] max-w-xs truncate">{pg.metaDescription || '—'}</td>
                          <td className="px-4 py-3 font-medium">{pg.h1 || '—'}</td>
                          <td className="px-4 py-3 font-bold text-[#16A34A]">{pg.seoScore}/100</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: KEYWORDS */}
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <select
                    value={keywordIntentFilter}
                    onChange={(e) => setKeywordIntentFilter(e.target.value)}
                    className="text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white"
                  >
                    <option value="all">Intent: All</option>
                    <option value="Informational">Informational</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Transactional">Transactional</option>
                  </select>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsKeywordModalOpen(true)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Track Keyword</span>
                </Button>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                    <tr>
                      <th className="px-5 py-3">Keyword</th>
                      <th className="px-4 py-3">Search Volume</th>
                      <th className="px-4 py-3">Difficulty</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Search Intent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {keywords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                          No tracked keywords. Click "Track Keyword" to monitor SERP positions.
                        </td>
                      </tr>
                    ) : (
                      keywords.map((k) => (
                        <tr key={k._id} className="hover:bg-[#F9FAFB]">
                          <td className="px-5 py-3 font-bold text-[#111827]">{k.keyword}</td>
                          <td className="px-4 py-3 font-semibold">{k.searchVolume?.toLocaleString()}</td>
                          <td className="px-4 py-3">{k.keywordDifficulty}/100</td>
                          <td className="px-4 py-3 font-bold text-[#4F46E5]">{k.currentPosition ? `#${k.currentPosition}` : 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="info">{k.searchIntent}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: BACKLINKS */}
          {activeTab === 'backlinks' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setIsBacklinkModalOpen(true)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Backlink</span>
                </Button>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                    <tr>
                      <th className="px-5 py-3">Source Domain</th>
                      <th className="px-4 py-3">Source URL</th>
                      <th className="px-4 py-3">Target URL</th>
                      <th className="px-4 py-3">Anchor Text</th>
                      <th className="px-4 py-3">Link Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {backlinks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[#6B7280]">
                          No backlinks recorded yet.
                        </td>
                      </tr>
                    ) : (
                      backlinks.map((b) => (
                        <tr key={b._id} className="hover:bg-[#F9FAFB]">
                          <td className="px-5 py-3 font-bold text-[#111827]">{b.sourceDomain}</td>
                          <td className="px-4 py-3 text-[#4F46E5]">{b.sourceUrl}</td>
                          <td className="px-4 py-3 text-[#6B7280]">{b.targetUrl}</td>
                          <td className="px-4 py-3 font-medium">{b.anchorText || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={b.linkType === 'dofollow' ? 'success' : 'default'}>{b.linkType}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: COMPETITORS */}
          {activeTab === 'competitors' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setIsCompetitorModalOpen(true)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Competitor</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {competitors.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-[#6B7280]">
                    No competitors defined yet. Add competitors to benchmark SEO domain authority.
                  </div>
                ) : (
                  competitors.map((c) => (
                    <Card key={c._id} className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-sm text-[#111827]">{c.name}</h3>
                        <span className="text-xs text-[#4F46E5] font-medium">{c.domain}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#F3F4F6]">
                        <div>
                          <span className="text-[#6B7280]">Est. Traffic:</span>
                          <p className="font-bold">{c.metrics?.estimatedTraffic?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Keywords:</span>
                          <p className="font-bold">{c.metrics?.keywordsCount || 0}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: RECOMMENDATIONS & TASK CONVERSION */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-[#6B7280]">
                    No active SEO recommendations. Run an audit to generate tasks.
                  </div>
                ) : (
                  recommendations.map((r) => (
                    <Card key={r._id} className="space-y-3 border-l-4 border-l-[#4F46E5]">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-xs text-[#111827]">{r.title}</h3>
                        <Badge variant={r.priority === 'Critical' ? 'danger' : 'warning'}>{r.priority}</Badge>
                      </div>
                      <p className="text-xs text-[#6B7280]">{r.description}</p>
                      <div className="pt-2 flex justify-between items-center border-t border-[#F3F4F6]">
                        <span className="text-[11px] text-[#9CA3AF]">{r.url || 'Site-wide'}</span>
                        {r.taskId ? (
                          <Badge variant="success">Task Created</Badge>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleConvertTask(r._id)}>
                            Convert to Task
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 9: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setIsReportModalOpen(true)} className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Report</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-[#6B7280]">
                    No SEO client reports generated yet.
                  </div>
                ) : (
                  reports.map((rp) => (
                    <Card key={rp._id} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm text-[#111827]">{rp.title}</h3>
                          <p className="text-xs text-[#6B7280]">{rp.seoProjectId?.name}</p>
                        </div>
                        <Badge variant="info">Report</Badge>
                      </div>
                      <p className="text-xs text-[#4B5563] line-clamp-2">{rp.summary}</p>
                      <div className="pt-2 border-t border-[#F3F4F6] text-[11px] text-[#9CA3AF]">
                        Generated on {formatDate(rp.createdAt)}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* CREATE PROJECT MODAL */}
      {isProjectModalOpen && (
        <Modal title="Create New SEO Project" isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)}>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Project Name</label>
              <input
                type="text"
                required
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="e.g. E-Commerce SEO Growth"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Target Website / Domain</label>
              <input
                type="text"
                required
                value={projectForm.website}
                onChange={(e) => setProjectForm({ ...projectForm, website: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="https://clientbrand.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Assign Client</label>
              <select
                required
                value={projectForm.clientId}
                onChange={(e) => setProjectForm({ ...projectForm, clientId: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] bg-white"
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName || c.contactName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Target Keywords (comma-separated)</label>
              <input
                type="text"
                value={projectForm.targetKeywords}
                onChange={(e) => setProjectForm({ ...projectForm, targetKeywords: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="organic marketing, SEO services, digital growth"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsProjectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={actionLoading}>
                Create SEO Project
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* TRACK KEYWORD MODAL */}
      {isKeywordModalOpen && (
        <Modal title="Track New Keyword" isOpen={isKeywordModalOpen} onClose={() => setIsKeywordModalOpen(false)}>
          <form onSubmit={handleAddKeyword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Keyword</label>
              <input
                type="text"
                required
                value={keywordForm.keyword}
                onChange={(e) => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="e.g. best digital agency"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Monthly Search Volume</label>
                <input
                  type="number"
                  value={keywordForm.searchVolume}
                  onChange={(e) => setKeywordForm({ ...keywordForm, searchVolume: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Keyword Difficulty (0-100)</label>
                <input
                  type="number"
                  value={keywordForm.keywordDifficulty}
                  onChange={(e) => setKeywordForm({ ...keywordForm, keywordDifficulty: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsKeywordModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={actionLoading}>
                Add Keyword
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* LOG BACKLINK MODAL */}
      {isBacklinkModalOpen && (
        <Modal title="Log Backlink" isOpen={isBacklinkModalOpen} onClose={() => setIsBacklinkModalOpen(false)}>
          <form onSubmit={handleAddBacklink} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Source Domain</label>
              <input
                type="text"
                required
                value={backlinkForm.sourceDomain}
                onChange={(e) => setBacklinkForm({ ...backlinkForm, sourceDomain: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="techcrunch.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Source URL</label>
              <input
                type="text"
                required
                value={backlinkForm.sourceUrl}
                onChange={(e) => setBacklinkForm({ ...backlinkForm, sourceUrl: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="https://techcrunch.com/article"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Target Page URL</label>
              <input
                type="text"
                required
                value={backlinkForm.targetUrl}
                onChange={(e) => setBacklinkForm({ ...backlinkForm, targetUrl: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="https://clientdomain.com/blog"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsBacklinkModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={actionLoading}>
                Log Backlink
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD COMPETITOR MODAL */}
      {isCompetitorModalOpen && (
        <Modal title="Add Competitor" isOpen={isCompetitorModalOpen} onClose={() => setIsCompetitorModalOpen(false)}>
          <form onSubmit={handleAddCompetitor} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Competitor Name</label>
              <input
                type="text"
                required
                value={competitorForm.name}
                onChange={(e) => setCompetitorForm({ ...competitorForm, name: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Competitor Domain</label>
              <input
                type="text"
                required
                value={competitorForm.domain}
                onChange={(e) => setCompetitorForm({ ...competitorForm, domain: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="competitor.com"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsCompetitorModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={actionLoading}>
                Add Competitor
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* GENERATE REPORT MODAL */}
      {isReportModalOpen && (
        <Modal title="Generate SEO Client Report" isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)}>
          <form onSubmit={handleCreateReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Report Title</label>
              <input
                type="text"
                required
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px]"
                placeholder="Monthly SEO Audit & Ranking Progress"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Summary Notes</label>
              <textarea
                value={reportForm.summary}
                onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                className="w-full text-xs p-2.5 border border-[#D1D5DB] rounded-[8px] h-20"
                placeholder="Highlights of keyword ranking gains and technical audit improvements..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsReportModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={actionLoading}>
                Generate Report
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
