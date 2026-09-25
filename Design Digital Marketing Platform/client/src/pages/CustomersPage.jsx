import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Building,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  UserCheck,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { formatINR } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import * as customerService from '../services/customerService'

const statusVariant = {
  active: 'success',
  new: 'info',
  inactive: 'neutral',
  converted: 'primary',
}

export function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'Website',
    status: 'active',
    totalSpend: 0,
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canManage = user?.role === 'super_admin' || user?.role === 'agency_admin'

  const loadCustomers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await customerService.fetchCustomers()
      setCustomers(data)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load customers.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        !searchTerm.trim() ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase().trim()))

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [customers, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const total = customers.length
    const active = customers.filter((c) => c.status === 'active').length
    const converted = customers.filter((c) => c.status === 'converted').length
    const totalSpend = customers.reduce((acc, c) => acc + (c.totalSpend || 0), 0)
    return { total, active, converted, totalSpend }
  }, [customers])

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      source: 'Website',
      status: 'active',
      totalSpend: '',
    })
    setFormErrors({})
    setIsAddOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Customer name must be at least 2 characters.'
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email.'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const created = await customerService.createCustomer({
        ...formData,
        totalSpend: Number(formData.totalSpend || 0),
      })
      setCustomers([created, ...customers])
      setIsAddOpen(false)
      setFeedback({ type: 'success', text: `Customer "${created.name}" added.` })
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, general: err.message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (cust) => {
    setSelectedCustomer(cust)
    setFormData({
      name: cust.name,
      email: cust.email,
      phone: cust.phone || '',
      company: cust.company || '',
      source: cust.source || 'Website',
      status: cust.status,
      totalSpend: cust.totalSpend || 0,
    })
    setFormErrors({})
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const updated = await customerService.updateCustomer(selectedCustomer._id, {
        ...formData,
        totalSpend: Number(formData.totalSpend || 0),
      })
      setCustomers(customers.map((c) => (c._id === updated._id ? updated : c)))
      setIsEditOpen(false)
      setFeedback({ type: 'success', text: `Customer "${updated.name}" updated.` })
    } catch (err) {
      setFormErrors((prev) => ({ ...prev, general: err.message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDelete = (cust) => {
    setSelectedCustomer(cust)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return
    setIsSubmitting(true)
    try {
      await customerService.deleteCustomer(selectedCustomer._id)
      setCustomers(customers.filter((c) => c._id !== selectedCustomer._id))
      setIsDeleteOpen(false)
      setFeedback({ type: 'success', text: 'Customer removed.' })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete.' })
      setIsDeleteOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (ds) => {
    if (!ds) return '—'
    return new Date(ds).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-7 max-w-7xl mx-auto space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-[10px] border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#16A34A]'
              : 'bg-[#FEF2F2] border-[#FEE2E2] text-[#DC2626]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Maintain accounts, business profiles, and customer lifetime value.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" leftIcon={RefreshCw} onClick={loadCustomers}>
            Refresh
          </Button>

          {canManage && (
            <Button variant="primary" size="sm" leftIcon={Plus} onClick={handleOpenAdd}>
              Add Customer
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total Customers</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Active Retainers</p>
            <p className="text-2xl font-bold text-[#16A34A] mt-1">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Converted Clients</p>
            <p className="text-2xl font-bold text-[#4F46E5] mt-1">{stats.converted}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Customer Spend</p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{formatINR(stats.totalSpend)}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by name, email, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isSearch={true}
            containerClassName="mb-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#6B7280]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-white border border-[#E5E7EB] rounded-[8px] px-3 py-2 text-[#374151] font-medium outline-none focus:border-[#4F46E5] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="new">New</option>
            <option value="converted">Converted</option>
            <option value="inactive">Inactive</option>
          </select>

          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-12">
          <Loading title="Loading Customers..." description="Fetching customer records" />
        </div>
      ) : error ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <ErrorState title="Failed to load customers" description={error} onRetry={loadCustomers} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8">
          <EmptyState
            icon={Users}
            title={searchTerm || statusFilter !== 'all' ? 'No matching customers' : 'No customers in workspace'}
            description="Add your client contacts and track their agency engagements."
            actionLabel={canManage ? 'Add Customer' : undefined}
            onAction={canManage ? handleOpenAdd : undefined}
          />
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name & Company</th>
                  <th>Contact Info</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Total Spend</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cust) => (
                  <tr key={cust._id}>
                    <td>
                      <div>
                        <Link
                          to={`/customers/${cust._id}`}
                          className="font-semibold text-[#111827] hover:text-[#4F46E5] transition-colors"
                        >
                          {cust.name}
                        </Link>
                        {cust.company && (
                          <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-[#9CA3AF]" />
                            <span>{cust.company}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="space-y-0.5">
                        <p className="text-xs text-[#374151] flex items-center gap-1.5 font-mono">
                          <Mail className="w-3 h-3 text-[#9CA3AF]" />
                          <span>{cust.email}</span>
                        </p>
                        {cust.phone && (
                          <p className="text-xs text-[#6B7280] flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#9CA3AF]" />
                            <span>{cust.phone}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    <td>
                      <Badge variant="neutral">{cust.source}</Badge>
                    </td>

                    <td>
                      <Badge variant={statusVariant[cust.status] || 'neutral'} withDot={true}>
                        <span className="capitalize">{cust.status}</span>
                      </Badge>
                    </td>

                    <td className="font-mono text-xs font-semibold text-[#111827]">
                      {formatINR(cust.totalSpend || 0)}
                    </td>

                    <td className="text-xs text-[#6B7280] whitespace-nowrap">
                      {formatDate(cust.createdAt)}
                    </td>

                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/customers/${cust._id}`}
                          className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-[6px] transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1.5 text-[#6B7280] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-[6px] transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(cust)}
                            className="p-1.5 text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[6px] transition-colors"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => !isSubmitting && setIsAddOpen(false)}
        title="Add New Customer"
        description="Register an agency client contact."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleAddSubmit}>
              Save Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Vikramaditya Sharma"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. vikram@technova.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Company"
              placeholder="e.g. TechNova Pvt Ltd"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">Acquisition Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
              >
                <option value="Website">Website Form</option>
                <option value="Referral">Referral</option>
                <option value="Google Ads">Google Ads</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
              >
                <option value="active">Active</option>
                <option value="new">New</option>
                <option value="converted">Converted</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !isSubmitting && setIsEditOpen(false)}
        title="Edit Customer"
        description="Update contact information."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleEditSubmit}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full text-sm text-[#111827] bg-white border-[1.5px] border-[#E5E7EB] rounded-[8px] p-2 outline-none focus:border-[#4F46E5]"
              >
                <option value="active">Active</option>
                <option value="new">New</option>
                <option value="converted">Converted</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <Input
              label="Total Spend (INR)"
              type="number"
              value={formData.totalSpend}
              onChange={(e) => setFormData({ ...formData, totalSpend: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !isSubmitting && setIsDeleteOpen(false)}
        title="Delete Customer"
        description="Permanently remove customer from workspace."
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={isSubmitting} onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#6B7280]">
          Delete customer <strong className="text-[#111827]">{selectedCustomer?.name}</strong>?
        </p>
      </Modal>
    </div>
  )
}
