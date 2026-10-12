import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Copy,
  Check,
  RefreshCw,
  Bookmark,
  Download,
  Trash2,
  Search,
  Globe,
  SlidersHorizontal,
  Layers,
  MessageSquare,
  Bot,
  User,
  Wand2,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Zap,
  ArrowRight,
  ShieldCheck,
  Hash,
  Lightbulb,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import * as aiService from '../services/aiMarketingService'
import { formatDate } from '../utils/formatters'

export function AIMarketingAssistantPage() {
  const { user } = useAuth()

  // Primary active tab
  const [activeTab, setActiveTab] = useState('content')

  // Global usage & feedback states
  const [usageStats, setUsageStats] = useState(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  // ----------------------------------------------------
  // TAB 1: AI CONTENT GENERATOR STATE
  // ----------------------------------------------------
  const [contentForm, setContentForm] = useState({
    brandName: 'Krishpo Digital',
    productService: 'Performance SEO & Social Ad Management',
    platform: 'Instagram',
    contentType: 'Social Post',
    objective: 'Lead Generation',
    targetAudience: 'Indian Business Founders & CMOs',
    tone: 'Engaging & Professional',
    language: 'English',
    cta: 'Book a Free Consultation',
    keywords: 'roi marketing, seo agency, scale sales',
    length: 'Medium',
  })
  const [generatingContent, setGeneratingContent] = useState(false)
  const [generatedResult, setGeneratedResult] = useState(null)
  const [editableCopy, setEditableCopy] = useState('')
  const [isSavingContent, setIsSavingContent] = useState(false)

  // ----------------------------------------------------
  // TAB 2: AI SEO ASSISTANT STATE
  // ----------------------------------------------------
  const [seoForm, setSeoForm] = useState({
    inputMode: 'url', // 'url' | 'content'
    url: 'https://krishpo.com',
    pageContent: '',
    targetKeywords: 'digital marketing agency, technical seo audit, roas management',
    industry: 'Digital Marketing & E-Commerce',
  })
  const [runningSeo, setRunningSeo] = useState(false)
  const [seoAnalysisResult, setSeoAnalysisResult] = useState(null)

  // ----------------------------------------------------
  // TAB 3: CAMPAIGN PLANNER STATE
  // ----------------------------------------------------
  const [campaignForm, setCampaignForm] = useState({
    productName: 'E-Commerce Growth Retainer',
    objective: 'Sales & Revenue Scale',
    targetMarket: 'India (Tier-1 Metro Cities)',
    budget: 150000,
    durationWeeks: 4,
    preferredChannels: ['Meta Ads', 'Google Ads', 'SEO Landing Pages'],
  })
  const [generatingCampaign, setGeneratingCampaign] = useState(false)
  const [campaignPlanResult, setCampaignPlanResult] = useState(null)

  // ----------------------------------------------------
  // TAB 4: MARKETING CHAT STATE
  // ----------------------------------------------------
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I am Krishpo AI, your agency marketing intelligence co-pilot. I can help analyze your campaigns, optimize Shopify store conversions, review SEO crawl issues, or draft marketing strategies. What are we scaling today?`,
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)

  // ----------------------------------------------------
  // TAB 5: SAVED LIBRARY & HISTORY STATE
  // ----------------------------------------------------
  const [savedItems, setSavedItems] = useState([])
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [librarySubTab, setLibrarySubTab] = useState('saved')
  const [librarySearch, setLibrarySearch] = useState('')
  const [viewItemModal, setViewItemModal] = useState(null)

  // Load initial usage stats
  useEffect(() => {
    loadUsage()
  }, [])

  // Auto-dismiss toasts
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const loadUsage = async () => {
    try {
      setLoadingUsage(true)
      const data = await aiService.fetchUsageStats()
      setUsageStats(data)
    } catch {
      // safe fallback
    } finally {
      setLoadingUsage(false)
    }
  }

  const showToast = (type, message) => {
    setFeedback({ type, message })
  }

  const copyToClipboard = (text, key = 'generic') => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    showToast('success', 'Copied to clipboard!')
    setTimeout(() => setCopiedKey(null), 2500)
  }

  // ----------------------------------------------------
  // CONTENT GENERATOR HANDLERS
  // ----------------------------------------------------
  const handleGenerateContent = async (e) => {
    if (e) e.preventDefault()
    try {
      setGeneratingContent(true)
      const kwArray = contentForm.keywords
        ? contentForm.keywords.split(',').map((k) => k.trim()).filter(Boolean)
        : []

      const res = await aiService.generateContent({
        ...contentForm,
        keywords: kwArray,
      })

      setGeneratedResult(res)
      setEditableCopy(res.content)
      showToast('success', 'Marketing copy generated successfully!')
      loadUsage()
    } catch (err) {
      showToast('error', err.message || 'Generation failed. Please try again.')
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleImproveContent = async (instruction = 'improve') => {
    if (!editableCopy) return
    try {
      setGeneratingContent(true)
      let adjustedTone = contentForm.tone
      if (instruction === 'punchy') adjustedTone = 'High-Urgency & Punchy'
      if (instruction === 'friendly') adjustedTone = 'Friendly & Conversational'
      if (instruction === 'authoritative') adjustedTone = 'Professional & Authoritative'

      const res = await aiService.generateContent({
        ...contentForm,
        tone: adjustedTone,
        productService: `Refine and ${instruction}: ${editableCopy.slice(0, 300)}`,
      })

      setGeneratedResult(res)
      setEditableCopy(res.content)
      showToast('success', `Content updated (${instruction})!`)
    } catch (err) {
      showToast('error', 'Could not refine content.')
    } finally {
      setGeneratingContent(false)
    }
  }

  const handleSaveContentToLibrary = async () => {
    if (!editableCopy) return
    try {
      setIsSavingContent(true)
      const title = `${contentForm.platform} Copy: ${contentForm.productService.slice(0, 30)}`
      await aiService.saveItem({
        title,
        type: 'content',
        platform: contentForm.platform,
        content: editableCopy,
        tags: [contentForm.platform, contentForm.contentType, contentForm.tone],
        generationId: generatedResult?.generationId,
      })
      showToast('success', 'Saved to your Krishpo AI Library!')
      loadUsage()
    } catch (err) {
      showToast('error', 'Failed to save asset.')
    } finally {
      setIsSavingContent(false)
    }
  }

  const handleDownloadTxt = (filename, content) => {
    const element = document.createElement('a')
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' })
    element.href = URL.createObjectURL(file)
    element.download = `${filename || 'krishpo-content'}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    showToast('success', 'File downloaded!')
  }

  // ----------------------------------------------------
  // SEO ASSISTANT HANDLERS
  // ----------------------------------------------------
  const handleRunSeoAnalysis = async (e) => {
    if (e) e.preventDefault()
    try {
      setRunningSeo(true)
      const kwArray = seoForm.targetKeywords
        ? seoForm.targetKeywords.split(',').map((k) => k.trim()).filter(Boolean)
        : []

      const res = await aiService.generateSEOAnalysis({
        url: seoForm.inputMode === 'url' ? seoForm.url : '',
        pageContent: seoForm.inputMode === 'content' ? seoForm.pageContent : '',
        targetKeywords: kwArray,
        industry: seoForm.industry,
      })

      setSeoAnalysisResult(res.analysis)
      showToast('success', 'SEO Intelligence analysis complete!')
      loadUsage()
    } catch (err) {
      showToast('error', err.message || 'SEO analysis failed.')
    } finally {
      setRunningSeo(false)
    }
  }

  const handleSaveSeoPlan = async () => {
    if (!seoAnalysisResult) return
    try {
      const title = `SEO Blueprint: ${seoAnalysisResult.targetUrl || seoForm.url || 'Web Page'}`
      await aiService.saveItem({
        title,
        type: 'seo',
        platform: 'SEO & Search',
        content: JSON.stringify(seoAnalysisResult, null, 2),
        tags: ['SEO', 'Keywords', 'Technical'],
      })
      showToast('success', 'SEO plan saved to library!')
      loadUsage()
    } catch (err) {
      showToast('error', 'Failed to save SEO plan.')
    }
  }

  // ----------------------------------------------------
  // CAMPAIGN PLANNER HANDLERS
  // ----------------------------------------------------
  const handleGenerateCampaignPlan = async (e) => {
    if (e) e.preventDefault()
    try {
      setGeneratingCampaign(true)
      const res = await aiService.generateCampaignPlan({
        ...campaignForm,
        budget: Number(campaignForm.budget),
        durationWeeks: Number(campaignForm.durationWeeks),
      })
      setCampaignPlanResult(res.plan)
      showToast('success', 'Campaign blueprint generated!')
      loadUsage()
    } catch (err) {
      showToast('error', err.message || 'Failed to generate campaign plan.')
    } finally {
      setGeneratingCampaign(false)
    }
  }

  const handleSaveCampaignPlan = async () => {
    if (!campaignPlanResult) return
    try {
      const title = `Campaign Strategy: ${campaignPlanResult.productName || campaignForm.productName}`
      await aiService.saveItem({
        title,
        type: 'campaign',
        platform: 'Omnichannel',
        content: JSON.stringify(campaignPlanResult, null, 2),
        tags: ['Campaign', 'Strategy', 'Budget'],
      })
      showToast('success', 'Campaign plan saved to library!')
      loadUsage()
    } catch (err) {
      showToast('error', 'Failed to save campaign plan.')
    }
  }

  // ----------------------------------------------------
  // MARKETING CHAT HANDLERS
  // ----------------------------------------------------
  const handleSendChat = async (presetText) => {
    const textToSend = presetText || chatInput
    if (!textToSend || !textToSend.trim() || chatLoading) return

    const userMsg = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await aiService.sendChatMessage({
        message: textToSend.trim(),
        conversationId,
      })

      if (res.conversationId) {
        setConversationId(res.conversationId)
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          timestamp: new Date(),
        },
      ])
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  // ----------------------------------------------------
  // LIBRARY & HISTORY HANDLERS
  // ----------------------------------------------------
  const loadLibraryData = async () => {
    if (librarySubTab === 'saved') {
      try {
        setLoadingSaved(true)
        const items = await aiService.fetchSavedItems({ search: librarySearch })
        setSavedItems(items)
      } finally {
        setLoadingSaved(false)
      }
    } else {
      try {
        setLoadingHistory(true)
        const res = await aiService.fetchGenerationHistory()
        setHistoryItems(res.items || [])
      } finally {
        setLoadingHistory(false)
      }
    }
  }

  useEffect(() => {
    if (activeTab === 'saved') {
      loadLibraryData()
    }
  }, [activeTab, librarySubTab, librarySearch])

  const handleDeleteSaved = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await aiService.deleteSavedItem(id)
      setSavedItems((prev) => prev.filter((i) => i._id !== id))
      showToast('success', 'Asset removed from library.')
      loadUsage()
    } catch (err) {
      showToast('error', 'Failed to remove asset.')
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 animate-in slide-in-from-top-2 ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 text-xs font-bold tracking-wider uppercase rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                KRISHPO INTELLIGENCE
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                {usageStats?.configuredProvider || 'Active AI Engine'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Marketing Assistant
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Generate high-converting social copy, perform automated SEO audits, blueprint omnichannel campaigns, and chat with agency data in Indian Rupees (₹).
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 shrink-0">
            <div className="text-center px-3 border-r border-white/10">
              <p className="text-xs text-slate-400 font-medium">Generations</p>
              <p className="text-lg font-bold text-white">
                {loadingUsage ? '...' : usageStats?.totalGenerations || 0}
              </p>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <p className="text-xs text-slate-400 font-medium">SEO Audits</p>
              <p className="text-lg font-bold text-indigo-300">
                {loadingUsage ? '...' : usageStats?.byType?.seo || 0}
              </p>
            </div>
            <div className="text-center px-3">
              <p className="text-xs text-slate-400 font-medium">Saved Assets</p>
              <p className="text-lg font-bold text-emerald-300">
                {loadingUsage ? '...' : usageStats?.savedCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-white/10 mt-6 scrollbar-none">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Content Generator
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'seo'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-4 h-4" />
            AI SEO Assistant
          </button>
          <button
            onClick={() => setActiveTab('campaign')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'campaign'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            Campaign Planner
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Marketing Co-Pilot Chat
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'saved'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Library & History
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI CONTENT GENERATOR                                               */}
      {/* ========================================================================= */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: 5 Cols */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-indigo-600" />
                Content Parameters
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your target audience, platform, and messaging goals.
              </p>
            </div>

            <form onSubmit={handleGenerateContent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={contentForm.brandName}
                    onChange={(e) => setContentForm({ ...contentForm, brandName: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Krishpo Organic"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Platform
                  </label>
                  <select
                    value={contentForm.platform}
                    onChange={(e) => setContentForm({ ...contentForm, platform: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Google Ads">Google Ads</option>
                    <option value="Email Campaign">Email Campaign</option>
                    <option value="Blog Outline">Blog Article</option>
                    <option value="Twitter / X">Twitter / X</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Product / Service Description
                </label>
                <textarea
                  value={contentForm.productService}
                  onChange={(e) => setContentForm({ ...contentForm, productService: e.target.value })}
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="What are you promoting? Highlight unique features..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Content Type
                  </label>
                  <select
                    value={contentForm.contentType}
                    onChange={(e) => setContentForm({ ...contentForm, contentType: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Social Post">Social Caption</option>
                    <option value="Carousel Script">Carousel Script</option>
                    <option value="Ad Copy">High-CTR Ad Copy</option>
                    <option value="Cold Outreach">Outreach Email</option>
                    <option value="Hashtag Stack">Hashtags + Hook</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tone of Voice
                  </label>
                  <select
                    value={contentForm.tone}
                    onChange={(e) => setContentForm({ ...contentForm, tone: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Engaging & Professional">Engaging & Professional</option>
                    <option value="Bold & Disruptive">Bold & Disruptive</option>
                    <option value="Urgent & Persuasive">Urgent & Persuasive</option>
                    <option value="Friendly & Educational">Friendly & Educational</option>
                    <option value="Sophisticated & Premium">Sophisticated & Premium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={contentForm.targetAudience}
                  onChange={(e) => setContentForm({ ...contentForm, targetAudience: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Indian D2C Founders, E-Commerce managers"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Call To Action (CTA)
                  </label>
                  <input
                    type="text"
                    value={contentForm.cta}
                    onChange={(e) => setContentForm({ ...contentForm, cta: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Shop Now, Book Audit"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Language
                  </label>
                  <select
                    value={contentForm.language}
                    onChange={(e) => setContentForm({ ...contentForm, language: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Hinglish (Hindi-English)">Hinglish (Hindi-English)</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={contentForm.keywords}
                  onChange={(e) => setContentForm({ ...contentForm, keywords: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="growth agency, performance marketing, seo"
                />
              </div>

              <button
                type="submit"
                disabled={generatingContent}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {generatingContent ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Marketing Copy
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Editor & Actions: 7 Cols */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Generated Output (Editable)
                </h3>
                <p className="text-xs text-slate-500">
                  Refine the copy directly or use one-click AI enhancement tools.
                </p>
              </div>

              {editableCopy && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => copyToClipboard(editableCopy, 'content')}
                    className="p-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedKey === 'content' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy
                  </button>
                  <button
                    onClick={handleSaveContentToLibrary}
                    disabled={isSavingContent}
                    className="p-2 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadTxt(
                        `${contentForm.platform.toLowerCase()}-copy`,
                        editableCopy
                      )
                    }
                    className="p-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                    title="Download .txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Editable Text Area */}
            <div className="relative">
              <textarea
                value={editableCopy}
                onChange={(e) => setEditableCopy(e.target.value)}
                placeholder="Your AI-generated marketing copy will appear here. Fill in the parameters and click Generate..."
                rows={14}
                className="w-full text-sm font-sans leading-relaxed border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            {/* Quick AI Refinement Actions */}
            {editableCopy && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  Instant AI Enhancers:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleImproveContent('punchy')}
                    disabled={generatingContent}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 shadow-sm transition-all"
                  >
                    ⚡ Make More Punchy
                  </button>
                  <button
                    onClick={() => handleImproveContent('shorten')}
                    disabled={generatingContent}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 shadow-sm transition-all"
                  >
                    ✂️ Shorten for Mobile
                  </button>
                  <button
                    onClick={() => handleImproveContent('authoritative')}
                    disabled={generatingContent}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 shadow-sm transition-all"
                  >
                    👔 More Professional
                  </button>
                  <button
                    onClick={() => handleGenerateContent()}
                    disabled={generatingContent}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 shadow-sm transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerate Fresh
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI SEO ASSISTANT                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          {/* SEO Input Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  AI SEO Intelligence & On-Page Auditor
                </h2>
                <p className="text-xs text-slate-500">
                  Analyze webpage content, extract target keywords, generate SERP titles & meta descriptions, and detect technical bottlenecks.
                </p>
              </div>

              {/* Input Mode Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setSeoForm({ ...seoForm, inputMode: 'url' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    seoForm.inputMode === 'url'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Website URL
                </button>
                <button
                  type="button"
                  onClick={() => setSeoForm({ ...seoForm, inputMode: 'content' })}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    seoForm.inputMode === 'content'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Content
                </button>
              </div>
            </div>

            <form onSubmit={handleRunSeoAnalysis} className="space-y-4">
              {seoForm.inputMode === 'url' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Public Website URL (Protected with SSRF Validation)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={seoForm.url}
                      onChange={(e) => setSeoForm({ ...seoForm, url: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Paste Draft Content / Landing Page Snippet
                  </label>
                  <textarea
                    value={seoForm.pageContent}
                    onChange={(e) => setSeoForm({ ...seoForm, pageContent: e.target.value })}
                    rows={4}
                    placeholder="Paste full text or HTML draft here for keyword and structure optimization..."
                    className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Target Keywords (Optional)
                  </label>
                  <input
                    type="text"
                    value={seoForm.targetKeywords}
                    onChange={(e) => setSeoForm({ ...seoForm, targetKeywords: e.target.value })}
                    placeholder="e.g. ecommerce marketing, roas audit"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Industry Domain
                  </label>
                  <select
                    value={seoForm.industry}
                    onChange={(e) => setSeoForm({ ...seoForm, industry: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Digital Marketing & Agency">Digital Marketing & Agency</option>
                    <option value="E-Commerce & Retail">E-Commerce & D2C</option>
                    <option value="SaaS & Technology">SaaS & B2B Technology</option>
                    <option value="Real Estate & Property">Real Estate & Construction</option>
                    <option value="Healthcare & Wellness">Healthcare & Wellness</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={runningSeo}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {runningSeo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing Page & SERP Landscape...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run AI SEO Audit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* SEO Output Section */}
          {seoAnalysisResult && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              {/* Action Toolbar */}
              <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Audit target: {seoAnalysisResult.targetUrl}
                  </p>
                  <p className="text-xs text-slate-500">
                    Distinguishing AI strategic recommendations from live crawled data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(seoAnalysisResult, null, 2),
                        'seo-raw'
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy JSON
                  </button>
                  <button
                    onClick={handleSaveSeoPlan}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    Save to Library
                  </button>
                </div>
              </div>

              {/* SERP Snippet Preview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  Google SERP Snippet Preview
                </h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 max-w-2xl font-sans">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                      G
                    </span>
                    <span>{seoAnalysisResult.targetUrl || 'https://example.com'}</span>
                  </div>
                  <h4 className="text-lg font-medium text-blue-700 hover:underline cursor-pointer leading-snug">
                    {seoAnalysisResult.seoTitle}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {seoAnalysisResult.metaDescription}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-600 uppercase mb-1">Optimized H1</p>
                    <p className="text-sm font-medium text-slate-800">
                      {seoAnalysisResult.headings?.h1 || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-600 uppercase mb-1">
                      Recommended H2 Subheadings
                    </p>
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {seoAnalysisResult.headings?.recommendedH2s?.map((h2, idx) => (
                        <li key={idx}>{h2}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Keyword Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Hash className="w-4 h-4 text-emerald-600" />
                    Primary High-Intent Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {seoAnalysisResult.primaryKeywords?.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-indigo-600" />
                    Secondary & Long-Tail Targets
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {seoAnalysisResult.secondaryKeywords?.map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* On-Page Recommendations Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Actionable On-Page SEO Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {seoAnalysisResult.onPageRecommendations?.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Briefs & Internal Linking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Suggested Blog Content Briefs
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {seoAnalysisResult.blogTopics?.map((topic, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        📌 {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Internal Linking Recommendations
                  </h3>
                  <div className="space-y-2 text-xs text-slate-700">
                    {seoAnalysisResult.internalLinks?.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <span className="font-semibold text-indigo-600">"{link.anchor}"</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          → {link.suggestedTarget}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CAMPAIGN PLANNER                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'campaign' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Omnichannel Campaign Blueprint Planner
              </h2>
              <p className="text-xs text-slate-500">
                Plan campaign goals, audience personas, messaging hooks, and budget allocation in Indian Rupees (₹).
              </p>
            </div>

            <form onSubmit={handleGenerateCampaignPlan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Campaign Product / Service Name
                  </label>
                  <input
                    type="text"
                    value={campaignForm.productName}
                    onChange={(e) => setCampaignForm({ ...campaignForm, productName: e.target.value })}
                    placeholder="e.g. D2C Summer Apparel Line"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Primary Objective
                  </label>
                  <select
                    value={campaignForm.objective}
                    onChange={(e) => setCampaignForm({ ...campaignForm, objective: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Lead Generation">Lead Generation</option>
                    <option value="E-Commerce Sales">E-Commerce Sales (High ROAS)</option>
                    <option value="Brand Awareness & Reach">Brand Awareness & Reach</option>
                    <option value="Product Launch">New Product Launch</option>
                    <option value="App Installs">App Installs & Signups</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Total Campaign Budget (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={campaignForm.budget}
                      onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                      placeholder="100000"
                      className="w-full text-sm border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Duration (Weeks)
                  </label>
                  <select
                    value={campaignForm.durationWeeks}
                    onChange={(e) => setCampaignForm({ ...campaignForm, durationWeeks: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value={2}>2 Weeks (Sprint)</option>
                    <option value={4}>4 Weeks (Standard Month)</option>
                    <option value={8}>8 Weeks (Quarterly)</option>
                    <option value={12}>12 Weeks (Full Season)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Target Geographic Market
                  </label>
                  <input
                    type="text"
                    value={campaignForm.targetMarket}
                    onChange={(e) => setCampaignForm({ ...campaignForm, targetMarket: e.target.value })}
                    placeholder="e.g. India - Delhi, Mumbai, Bengaluru"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={generatingCampaign}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {generatingCampaign ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating Strategy...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Campaign Strategy
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Campaign Strategy Output */}
          {campaignPlanResult && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              {/* Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      {campaignPlanResult.productName} Blueprint
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Objective: <strong className="text-indigo-600">{campaignPlanResult.objective}</strong> •
                      Total Budget: <strong className="text-emerald-600">₹{Number(campaignForm.budget).toLocaleString('en-IN')}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(campaignPlanResult, null, 2),
                          'camp-raw'
                        )
                      }
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Plan
                    </button>
                    <button
                      onClick={handleSaveCampaignPlan}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      Save to Library
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-sm text-slate-700 leading-relaxed">
                  {campaignPlanResult.executiveBrief}
                </div>
              </div>

              {/* Budget Allocation Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Recommended Budget Allocation (Indian Rupees ₹)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaignPlanResult.budgetAllocation?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 hover:border-indigo-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          {item.channel}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-indigo-100 text-indigo-700">
                          {item.share}
                        </span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">
                        {item.amountInRupees}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audience Personas & Messaging Angles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Target Audience Personas
                  </h3>
                  <div className="space-y-3">
                    {campaignPlanResult.targetPersonas?.map((persona, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1.5"
                      >
                        <h4 className="text-sm font-bold text-slate-900">{persona.name}</h4>
                        <p className="text-xs text-slate-500">
                          <strong>Demographics:</strong> {persona.demographics}
                        </p>
                        <p className="text-xs text-slate-600">
                          <strong>Pain Points:</strong> {persona.painPoints}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    High-Converting Messaging Hooks
                  </h3>
                  <div className="space-y-3">
                    {campaignPlanResult.messagingAngles?.map((angle, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1"
                      >
                        <p className="text-sm font-bold text-indigo-700">"{angle.hook}"</p>
                        <p className="text-xs text-slate-600">{angle.angle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly Execution Roadmap */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Weekly Execution Milestones
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {campaignPlanResult.weeklyMilestones?.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1"
                    >
                      <span className="text-xs font-black text-indigo-600 uppercase">
                        {step.week}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {step.focus}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projected KPIs */}
              {campaignPlanResult.projectedKPIs && (
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Projected Campaign KPIs
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      *Estimates based on regional performance benchmarks
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    <div>
                      <p className="text-xs text-slate-400">Estimated Reach</p>
                      <p className="text-lg font-bold text-white">
                        {campaignPlanResult.projectedKPIs.estimatedImpressions}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Target Clicks</p>
                      <p className="text-lg font-bold text-indigo-300">
                        {campaignPlanResult.projectedKPIs.estimatedClicks}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Expected CTR</p>
                      <p className="text-lg font-bold text-emerald-300">
                        {campaignPlanResult.projectedKPIs.targetCTR}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Estimated ROAS</p>
                      <p className="text-lg font-bold text-amber-300">
                        {campaignPlanResult.projectedKPIs.estimatedROAS}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MARKETING CO-PILOT CHAT                                            */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Krishpo Marketing Co-Pilot</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Grounded with your Agency SEO & Shopify data
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setChatMessages([
                  {
                    role: 'assistant',
                    content: 'Started a fresh session! What marketing question or campaign can I assist you with?',
                    timestamp: new Date(),
                  },
                ])
                setConversationId(null)
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              New Conversation
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Try asking:</span>
            {[
              'How can I increase sales for my Shopify store?',
              'What SEO strategies work best in India?',
              'How to lower Meta Ads CAC?',
              'Draft an abandoned cart email flow',
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(prompt)}
                className="px-3 py-1 text-xs font-medium bg-white rounded-full border border-slate-200 hover:border-indigo-400 text-slate-700 whitespace-nowrap shadow-2xs transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-900 rounded-tl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-end">
                      <button
                        onClick={() => copyToClipboard(msg.content, `chat-${idx}`)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        {copiedKey === `chat-${idx}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy Response
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 max-w-xl">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 text-slate-500 text-sm flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  Analyzing agency context and generating advice...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendChat()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask any marketing question (e.g. 'How do I scale my Google Search ads?')..."
                className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SAVED LIBRARY & GENERATION HISTORY                                 */}
      {/* ========================================================================= */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLibrarySubTab('saved')}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                    librarySubTab === 'saved'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Saved Assets Library ({savedItems.length})
                </button>
                <button
                  onClick={() => setLibrarySubTab('history')}
                  className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                    librarySubTab === 'history'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Generation History
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search saved assets..."
                  className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* List Table / Cards */}
            {librarySubTab === 'saved' ? (
              loadingSaved ? (
                <div className="py-12 flex justify-center">
                  <Loading size="md" title="Loading your saved library..." />
                </div>
              ) : savedItems.length === 0 ? (
                <EmptyState
                  title="No Saved Assets Yet"
                  description="When you generate copy, SEO plans, or campaign blueprints, click 'Save' to bookmark them here."
                  icon={Bookmark}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedItems.map((item) => (
                    <div
                      key={item._id}
                      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-md bg-indigo-50 text-indigo-700">
                            {item.platform || item.type}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-mono bg-slate-50 p-2 rounded-lg">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          onClick={() => copyToClipboard(item.content, item._id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          {copiedKey === item._id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          Copy
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleDownloadTxt(
                                (item.title || 'asset').replace(/\s+/g, '-'),
                                item.content
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSaved(item._id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : loadingHistory ? (
              <div className="py-12 flex justify-center">
                <Loading size="md" title="Loading generation history..." />
              </div>
            ) : historyItems.length === 0 ? (
              <EmptyState
                title="No Generation History"
                description="Generations are logged here automatically."
                icon={Sparkles}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Title / Type</th>
                      <th className="py-3 px-4">Provider / Model</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyItems.map((hist) => (
                      <tr key={hist._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{hist.title}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {hist.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {hist.provider} ({hist.model})
                        </td>
                        <td className="py-3 px-4">{formatDate(hist.createdAt)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => copyToClipboard(hist.outputContent, hist._id)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                          >
                            Copy Output
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export default AIMarketingAssistantPage
