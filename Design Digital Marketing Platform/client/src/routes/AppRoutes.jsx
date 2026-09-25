import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientPortalPage } from '../pages/ClientPortalPage'
import { DesignSystemPage } from '../pages/DesignSystemPage'
import { PublicWebsitePage } from '../pages/PublicWebsitePage'
import { NotFoundPage } from '../pages/NotFoundPage'

import { UsersPage } from '../pages/UsersPage'
import { CampaignsPage } from '../pages/CampaignsPage'
import { CampaignDetailPage } from '../pages/CampaignDetailPage'
import { CustomersPage } from '../pages/CustomersPage'
import { CustomerDetailPage } from '../pages/CustomerDetailPage'
import { LeadsPage } from '../pages/LeadsPage'
import { AnalyticsPage } from '../pages/AnalyticsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { IntegrationsPage } from '../pages/IntegrationsPage'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Main Agency Platform Layout (Protected by HTTP-only cookie session) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Full Figma Pages */}
      <Route path="/portal" element={<ClientPortalPage />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="/website" element={<PublicWebsitePage />} />

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
