import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  IndianRupee,
  UserCheck,
  Edit2,
  Trash2,
  Clock,
  Layers,
} from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { formatINR } from '../utils/formatters'
import * as customerService from '../services/customerService'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await customerService.fetchCustomerById(id)
      setCustomer(data)
    } catch (err) {
      setError(err.message || 'Customer not found.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleDelete = async () => {
    try {
      await customerService.deleteCustomer(id)
      navigate('/customers')
    } catch (err) {
      alert(err.message)
    }
  }

  if (isLoading) return <div className="p-12"><Loading title="Loading customer profile..." /></div>
  if (error || !customer) {
    return (
      <div className="p-8">
        <ErrorState title="Customer Not Found" description={error} onRetry={load} />
        <div className="text-center mt-4">
          <Link to="/customers" className="text-xs text-[#4F46E5] font-semibold hover:underline">
            &larr; Back to Customers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-7 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#4F46E5] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <Button variant="danger" size="sm" leftIcon={Trash2} onClick={() => setIsDeleteOpen(true)}>
          Delete Customer
        </Button>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold text-lg">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827]">{customer.name}</h1>
                <Badge variant="success" withDot={true}>
                  <span className="capitalize">{customer.status}</span>
                </Badge>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">{customer.company || 'Private Client'}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-[#9CA3AF] uppercase font-semibold">Total Revenue</p>
            <p className="text-2xl font-bold text-[#111827]">{formatINR(customer.totalSpend || 0)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#F3F4F6]">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Email</p>
            <p className="text-xs font-mono text-[#374151] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>{customer.email}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Phone</p>
            <p className="text-xs text-[#374151] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>{customer.phone || 'Not provided'}</span>
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase">Acquisition Channel</p>
            <p className="text-xs font-semibold text-[#374151]">{customer.source}</p>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Customer"
        description="Permanently delete this customer record."
        maxWidth="max-w-sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#6B7280]">
          Delete customer <strong className="text-[#111827]">{customer.name}</strong>?
        </p>
      </Modal>
    </div>
  )
}
