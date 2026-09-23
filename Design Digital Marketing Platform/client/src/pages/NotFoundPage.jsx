import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9FAFB]">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for doesn't exist or has been moved."
        actionLabel="Back to Dashboard"
        onAction={() => navigate('/dashboard')}
      />
    </div>
  )
}
