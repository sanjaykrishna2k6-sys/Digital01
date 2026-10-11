import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-[#F9FAFB] font-sans text-[#111827]">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
