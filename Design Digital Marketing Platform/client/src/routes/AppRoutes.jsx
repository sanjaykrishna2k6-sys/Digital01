import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { ClientPortalPage } from '../pages/ClientPortalPage'
import { DesignSystemPage } from '../pages/DesignSystemPage'
import { PublicWebsitePage } from '../pages/PublicWebsitePage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Agency Platform Layout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
