import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShoppingBag,
  Globe,
  Share2,
  Mail,
  BarChart,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Power,
  RotateCcw,
} from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../context/AuthContext'
import * as shopifyService from '../services/shopifyService'

export function IntegrationsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedIntegration, setSelectedIntegration] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  // Shopify state
  const [shopifyState, setShopifyState] = useState({
    isConnected: false,
    store: null,
    isLoading: true,
  })
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [shopDomainInput, setShopDomainInput] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const canManage = user?.role === 'super_admin' || user?.role === 'agency_admin'

  const loadShopifyStatus = async () => {
    try {
      const data = await shopifyService.fetchShopifyStatus()
      setShopifyState({
        isConnected: data?.isConnected || false,
        store: data?.store || null,
        isLoading: false,
      })
    } catch (err) {
      console.error('[Shopify] Status error:', err)
      setShopifyState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  useEffect(() => {
    loadShopifyStatus()

    // Handle incoming redirect query flags from OAuth callback
    const shopifyParam = searchParams.get('shopify')
    const errorParam = searchParams.get('error')

    if (shopifyParam === 'connected') {
      setInfoMessage('Shopify store connected successfully! Catalog and order synchronization has initiated.')
      searchParams.delete('shopify')
      setSearchParams(searchParams, { replace: true })
    }

    if (errorParam) {
      setErrorMessage(`Shopify connection error: ${errorParam.replace(/_/g, ' ')}. Please try again.`)
      searchParams.delete('error')
      setSearchParams(searchParams, { replace: true })
    }
  }, [])

  const handleOpenConnect = () => {
    setShopDomainInput('')
    setErrorMessage(null)
    setIsConnectModalOpen(true)
  }

  const handleConnectSubmit = async (e) => {
    e.preventDefault()
    if (!shopDomainInput.trim()) return

    setIsConnecting(true)
    setErrorMessage(null)
    try {
      const authUrl = await shopifyService.connectShopify(shopDomainInput.trim())
      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initiate Shopify connection.')
      setIsConnecting(false)
    }
  }

  const handleSyncNow = async () => {
    setIsSyncing(true)
    setErrorMessage(null)
    try {
      const result = await shopifyService.syncShopify()
      await loadShopifyStatus()
      setInfoMessage(
        `Synchronization complete: ${result.productsCount || 0} products, ${result.ordersCount || 0} orders, ${result.customersCount || 0} customers.`
      )
    } catch (err) {
      setErrorMessage(err.message || 'Synchronization failed.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnectConfirm = async () => {
    setIsDisconnecting(true)
    try {
      await shopifyService.disconnectShopify()
      await loadShopifyStatus()
      setIsDisconnectModalOpen(false)
      setInfoMessage('Shopify store disconnected. Stored API credentials have been purged.')
    } catch (err) {
      setErrorMessage(err.message || 'Failed to disconnect store.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const otherIntegrations = [
    {
      id: 'google_ads',
      name: 'Google Ads',
      category: 'Paid Search & Video',
      icon: Globe,
      iconColor: '#4285F4',
      iconBg: '#EEF3FD',
      description:
        'Connect your Google Ads account to sync search campaigns, keywords, impressions, and ad spend.',
      status: 'available',
      statusLabel: 'Available',
      features: [
        'Keyword-level performance tracking',
        'Search & YouTube ad spend sync',
        'Target CPA and ROAS monitoring',
      ],
    },
    {
      id: 'meta_ads',
      name: 'Meta Ads',
      category: 'Paid Social',
      icon: Share2,
      iconColor: '#0081FB',
      iconBg: '#EBF4FE',
      description:
        'Import Facebook & Instagram campaign ad sets, impressions, clicks, and conversion data.',
      status: 'available',
      statusLabel: 'Available',
      features: [
        'Dynamic ad set tracking',
        'Instagram & Facebook placement metrics',
        'Demographics & audience reach insights',
      ],
    },
    {
      id: 'email_marketing',
      name: 'Email Marketing',
      category: 'Lifecycle & CRM',
      icon: Mail,
      iconColor: '#7C3AED',
      iconBg: '#F5F3FF',
      description:
        'Sync newsletters and automated flows from Klaviyo, Mailchimp, or Sendgrid.',
      status: 'available',
      statusLabel: 'Available',
      features: [
        'Subscriber open & click-through tracking',
        'Automated drip sequence attribution',
        'Customer list synchronization',
      ],
    },
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      category: 'Web Analytics',
      icon: BarChart,
      iconColor: '#E37400',
      iconBg: '#FEF6EC',
      description:
        'Stream web events, session durations, conversion funnels, and landing page metrics.',
      status: 'available',
      statusLabel: 'Available',
      features: [
        'Multi-channel attribution modeling',
        'Landing page bounce rates',
        'Real-time visitor counts',
      ],
    },
  ]

  const store = shopifyState.store

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Connect your marketing channels, e-commerce stores, and ad networks to centralize reporting.
          </p>
        </div>
        <Button variant="secondary" onClick={loadShopifyStatus} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </Button>
      </div>

      {/* Success Alert */}
      {infoMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
          <button onClick={() => setInfoMessage(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Grid of Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* SHOPIFY INTEGRATION CARD */}
        <Card className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200">
          <div>
            {/* Top header */}
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-[#F3F9EA] border border-[#95BF47]/30 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[#95BF47]" />
              </div>
              {shopifyState.isLoading ? (
                <Badge variant="neutral">Checking...</Badge>
              ) : shopifyState.isConnected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="neutral">Not Connected</Badge>
              )}
            </div>

            {/* Content */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">E-Commerce</span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Shopify</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Connect your Shopify store to sync products, orders, customers and sales data.
              </p>
            </div>

            {/* Store Information when Connected */}
            {shopifyState.isConnected && store ? (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Store Domain:</span>
                  <span className="font-semibold text-slate-800 font-mono text-[11px]">{store.shopDomain}</span>
                </div>
                {store.shopName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Store Name:</span>
                    <span className="font-medium text-slate-800">{store.shopName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last Synced:</span>
                  <span className="text-slate-700">
                    {store.lastSyncedAt ? new Date(store.lastSyncedAt).toLocaleTimeString() : 'Pending sync'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-1 text-center">
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-900 text-xs">{store.syncStatus?.productsCount || 0}</div>
                    <div className="text-[10px] text-slate-400">Products</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-900 text-xs">{store.syncStatus?.ordersCount || 0}</div>
                    <div className="text-[10px] text-slate-400">Orders</div>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                    <div className="font-bold text-slate-900 text-xs">{store.syncStatus?.customersCount || 0}</div>
                    <div className="text-[10px] text-slate-400">Customers</div>
                  </div>
                </div>
              </div>
            ) : (
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Automated order & revenue sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Customer purchase history attribution</span>
                </li>
              </ul>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            {shopifyState.isConnected ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex-1 text-xs gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                {canManage && (
                  <Button
                    variant="danger"
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="text-xs p-2"
                    title="Disconnect Store"
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={handleOpenConnect}
                disabled={!canManage}
                className="w-full text-xs font-semibold gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Connect Shopify
              </Button>
            )}
          </div>
        </Card>

        {/* OTHER MARKETING CHANNELS */}
        {otherIntegrations.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.id} className="p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border"
                    style={{ backgroundColor: item.iconBg, borderColor: `${item.iconColor}33` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: item.iconColor }} />
                  </div>
                  <Badge variant="neutral">{item.statusLabel}</Badge>
                </div>

                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.description}</p>
                </div>

                <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                  {item.features.slice(0, 2).map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedIntegration(item)}
                  className="w-full text-xs font-medium"
                >
                  Configure
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* CONNECT SHOPIFY MODAL */}
      <Modal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} title="Connect Shopify Store">
        <form onSubmit={handleConnectSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Enter your Shopify store domain to authorize the Krishpo Digital Marketing Platform. You will be redirected
            to your Shopify Admin to approve read access for catalog, orders, and sales data.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shopify Store Domain <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="your-brand.myshopify.com"
                value={shopDomainInput}
                onChange={(e) => setShopDomainInput(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Example: acme-fashion.myshopify.com or acme-fashion</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700 block">Requested Permissions (Read-Only):</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Products & Inventory (read_products)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Orders & Revenue Tracking (read_orders)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer Counts & Retention (read_customers)</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" type="button" onClick={() => setIsConnectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isConnecting} className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              {isConnecting ? 'Redirecting to Shopify...' : 'Authorize on Shopify'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DISCONNECT CONFIRMATION MODAL */}
      <Modal isOpen={isDisconnectModalOpen} onClose={() => setIsDisconnectModalOpen(false)} title="Disconnect Shopify">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to disconnect <strong className="text-slate-900">{store?.shopDomain}</strong>?
          </p>
          <p className="text-xs text-slate-500">
            Stored access tokens will be immediately purged. Historical synchronized analytics will be preserved for
            reporting.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsDisconnectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDisconnectConfirm} disabled={isDisconnecting}>
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect Store'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* OTHER INTEGRATION MODAL */}
      <Modal
        isOpen={!!selectedIntegration}
        onClose={() => setSelectedIntegration(null)}
        title={`Configure ${selectedIntegration?.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{selectedIntegration?.description}</p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Included Capabilities:</span>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {selectedIntegration?.features?.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setSelectedIntegration(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
