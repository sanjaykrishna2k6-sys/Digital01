import React, { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag,
  Store,
  RefreshCw,
  Unplug,
  ExternalLink,
  Package,
  ShoppingCart,
  Users,
  IndianRupee,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  Globe,
  Mail,
  Clock,
} from 'lucide-react'
import { Card, KpiCard } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Loading } from '../components/ui/Loading'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import * as shopifyService from '../services/shopifyService'
import { formatDate } from '../utils/formatters'

export function ShopifyPage() {
  const { user } = useAuth()

  // State
  const [statusLoading, setStatusLoading] = useState(true)
  const [storeStatus, setStoreStatus] = useState(null)
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [activeTab, setActiveTab] = useState('products')

  // Connection form state
  const [shopDomainInput, setShopDomainInput] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false)

  // Products state
  const [products, setProducts] = useState([])
  const [productsPagination, setProductsPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)

  // Orders state
  const [orders, setOrders] = useState([])
  const [ordersPagination, setOrdersPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFinancialFilter, setOrderFinancialFilter] = useState('all')
  const [orderFulfillmentFilter, setOrderFulfillmentFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Customers state
  const [customers, setCustomers] = useState([])
  const [customersPagination, setCustomersPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Permissions
  const canManage = user && ['super_admin', 'agency_admin'].includes(user.role)
  const canSync = user && ['super_admin', 'agency_admin', 'account_manager'].includes(user.role)

  // Fetch connection status
  const loadStatus = useCallback(async () => {
    try {
      setStatusLoading(true)
      setError(null)
      const data = await shopifyService.fetchShopifyStatus()
      setStoreStatus(data)
    } catch (err) {
      setError(err.message || 'Failed to load Shopify integration status.')
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // Check URL params for OAuth redirect feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('shopify') === 'connected') {
      setFeedback({ type: 'success', message: 'Shopify store connected and catalog sync initiated!' })
      window.history.replaceState({}, document.title, window.location.pathname)
      loadStatus()
    } else if (params.get('error')) {
      const errReason = params.get('error')
      setFeedback({
        type: 'error',
        message: `Shopify connection failed (${errReason.replace(/_/g, ' ')}). Please verify credentials and retry.`,
      })
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [loadStatus])

  // Fetch products
  const loadProducts = useCallback(
    async (page = 1) => {
      if (!storeStatus?.isConnected) return
      try {
        setProductsLoading(true)
        const data = await shopifyService.getProducts({
          page,
          limit: 10,
          search: productSearch,
          status: productStatusFilter,
        })
        setProducts(data.data?.products || [])
        setProductsPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
      } catch (err) {
        console.warn('Failed to load products:', err.message)
      } finally {
        setProductsLoading(false)
      }
    },
    [storeStatus?.isConnected, productSearch, productStatusFilter]
  )

  // Fetch orders
  const loadOrders = useCallback(
    async (page = 1) => {
      if (!storeStatus?.isConnected) return
      try {
        setOrdersLoading(true)
        const data = await shopifyService.getOrders({
          page,
          limit: 10,
          search: orderSearch,
          financialStatus: orderFinancialFilter,
          fulfillmentStatus: orderFulfillmentFilter,
        })
        setOrders(data.data?.orders || [])
        setOrdersPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
      } catch (err) {
        console.warn('Failed to load orders:', err.message)
      } finally {
        setOrdersLoading(false)
      }
    },
    [storeStatus?.isConnected, orderSearch, orderFinancialFilter, orderFulfillmentFilter]
  )

  // Fetch customers
  const loadCustomers = useCallback(
    async (page = 1) => {
      if (!storeStatus?.isConnected) return
      try {
        setCustomersLoading(true)
        const data = await shopifyService.getCustomers({
          page,
          limit: 10,
          search: customerSearch,
        })
        setCustomers(data.data?.customers || [])
        setCustomersPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 })
      } catch (err) {
        console.warn('Failed to load customers:', err.message)
      } finally {
        setCustomersLoading(false)
      }
    },
    [storeStatus?.isConnected, customerSearch]
  )

  // Load active tab data when store is connected
  useEffect(() => {
    if (storeStatus?.isConnected) {
      if (activeTab === 'products') loadProducts(1)
      if (activeTab === 'orders') loadOrders(1)
      if (activeTab === 'customers') loadCustomers(1)
    }
  }, [storeStatus?.isConnected, activeTab, loadProducts, loadOrders, loadCustomers])

  // Handle Connect
  const handleConnect = async (e) => {
    e.preventDefault()
    if (!shopDomainInput.trim()) return

    try {
      setConnecting(true)
      const authUrl = await shopifyService.connectShopify(shopDomainInput.trim())
      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to initiate Shopify connection.' })
    } finally {
      setConnecting(false)
    }
  }

  // Handle Sync
  const handleSync = async () => {
    try {
      setSyncing(true)
      await shopifyService.syncShopify()
      setFeedback({ type: 'success', message: 'Shopify sync completed successfully!' })
      await loadStatus()
      if (activeTab === 'products') loadProducts(productsPagination.page)
      if (activeTab === 'orders') loadOrders(ordersPagination.page)
      if (activeTab === 'customers') loadCustomers(customersPagination.page)
      setTimeout(() => setFeedback(null), 5000)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Synchronization failed.' })
    } finally {
      setSyncing(false)
    }
  }

  // Handle Disconnect
  const handleDisconnect = async () => {
    try {
      setDisconnecting(true)
      await shopifyService.disconnectShopify()
      setIsDisconnectModalOpen(false)
      setFeedback({ type: 'success', message: 'Shopify store disconnected. Stored credentials purged.' })
      await loadStatus()
      setTimeout(() => setFeedback(null), 5000)
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to disconnect store.' })
    } finally {
      setDisconnecting(false)
    }
  }

  // Format currency in Indian Rupees
  const formatCurrency = (val, currency = 'INR') => {
    if (typeof val !== 'number') return '—'
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(val)
    } catch {
      return `₹${val.toLocaleString('en-IN')}`
    }
  }

  if (statusLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <Loading size="lg" message="Loading Shopify integration details..." />
      </div>
    )
  }

  const isConnected = storeStatus?.isConnected
  const store = storeStatus?.store

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] bg-[#96BF48]/10 text-[#96BF48] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#111827] tracking-tight">Shopify Integration</h1>
              <p className="text-xs text-[#6B7280]">
                Connect your agency's Shopify storefront to synchronize live catalog products, orders, and customer data.
              </p>
            </div>
          </div>
        </div>

        {isConnected && canSync && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#4F46E5]' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-[10px] text-xs font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
              : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Connection Card */}
      {!isConnected ? (
        <Card className="border-2 border-dashed border-[#E5E7EB] bg-[#FAFAFA]">
          <div className="max-w-xl mx-auto py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#96BF48]/10 text-[#96BF48] flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#111827]">Connect Shopify Store</h2>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
                Seamlessly authorize your agency workspace with Shopify OAuth 2.0 to access product catalogs, order
                fulfillments, and customer revenue intelligence with automated background sync.
              </p>
            </div>

            {canManage ? (
              <form onSubmit={handleConnect} className="max-w-md mx-auto pt-2 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="your-store.myshopify.com"
                      value={shopDomainInput}
                      onChange={(e) => setShopDomainInput(e.target.value)}
                      className="w-full text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2.5 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={connecting} className="gap-2 shrink-0">
                    {connecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-[#9CA3AF]">
                  Enter your store prefix or full myshopify domain (e.g., <em>brand-name</em> or <em>brand-name.myshopify.com</em>).
                </p>
              </form>
            ) : (
              <div className="p-3 bg-[#F3F4F6] rounded-[8px] text-xs text-[#6B7280]">
                Contact an Agency Administrator or Super Admin to authorize store connection.
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-[14px] p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-[12px] bg-[#96BF48]/10 text-[#96BF48] flex items-center justify-center font-bold text-xl shrink-0">
                <ShoppingBag className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-bold text-[#111827] tracking-tight">{store?.shopName}</h2>
                  <Badge variant={store?.status === 'connected' ? 'success' : 'warning'} dot>
                    {store?.status === 'connected' ? 'Connected Store' : store?.status?.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {store?.currency === 'USD' ? 'INR (₹)' : (store?.currency || 'INR (₹)')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6B7280]">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <a
                      href={`https://${store?.shopDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#4F46E5] hover:underline inline-flex items-center gap-1"
                    >
                      <span>{store?.shopDomain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {store?.shopEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>{store.shopEmail}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                    <span>Last synced: {store?.lastSyncedAt ? formatDate(store.lastSyncedAt) : 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start lg:self-auto">
              {canSync && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
                </Button>
              )}

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="gap-1.5 text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#FCA5A5]"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards when Connected */}
      {isConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Products"
            value={store?.syncStatus?.productsCount ?? productsPagination.total ?? 0}
            icon={Package}
            iconBg="#EEF2FF"
            iconColor="#4F46E5"
            timeframe="Synced Catalog"
          />
          <KpiCard
            label="Total Orders"
            value={store?.syncStatus?.ordersCount ?? ordersPagination.total ?? 0}
            icon={ShoppingCart}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            timeframe="Processed Transactions"
          />
          <KpiCard
            label="Total Customers"
            value={store?.syncStatus?.customersCount ?? customersPagination.total ?? 0}
            icon={Users}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            timeframe="Synced Accounts"
          />
          <KpiCard
            label="Currency & Region"
            value={`${store?.currency === 'USD' ? 'INR (₹)' : (store?.currency || 'INR (₹)')} • ${store?.country === 'US' ? 'IN' : (store?.country || 'IN')}`}
            icon={IndianRupee}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            timeframe="Store Configuration"
          />
        </div>
      )}

      {/* Connected Store Tabs */}
      {isConnected && (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-[#E5E7EB] flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'products', label: 'Products', icon: Package, count: store?.syncStatus?.productsCount },
              { id: 'orders', label: 'Orders', icon: ShoppingCart, count: store?.syncStatus?.ordersCount },
              { id: 'customers', label: 'Customers', icon: Users, count: store?.syncStatus?.customersCount },
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
                  {tab.count !== undefined && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563]">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* TAB 1: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search product title, handle, SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-[8px] border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                {productsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loading size="md" message="Loading products..." />
                  </div>
                ) : products.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No Products Found"
                    description={
                      productSearch
                        ? 'No products matched your search query.'
                        : 'Products will appear here after synchronization.'
                    }
                    actionLabel={canSync ? 'Sync Now' : undefined}
                    onAction={canSync ? handleSync : undefined}
                    className="my-8"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                        <tr>
                          <th className="px-5 py-3">Product</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Inventory</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Updated</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {products.map((p) => (
                          <tr key={p._id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-5 py-3 font-medium text-[#111827]">
                              <div>
                                <span className="font-bold text-[#111827]">{p.title}</span>
                                {p.vendor && <p className="text-[11px] text-[#9CA3AF]">{p.vendor}</p>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[#4B5563]">{p.sku || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-[#111827]">
                              {formatCurrency(p.price, p.currency || store?.currency)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-semibold ${
                                  p.totalInventory > 10
                                    ? 'text-[#16A34A]'
                                    : p.totalInventory > 0
                                    ? 'text-[#D97706]'
                                    : 'text-[#DC2626]'
                                }`}
                              >
                                {p.totalInventory} in stock
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  p.status === 'ACTIVE'
                                    ? 'success'
                                    : p.status === 'DRAFT'
                                    ? 'warning'
                                    : 'default'
                                }
                                dot
                              >
                                {p.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-[#6B7280]">
                              {p.updatedAtShopify ? formatDate(p.updatedAtShopify) : formatDate(p.updatedAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProduct(p)}
                                className="text-xs py-1 px-2.5"
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {productsPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#6B7280]">
                    <span>
                      Page {productsPagination.page} of {productsPagination.totalPages} ({productsPagination.total}{' '}
                      products)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productsPagination.page <= 1}
                        onClick={() => loadProducts(productsPagination.page - 1)}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={productsPagination.page >= productsPagination.totalPages}
                        onClick={() => loadProducts(productsPagination.page + 1)}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search order #, customer name, email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-[8px] border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={orderFinancialFilter}
                    onChange={(e) => setOrderFinancialFilter(e.target.value)}
                    className="text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="all">Payment Status: All</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="refunded">Refunded</option>
                  </select>

                  <select
                    value={orderFulfillmentFilter}
                    onChange={(e) => setOrderFulfillmentFilter(e.target.value)}
                    className="text-xs rounded-[8px] border border-[#D1D5DB] px-3 py-2 bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="all">Fulfillment: All</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="unfulfilled">Unfulfilled</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                {ordersLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loading size="md" message="Loading orders..." />
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="No Orders Found"
                    description={
                      orderSearch
                        ? 'No orders matched your search criteria.'
                        : 'Customer orders will appear here once processed by Shopify.'
                    }
                    actionLabel={canSync ? 'Sync Now' : undefined}
                    onAction={canSync ? handleSync : undefined}
                    className="my-8"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                        <tr>
                          <th className="px-5 py-3">Order</th>
                          <th className="px-4 py-3">Customer</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Total</th>
                          <th className="px-4 py-3">Payment</th>
                          <th className="px-4 py-3">Fulfillment</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {orders.map((o) => (
                          <tr key={o._id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-5 py-3 font-bold text-[#111827]">{o.orderNumber}</td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#111827]">{o.customerName || 'Guest'}</p>
                              {o.customerEmail && <p className="text-[11px] text-[#6B7280]">{o.customerEmail}</p>}
                            </td>
                            <td className="px-4 py-3 text-[#6B7280]">{formatDate(o.createdAtShopify || o.createdAt)}</td>
                            <td className="px-4 py-3 font-bold text-[#111827]">
                              {formatCurrency(o.totalPrice, o.currency || store?.currency)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={
                                  o.financialStatus === 'PAID'
                                    ? 'success'
                                    : o.financialStatus === 'PENDING'
                                    ? 'warning'
                                    : 'danger'
                                }
                                dot
                              >
                                {o.financialStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={o.fulfillmentStatus === 'FULFILLED' ? 'success' : 'default'}
                                dot
                              >
                                {o.fulfillmentStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(o)}
                                className="text-xs py-1 px-2.5"
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {ordersPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#6B7280]">
                    <span>
                      Page {ordersPagination.page} of {ordersPagination.totalPages} ({ordersPagination.total} orders)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPagination.page <= 1}
                        onClick={() => loadOrders(ordersPagination.page - 1)}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={ordersPagination.page >= ordersPagination.totalPages}
                        onClick={() => loadOrders(ordersPagination.page + 1)}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    placeholder="Search customer name, email, phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-[8px] border border-[#D1D5DB] bg-white text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                {customersLoading ? (
                  <div className="py-12 flex justify-center">
                    <Loading size="md" message="Loading customers..." />
                  </div>
                ) : customers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No Customers Found"
                    description={
                      customerSearch
                        ? 'No customers matched your search query.'
                        : 'Customers will appear here after synchronizing your store.'
                    }
                    actionLabel={canSync ? 'Sync Now' : undefined}
                    onAction={canSync ? handleSync : undefined}
                    className="my-8"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                        <tr>
                          <th className="px-5 py-3">Customer</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Orders</th>
                          <th className="px-4 py-3">Total Spent</th>
                          <th className="px-4 py-3">Customer Since</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {customers.map((c) => (
                          <tr key={c._id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="px-5 py-3 font-semibold text-[#111827]">
                              {c.firstName} {c.lastName}
                            </td>
                            <td className="px-4 py-3 text-[#4B5563]">{c.email || '—'}</td>
                            <td className="px-4 py-3 font-medium text-[#111827]">{c.ordersCount} orders</td>
                            <td className="px-4 py-3 font-bold text-[#16A34A]">
                              {formatCurrency(c.totalSpent, c.currency || store?.currency)}
                            </td>
                            <td className="px-4 py-3 text-[#6B7280]">
                              {c.createdAtShopify ? formatDate(c.createdAtShopify) : formatDate(c.createdAt)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedCustomer(c)}
                                className="text-xs py-1 px-2.5"
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {customersPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#6B7280]">
                    <span>
                      Page {customersPagination.page} of {customersPagination.totalPages} ({customersPagination.total}{' '}
                      customers)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={customersPagination.page <= 1}
                        onClick={() => loadCustomers(customersPagination.page - 1)}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={customersPagination.page >= customersPagination.totalPages}
                        onClick={() => loadCustomers(customersPagination.page + 1)}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DISCONNECT CONFIRMATION MODAL */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title="Disconnect Shopify Store"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDisconnectModalOpen(false)} disabled={disconnecting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting...' : 'Confirm Disconnect'}
            </Button>
          </>
        }
      >
        <p className="text-xs text-[#4B5563] leading-relaxed">
          Are you sure you want to disconnect{' '}
          <strong className="text-[#111827]">{store?.shopName || store?.shopDomain}</strong>? This will revoke
          active API synchronization and permanently wipe server-stored Shopify access credentials for this organization.
        </p>
      </Modal>

      {/* PRODUCT DETAILS MODAL */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.title || 'Product Details'}
        maxWidth="max-w-lg"
        footer={
          <Button variant="outline" onClick={() => setSelectedProduct(null)}>
            Close
          </Button>
        }
      >
        {selectedProduct && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9FAFB] rounded-[8px]">
              <div>
                <span className="text-[#9CA3AF] block font-medium">SKU</span>
                <span className="font-semibold text-[#111827]">{selectedProduct.sku || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Price</span>
                <span className="font-semibold text-[#111827]">
                  {formatCurrency(selectedProduct.price, selectedProduct.currency || store?.currency)}
                </span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Inventory</span>
                <span className="font-semibold text-[#111827]">{selectedProduct.totalInventory} units</span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Status</span>
                <Badge variant={selectedProduct.status === 'ACTIVE' ? 'success' : 'default'} dot>
                  {selectedProduct.status}
                </Badge>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Vendor</span>
                <span className="font-semibold text-[#111827]">{selectedProduct.vendor || '—'}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Product Type</span>
                <span className="font-semibold text-[#111827]">{selectedProduct.productType || 'Standard'}</span>
              </div>
            </div>

            <div>
              <span className="text-[#9CA3AF] block font-medium mb-1">Shopify GraphQL ID</span>
              <code className="p-2 bg-[#F3F4F6] rounded block text-[11px] font-mono break-all text-[#374151]">
                {selectedProduct.shopifyProductId}
              </code>
            </div>
          </div>
        )}
      </Modal>

      {/* ORDER DETAILS MODAL */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.orderNumber || ''}`}
        maxWidth="max-w-lg"
        footer={
          <Button variant="outline" onClick={() => setSelectedOrder(null)}>
            Close
          </Button>
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9FAFB] rounded-[8px]">
              <div>
                <span className="text-[#9CA3AF] block font-medium">Customer</span>
                <span className="font-semibold text-[#111827]">{selectedOrder.customerName || 'Guest'}</span>
                {selectedOrder.customerEmail && (
                  <p className="text-[11px] text-[#6B7280]">{selectedOrder.customerEmail}</p>
                )}
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Total Amount</span>
                <span className="font-bold text-sm text-[#111827]">
                  {formatCurrency(selectedOrder.totalPrice, selectedOrder.currency || store?.currency)}
                </span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Payment Status</span>
                <Badge variant={selectedOrder.financialStatus === 'PAID' ? 'success' : 'warning'} dot>
                  {selectedOrder.financialStatus}
                </Badge>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Fulfillment</span>
                <Badge variant={selectedOrder.fulfillmentStatus === 'FULFILLED' ? 'success' : 'default'} dot>
                  {selectedOrder.fulfillmentStatus}
                </Badge>
              </div>
            </div>

            {/* Line items */}
            {selectedOrder.lineItems && selectedOrder.lineItems.length > 0 && (
              <div>
                <span className="text-[#374151] font-bold block mb-2">Order Line Items</span>
                <div className="divide-y divide-[#F3F4F6] border border-[#E5E7EB] rounded-[8px] overflow-hidden">
                  {selectedOrder.lineItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#111827] block">{item.title}</span>
                        <span className="text-[#9CA3AF] text-[11px]">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-medium text-[#111827]">
                        {formatCurrency(item.price * item.quantity, selectedOrder.currency || store?.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CUSTOMER DETAILS MODAL */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={`${selectedCustomer?.firstName || ''} ${selectedCustomer?.lastName || ''}`}
        maxWidth="max-w-md"
        footer={
          <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
            Close
          </Button>
        }
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2 p-3 bg-[#F9FAFB] rounded-[8px]">
              <div>
                <span className="text-[#9CA3AF] block font-medium">Email Address</span>
                <span className="font-semibold text-[#111827]">{selectedCustomer.email || '—'}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Phone</span>
                <span className="font-semibold text-[#111827]">{selectedCustomer.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Total Orders</span>
                <span className="font-semibold text-[#111827]">{selectedCustomer.ordersCount}</span>
              </div>
              <div>
                <span className="text-[#9CA3AF] block font-medium">Lifetime Spend</span>
                <span className="font-bold text-sm text-[#16A34A]">
                  {formatCurrency(selectedCustomer.totalSpent, selectedCustomer.currency || store?.currency)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
