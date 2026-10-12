import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loading } from '../components/ui/Loading'

import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { PublicOnlyRoute } from '../components/layout/PublicOnlyRoute'
import { RoleProtectedRoute } from '../components/layout/RoleProtectedRoute'

// Auth Pages
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { AuthCallbackPage } from '../pages/AuthCallbackPage'

// Agency App Pages
import { DashboardPage } from '../pages/DashboardPage'
import { ClientsPage } from '../pages/ClientsPage'
import { ClientDetailsPage } from '../pages/ClientDetailsPage'
import { LeadsPage } from '../pages/LeadsPage'
import { ServicesPage } from '../pages/ServicesPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { ProjectDetailsPage } from '../pages/ProjectDetailsPage'
import { TasksPage } from '../pages/TasksPage'
import { TaskDetailsPage } from '../pages/TaskDetailsPage'
import { ContentPage } from '../pages/ContentPage'
import { ApprovalsPage } from '../pages/ApprovalsPage'
import { CampaignsPage } from '../pages/CampaignsPage'
import { CampaignDetailsPage } from '../pages/CampaignDetailsPage'
import { SEOPage } from '../pages/SEOPage'
import { ShopifyPage } from '../pages/ShopifyPage'
import { AnalyticsPage } from '../pages/AnalyticsPage'
import { ReportsPage } from '../pages/ReportsPage'
import { BillingPage } from '../pages/BillingPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { UsersPage } from '../pages/UsersPage'
import { SettingsPage } from '../pages/SettingsPage'
import { IntegrationsPage } from '../pages/IntegrationsPage'
import { CustomersPage } from '../pages/CustomersPage'
import { CustomerDetailPage } from '../pages/CustomerDetailPage'

// Client Portal & Public Pages
import { ClientPortalPage } from '../pages/ClientPortalPage'
import { DesignSystemPage } from '../pages/DesignSystemPage'
import { PublicWebsitePage } from '../pages/PublicWebsitePage'
import { NotFoundPage } from '../pages/NotFoundPage'

/**
 * RootRedirect handles intelligent entry point redirection based on session state & user role.
 */
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loading size="lg" title="Verifying Krishpo session..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role === 'client') {
    return <Navigate to="/portal" replace />
  }

  return <Navigate to="/dashboard" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Root Intelligent Redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Only Authentication Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Route>

      {/* Agency Administration Workspace (Protected & Disallow Client Role) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleProtectedRoute disallowedRoles={['client']} />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientDetailsPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TaskDetailsPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailsPage />} />
            <Route path="/seo" element={<SEOPage />} />
            <Route path="/shopify" element={<ShopifyPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
          </Route>
        </Route>

        {/* Client Portal (Protected for client & agency users) */}
        <Route path="/portal" element={<ClientPortalPage />} />
        <Route path="/client-portal" element={<ClientPortalPage />} />
      </Route>

      {/* Public / Demo Reference Pages */}
      <Route path="/website" element={<PublicWebsitePage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
