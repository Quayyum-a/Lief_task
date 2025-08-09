'use client'

import { useSession } from 'next-auth/react'
import { Card, Spin } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'manager' | 'worker'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (requiredRole && session.user.role !== requiredRole) {
      // Redirect to appropriate dashboard
      router.push(session.user.role === 'manager' ? '/manager' : '/worker')
      return
    }
  }, [session, status, requiredRole, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">
              <div className="text-lg font-medium">Loading...</div>
              <div className="text-gray-500">Setting up your workspace</div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return null // Will redirect to appropriate dashboard
  }

  return <>{children}</>
}
