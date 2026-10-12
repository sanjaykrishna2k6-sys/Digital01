import React, { useState, useEffect } from 'react'
import {
  Receipt,
  IndianRupee,
  Plus,
  CheckCircle2,
  Clock,
  Download,
  CreditCard,
  Search,
  Filter,
  Eye,
  Trash2,
  Send,
  FileText,
  AlertCircle,
  Building2,
  User,
  Calendar,
  Layers,
  Settings,
  X,
  Check,
  RefreshCw,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatINR, formatDate } from '../utils/formatters'
import { API_BASE_URL } from '../services/apiConfig'

const DIGITAL_MARKETING_SERVICES = [
  { name: 'SEO Monthly Retainer', sacHsn: '998311', defaultPrice: 35000, unit: 'Month', gstRate: 18 },
  { name: 'Shopify Store Management & CRO', sacHsn: '998313', defaultPrice: 45000, unit: 'Month', gstRate: 18 },
  { name: 'Google Ads Campaign Management', sacHsn: '998311', defaultPrice: 25000, unit: 'Month', gstRate: 18 },
  { name: 'Meta Ads Management & Creatives', sacHsn: '998311', defaultPrice: 30000, unit: 'Month', gstRate: 18 },
  { name: 'Social Media Management', sacHsn: '998311', defaultPrice: 20000, unit: 'Month', gstRate: 18 },
  { name: 'Custom Website Development', sacHsn: '998314', defaultPrice: 75000, unit: 'Project', gstRate: 18 },
  { name: 'Content Creation & Copywriting', sacHsn: '998311', defaultPrice: 15000, unit: 'Month', gstRate: 18 },
  { name: 'Marketing Analytics & Reporting', sacHsn: '998311', defaultPrice: 12000, unit: 'Month', gstRate: 18 },
  { name: 'Consulting & Strategy Session', sacHsn: '998311', defaultPrice: 10000, unit: 'Hour', gstRate: 18 },
]

export function BillingPage() {
  const [activeTab, setActiveTab] = useState('invoices') // 'invoices' | 'retainers' | 'settings'

  // Data States
  const [summary, setSummary] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [retainers, setRetainers] = useState([])
  const [clients, setClients] = useState([])
  const [orgSettings, setOrgSettings] = useState({})
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false)
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [showCreateRetainerModal, setShowCreateRetainerModal] = useState(false)

  // Form States
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    invoiceNumber: '',
    invoiceType: 'Tax Invoice',
    paymentTerms: '15 Days',
    placeOfSupply: 'Intra-State',
    isGSTApplicable: true,
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Thank you for choosing Krishpo. Please remit payment by the due date.',
    termsAndConditions: '1. Payment due within specified terms. 2. Late payments subject to 1.5% interest per month.',
    items: [
      {
        name: 'SEO Monthly Retainer',
        sacHsn: '998311',
        quantity: 1,
        unit: 'Month',
        unitPrice: 35000,
        discount: 0,
        gstRate: 18,
      },
    ],
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
  })

  const [retainerForm, setRetainerForm] = useState({
    clientId: '',
    agreementTitle: '',
    monthlyAmount: '',
    billingFrequency: 'Monthly',
    paymentTerms: '7 Days',
    services: 'SEO Monthly Retainer, Meta Ads',
    notes: '',
  })

  const [settingsForm, setSettingsForm] = useState({
    legalName: '',
    gstin: '',
    billingAddress: '',
    state: 'Tamil Nadu',
    stateCode: '33',
    phone: '',
    email: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    invoicePrefix: 'KRP',
  })

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [statusFilter, search])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
      const authHeaders = { Authorization: token ? `Bearer ${token}` : '' }

      // 1. Summary
      const sumRes = await fetch(`${API_BASE_URL}/billing/summary`, { credentials: 'include', headers: authHeaders })
      const sumData = await sumRes.json()
      if (sumData.success) setSummary(sumData.data.summary)

      // 2. Invoices
      let invUrl = `${API_BASE_URL}/billing/invoices?status=${statusFilter}`
      if (search) invUrl += `&search=${encodeURIComponent(search)}`
      const invRes = await fetch(invUrl, { credentials: 'include', headers: authHeaders })
      const invData = await invRes.json()
      if (invData.success) setInvoices(invData.data.invoices || [])

      // 3. Clients for dropdown
      const clientRes = await fetch(`${API_BASE_URL}/clients`, { credentials: 'include', headers: authHeaders })
      const clientData = await clientRes.json()
      if (clientData.success) setClients(clientData.data?.clients || clientData.clients || [])

      // 4. Retainers
      const retRes = await fetch(`${API_BASE_URL}/billing/retainers/list`, { credentials: 'include', headers: authHeaders })
      const retData = await retRes.json()
      if (retData.success) setRetainers(retData.data.retainers || [])

      // 5. Settings
      const setRes = await fetch(`${API_BASE_URL}/billing/settings/get`, { credentials: 'include', headers: authHeaders })
      const setJson = await setRes.json()
      if (setJson.success && setJson.data?.settings) {
        const s = setJson.data.settings
        setOrgSettings(s)
        setSettingsForm({
          legalName: s.legalName || 'Krishpo Marketing Agency',
          gstin: s.gstin || '',
          billingAddress: s.billingAddress || '',
          state: s.state || 'Tamil Nadu',
          stateCode: s.stateCode || '33',
          phone: s.phone || '',
          email: s.email || '',
          bankName: s.bankDetails?.bankName || '',
          accountNumber: s.bankDetails?.accountNumber || '',
          ifscCode: s.bankDetails?.ifscCode || '',
          branch: s.bankDetails?.branch || '',
          invoicePrefix: s.invoicePrefix || 'KRP',
        })
      }
    } catch (err) {
      console.error('Error loading billing data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculation Helper
  const calculateTotals = () => {
    let sub = 0
    let discSum = 0
    let taxable = 0
    let cgstSum = 0
    let sgstSum = 0
    let igstSum = 0

    const items = invoiceForm.items.map((item) => {
      const q = Number(item.quantity) || 0
      const p = Number(item.unitPrice) || 0
      const d = Number(item.discount) || 0
      const rawTax = Math.max(0, q * p - d)
      const gstRate = invoiceForm.isGSTApplicable ? Number(item.gstRate ?? 18) : 0

      let cgst = 0
      let sgst = 0
      let igst = 0

      if (invoiceForm.isGSTApplicable && gstRate > 0) {
        const gstAmt = (rawTax * gstRate) / 100
        if (invoiceForm.placeOfSupply === 'Inter-State') {
          igst = Math.round(gstAmt * 100) / 100
        } else {
          cgst = Math.round((gstAmt / 2) * 100) / 100
          sgst = Math.round((gstAmt / 2) * 100) / 100
        }
      }

      const tot = Math.round((rawTax + cgst + sgst + igst) * 100) / 100
      sub += q * p
      discSum += d
      taxable += rawTax
      cgstSum += cgst
      sgstSum += sgst
      igstSum += igst

      return { ...item, lineTotal: tot }
    })

    const taxSum = cgstSum + sgstSum + igstSum
    const grandTotal = Math.round((taxable + taxSum) * 100) / 100

    return { subtotal: sub, totalDiscount: discSum, taxableSubtotal: taxable, cgstTotal: cgstSum, sgstTotal: sgstSum, igstTotal: igstSum, tax: taxSum, total: grandTotal, items }
  }

  const totals = calculateTotals()

  // Form Handlers
  const handleAddItem = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: 'Custom Service', sacHsn: '998311', quantity: 1, unit: 'Month', unitPrice: 10000, discount: 0, gstRate: 18 },
      ],
    }))
  }

  const handleRemoveItem = (index) => {
    if (invoiceForm.items.length <= 1) return
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (index, field, value) => {
    setInvoiceForm((prev) => {
      const updated = [...prev.items]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, items: updated }
    })
  }

  const handleSelectServicePreset = (index, presetName) => {
    const found = DIGITAL_MARKETING_SERVICES.find((s) => s.name === presetName)
    if (!found) return
    setInvoiceForm((prev) => {
      const updated = [...prev.items]
      updated[index] = {
        ...updated[index],
        name: found.name,
        sacHsn: found.sacHsn,
        unitPrice: found.defaultPrice,
        unit: found.unit,
        gstRate: found.gstRate,
      }
      return { ...prev, items: updated }
    })
  }

  const handleClientSelect = (clientId) => {
    const client = clients.find((c) => c._id === clientId)
    setInvoiceForm((prev) => ({
      ...prev,
      clientId,
      // Auto-set place of supply if client is outside Tamil Nadu
      placeOfSupply: client?.address?.state && client.address.state.toLowerCase() !== 'tamil nadu' ? 'Inter-State' : 'Intra-State',
    }))
  }

  const handleSubmitInvoice = async (asStatus = 'Draft') => {
    setErrorMsg('')
    setSuccessMsg('')

    if (!invoiceForm.clientId) {
      setErrorMsg('Please select a client.')
      return
    }

    if (invoiceForm.items.length === 0) {
      setErrorMsg('At least one service line item is required.')
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
      const payload = {
        ...invoiceForm,
        status: asStatus,
      }

      const res = await fetch(`${API_BASE_URL}/billing/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg(`Invoice ${data.data.invoice.invoiceNumber} created successfully!`)
        setShowCreateInvoiceModal(false)
        fetchInitialData()
      } else {
        setErrorMsg(data.message || 'Failed to create invoice')
      }
    } catch (err) {
      setErrorMsg('Network error while saving invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleIssueInvoice = async (invId) => {
    try {
      const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
      const res = await fetch(`${API_BASE_URL}/billing/invoices/${invId}/issue`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      })
      if (res.ok) {
        fetchInitialData()
        if (showViewInvoiceModal?._id === invId) setShowViewInvoiceModal(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleVoidInvoice = async (invId) => {
    if (!window.confirm('Are you sure you want to void this invoice?')) return
    try {
      const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
      const res = await fetch(`${API_BASE_URL}/billing/invoices/${invId}/void`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      })
      if (res.ok) {
        fetchInitialData()
        if (showViewInvoiceModal?._id === invId) setShowViewInvoiceModal(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!showPaymentModal) return
    setErrorMsg('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
      const res = await fetch(`${API_BASE_URL}/billing/invoices/${showPaymentModal._id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(paymentForm),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setShowPaymentModal(null)
        setPaymentForm({ amount: '', method: 'Bank Transfer', referenceNumber: '', notes: '' })
        fetchInitialData()
      } else {
        setErrorMsg(data.message || 'Failed to record payment')
      }
    } catch (err) {
      setErrorMsg('Network error recording payment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateRetainer = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
      const payload = {
        ...retainerForm,
        services: retainerForm.services.split(',').map((s) => s.trim()),
      }
      const res = await fetch(`${API_BASE_URL}/billing/retainers/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setShowCreateRetainerModal(false)
        fetchInitialData()
      } else {
        setErrorMsg(data.message || 'Failed to create retainer')
      }
    } catch (err) {
      setErrorMsg('Error creating retainer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
      const payload = {
        legalName: settingsForm.legalName,
        gstin: settingsForm.gstin,
        billingAddress: settingsForm.billingAddress,
        state: settingsForm.state,
        stateCode: settingsForm.stateCode,
        phone: settingsForm.phone,
        email: settingsForm.email,
        bankDetails: {
          bankName: settingsForm.bankName,
          accountNumber: settingsForm.accountNumber,
          ifscCode: settingsForm.ifscCode,
          branch: settingsForm.branch,
        },
        invoicePrefix: settingsForm.invoicePrefix,
      }
      const res = await fetch(`${API_BASE_URL}/billing/settings/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg('Organization billing settings updated!')
      } else {
        setErrorMsg(data.message || 'Failed to update settings')
      }
    } catch (err) {
      setErrorMsg('Error saving settings')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadPDF = (invoiceId, invoiceNumber) => {
    const token = localStorage.getItem('scalevo_token') || sessionStorage.getItem('scalevo_token')
    window.open(`${API_BASE_URL}/billing/invoices/${invoiceId}/pdf?token=${token || ''}`, '_blank')
  }

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>⚠ {errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-[16px] text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/40">
              Krishpo Agency Financial Core
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Billing, GST Invoices & Retainers</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Generate compliant GST tax invoices, manage retainer MRR subscriptions, record client collections, and issue downloadable PDF statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCreateInvoiceModal(true)}
            variant="primary"
            className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-md font-semibold px-4 py-2.5 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Collected"
          value={formatINR(summary?.totalCollected || 0)}
          change="Real-time Paid"
          positive={true}
          icon={CheckCircle2}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <KpiCard
          label="Outstanding Balance"
          value={formatINR(summary?.totalOutstanding || 0)}
          change={`${summary?.overdueCount || 0} Overdue`}
          positive={false}
          icon={Clock}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
        />
        <KpiCard
          label="Retainer Monthly Value (MRR)"
          value={formatINR(summary?.retainerMRR || 0)}
          change={`${summary?.activeRetainersCount || 0} Active Contracts`}
          positive={true}
          icon={IndianRupee}
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
        />
        <KpiCard
          label="Total Issued Invoices"
          value={summary?.totalInvoices || invoices.length || 0}
          change={`${summary?.draftCount || 0} Drafts`}
          positive={true}
          icon={Receipt}
          iconBg="#F8FAFC"
          iconColor="#64748B"
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'invoices' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" /> Invoices & Billing
        </button>
        <button
          onClick={() => setActiveTab('retainers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'retainers' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" /> Client Retainers
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" /> Organization Settings
        </button>
      </div>

      {/* TAB 1: INVOICES LIST */}
      {activeTab === 'invoices' && (
        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
          {/* Controls Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoice #, client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white w-48 sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Issued">Issued</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Void">Void</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-slate-500">{invoices.length} invoices found</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Invoice #</th>
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Date / Terms</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No invoices found. Click <strong>Create Invoice</strong> above to issue your first invoice!
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-5 font-mono font-bold text-indigo-600">
                        {inv.invoiceNumber}
                        <div className="text-[10px] text-slate-400 font-normal">{inv.invoiceType || 'Tax Invoice'}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {inv.clientSnapshot?.companyName || inv.clientId?.companyName || 'Client'}
                        {inv.clientSnapshot?.gstin && <div className="text-[10px] font-mono text-slate-400 font-normal">GST: {inv.clientSnapshot.gstin}</div>}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <div>{formatDate(inv.invoiceDate || inv.createdAt)}</div>
                        <div className="text-[10px] text-slate-400">Due: {formatDate(inv.dueDate)}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">{formatINR(inv.total)}</td>
                      <td className="py-4 px-4 font-bold text-rose-600">{formatINR(inv.balanceDue)}</td>
                      <td className="py-4 px-4">
                        <Badge
                          variant={
                            inv.status === 'Paid'
                              ? 'success'
                              : inv.status === 'Overdue'
                              ? 'danger'
                              : inv.status === 'Partially Paid'
                              ? 'warning'
                              : inv.status === 'Issued'
                              ? 'info'
                              : 'secondary'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setShowViewInvoiceModal(inv)}
                            title="View Details"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {inv.balanceDue > 0 && inv.status !== 'Void' && (
                            <button
                              onClick={() => {
                                setShowPaymentModal(inv)
                                setPaymentForm({ amount: inv.balanceDue, method: 'Bank Transfer', referenceNumber: '', notes: '' })
                              }}
                              title="Record Payment"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDownloadPDF(inv._id, inv.invoiceNumber)}
                            title="Download PDF Statement"
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-medium flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {inv.status === 'Draft' && (
                            <button
                              onClick={() => handleIssueInvoice(inv._id)}
                              title="Issue Invoice"
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: RETAINERS LIST */}
      {activeTab === 'retainers' && (
        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Client Retainer Agreements</h3>
            <Button onClick={() => setShowCreateRetainerModal(true)} variant="primary" className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              <Plus className="w-3.5 h-3.5" /> New Retainer
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Agreement Title</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Monthly MRR</th>
                  <th className="py-3.5 px-4">Frequency</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Services Included</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {retainers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No retainer agreements created yet.
                    </td>
                  </tr>
                ) : (
                  retainers.map((ret) => (
                    <tr key={ret._id} className="hover:bg-slate-50/80">
                      <td className="py-4 px-5 font-bold text-slate-900">{ret.agreementTitle}</td>
                      <td className="py-4 px-4 font-semibold text-indigo-600">{ret.clientId?.companyName || 'Client'}</td>
                      <td className="py-4 px-4 font-bold text-emerald-600">{formatINR(ret.monthlyAmount)}</td>
                      <td className="py-4 px-4 text-slate-500">{ret.billingFrequency}</td>
                      <td className="py-4 px-4">
                        <Badge variant={ret.status === 'Active' ? 'success' : 'secondary'}>{ret.status}</Badge>
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {ret.services && ret.services.length > 0 ? ret.services.join(', ') : 'Digital Marketing Services'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: ORGANIZATION BILLING SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="p-6 max-w-3xl mx-auto shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">Organization Legal & Billing Configuration</h3>
            <p className="text-xs text-slate-500">Configure legal business name, GSTIN, and bank instructions for PDF invoices.</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Business Name</label>
                <input
                  type="text"
                  value={settingsForm.legalName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, legalName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Krishpo Digital Marketing Agency Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization GSTIN</label>
                <input
                  type="text"
                  value={settingsForm.gstin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="33AABCK1234F1Z5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Billing Address</label>
              <textarea
                value={settingsForm.billingAddress}
                onChange={(e) => setSettingsForm({ ...settingsForm, billingAddress: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                rows={2}
                placeholder="100 Tech Park Boulevard, Suite 500, Chennai, Tamil Nadu"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  value={settingsForm.state}
                  onChange={(e) => setSettingsForm({ ...settingsForm, state: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
                <input
                  type="text"
                  value={settingsForm.stateCode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, stateCode: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={settingsForm.invoicePrefix}
                  onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 font-bold text-xs text-slate-900">Bank Details for Payment Instructions</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={settingsForm.bankName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="HDFC Bank Ltd"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={settingsForm.accountNumber}
                  onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="50200012345678"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={settingsForm.ifscCode}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ifscCode: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="HDFC0001234"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                <input
                  type="text"
                  value={settingsForm.branch}
                  onChange={(e) => setSettingsForm({ ...settingsForm, branch: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Main City Branch"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={submitting} variant="primary" className="bg-indigo-600 text-white rounded-xl text-xs font-bold px-5 py-2.5">
                {submitting ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* MODAL 1: CREATE INVOICE */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto my-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Invoice</h2>
                <p className="text-xs text-slate-500">Fill in client details, GST parameters, and digital marketing service line items.</p>
              </div>
              <button onClick={() => setShowCreateInvoiceModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client & Invoice Meta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Select Client *</label>
                <select
                  value={invoiceForm.clientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.contactName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Invoice Number (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated (e.g. KRP-2026-1001)"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Payment Terms & Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Place of Supply</label>
                <select
                  value={invoiceForm.placeOfSupply}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, placeOfSupply: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="Intra-State">Intra-State (CGST + SGST)</option>
                  <option value="Inter-State">Inter-State (IGST)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">GST Applicable</label>
                <select
                  value={invoiceForm.isGSTApplicable ? 'true' : 'false'}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, isGSTApplicable: e.target.value === 'true' })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="true">Yes (18% / Configured GST)</option>
                  <option value="false">No (Exempt / Zero Tax)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Invoice Type</label>
                <select
                  value={invoiceForm.invoiceType}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="Tax Invoice">Tax Invoice</option>
                  <option value="Proforma Invoice">Proforma Invoice</option>
                  <option value="Credit Note">Credit Note</option>
                </select>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Line Items & Services</h3>
                <Button onClick={handleAddItem} variant="outline" className="text-xs py-1 px-3 border-slate-300 text-indigo-600">
                  + Add Item
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {invoiceForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div className="col-span-4">
                      <select
                        onChange={(e) => handleSelectServicePreset(index, e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 mb-1 font-semibold text-slate-800 bg-white"
                      >
                        <option value="">-- Preset Service --</option>
                        {DIGITAL_MARKETING_SERVICES.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} (₹{s.defaultPrice})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Service Name / Description"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 block">SAC / HSN</label>
                      <input
                        type="text"
                        value={item.sacHsn}
                        onChange={(e) => handleItemChange(index, 'sacHsn', e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-mono text-center"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 block">Qty x Unit Price</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-12 p-1.5 rounded-lg border border-slate-300 bg-white text-center font-bold"
                        />
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                        />
                      </div>
                    </div>

                    <div className="col-span-1">
                      <label className="text-[10px] text-slate-500 block">GST %</label>
                      <select
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-bold text-center"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div className="col-span-2 text-right">
                      <label className="text-[10px] text-slate-500 block">Total</label>
                      <div className="font-bold text-indigo-700 py-1.5">₹{item.lineTotal || 0}</div>
                    </div>

                    <div className="col-span-1 text-center">
                      <button onClick={() => handleRemoveItem(index)} className="p-1 text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-4 shadow-inner">
              <div>
                <div className="text-slate-400">Taxable Subtotal: <strong className="text-white">₹{totals.taxableSubtotal}</strong></div>
                {invoiceForm.placeOfSupply === 'Inter-State' ? (
                  <div className="text-slate-400">IGST (18%): <strong className="text-indigo-300">₹{totals.igstTotal}</strong></div>
                ) : (
                  <div className="text-slate-400">
                    CGST (9%): <strong className="text-indigo-300">₹{totals.cgstTotal}</strong> | SGST (9%): <strong className="text-indigo-300">₹{totals.sgstTotal}</strong>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs uppercase text-slate-400 font-bold tracking-wider">Grand Total</div>
                <div className="text-2xl font-extrabold text-emerald-400">₹{totals.total.toLocaleString('en-IN')}</div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <Button onClick={() => setShowCreateInvoiceModal(false)} variant="outline" className="text-xs rounded-xl border-slate-300">
                Cancel
              </Button>
              <Button onClick={() => handleSubmitInvoice('Draft')} disabled={submitting} variant="outline" className="text-xs rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50 font-bold">
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmitInvoice('Issued')} disabled={submitting} variant="primary" className="text-xs rounded-xl bg-indigo-600 text-white font-bold px-5">
                {submitting ? 'Issuing...' : 'Create & Issue Invoice'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW INVOICE DETAIL */}
      {showViewInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invoice #{showViewInvoiceModal.invoiceNumber}</h3>
                <span className="text-xs text-slate-500">{showViewInvoiceModal.invoiceType}</span>
              </div>
              <button onClick={() => setShowViewInvoiceModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
              <div>
                <div className="font-bold text-slate-900">{showViewInvoiceModal.clientSnapshot?.companyName || 'Client'}</div>
                <div className="text-slate-500">{showViewInvoiceModal.clientSnapshot?.billingAddress}</div>
                {showViewInvoiceModal.clientSnapshot?.gstin && <div className="font-mono text-indigo-600 mt-1">GSTIN: {showViewInvoiceModal.clientSnapshot.gstin}</div>}
              </div>

              <div className="text-right">
                <div className="text-slate-500">Invoice Date: {formatDate(showViewInvoiceModal.invoiceDate)}</div>
                <div className="text-slate-500">Due Date: {formatDate(showViewInvoiceModal.dueDate)}</div>
                <div className="font-bold text-emerald-600 text-sm mt-1">Total: {formatINR(showViewInvoiceModal.total)}</div>
                <div className="font-bold text-rose-600">Balance Due: {formatINR(showViewInvoiceModal.balanceDue)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-800 uppercase">Items Breakdown</div>
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-bold">
                  <tr>
                    <th className="p-2">Description</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Rate</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(showViewInvoiceModal.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{it.name || it.description}</td>
                      <td className="p-2">{it.quantity}</td>
                      <td className="p-2">₹{it.unitPrice}</td>
                      <td className="p-2 text-right font-bold">₹{it.lineTotal || it.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <Button onClick={() => handleDownloadPDF(showViewInvoiceModal._id, showViewInvoiceModal.invoiceNumber)} variant="outline" className="gap-1.5 text-xs text-indigo-600 border-indigo-200">
                  <Download className="w-3.5 h-3.5" /> PDF
                </Button>
                {showViewInvoiceModal.status === 'Draft' && (
                  <Button onClick={() => handleIssueInvoice(showViewInvoiceModal._id)} variant="outline" className="gap-1.5 text-xs text-amber-700 bg-amber-50 border-amber-200">
                    <Send className="w-3.5 h-3.5" /> Issue
                  </Button>
                )}
              </div>
              <Button onClick={() => setShowViewInvoiceModal(null)} variant="primary" className="text-xs bg-slate-900 text-white rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD PAYMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Payment for #{showPaymentModal.invoiceNumber}</h3>
              <button onClick={() => setShowPaymentModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (Max ₹{showPaymentModal.balanceDue}) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={showPaymentModal.balanceDue}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold text-sm text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reference / Transaction Number</label>
                <input
                  type="text"
                  placeholder="e.g. TXN99881122"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button onClick={() => setShowPaymentModal(null)} type="button" variant="outline" className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} variant="primary" className="bg-emerald-600 text-white rounded-xl text-xs font-bold px-4">
                  {submitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE RETAINER */}
      {showCreateRetainerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">New Client Retainer Agreement</h3>
              <button onClick={() => setShowCreateRetainerModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRetainer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
                <select
                  value={retainerForm.clientId}
                  onChange={(e) => setRetainerForm({ ...retainerForm, clientId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agreement Title *</label>
                <input
                  type="text"
                  placeholder="e.g. SEO & Meta Ads Monthly Growth Retainer"
                  value={retainerForm.agreementTitle}
                  onChange={(e) => setRetainerForm({ ...retainerForm, agreementTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Amount (₹) *</label>
                  <input
                    type="number"
                    value={retainerForm.monthlyAmount}
                    onChange={(e) => setRetainerForm({ ...retainerForm, monthlyAmount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Frequency</label>
                  <select
                    value={retainerForm.billingFrequency}
                    onChange={(e) => setRetainerForm({ ...retainerForm, billingFrequency: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Included Services (Comma separated)</label>
                <input
                  type="text"
                  value={retainerForm.services}
                  onChange={(e) => setRetainerForm({ ...retainerForm, services: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button onClick={() => setShowCreateRetainerModal(false)} type="button" variant="outline" className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} variant="primary" className="bg-indigo-600 text-white rounded-xl text-xs font-bold px-4">
                  {submitting ? 'Creating...' : 'Create Retainer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
