'use client'

import { useUser } from '@auth0/nextjs-auth0'
import { Card, Spin } from 'antd'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'manager' | 'worker'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }

    if (user && requiredRole) {
      const userRole = user.email?.includes('manager') ? 'manager' : 'worker'
      if (userRole !== requiredRole) {
        // Redirect to appropriate dashboard
        router.push(userRole === 'manager' ? '/manager' : '/worker')
        return
      }
    }
  }, [user, isLoading, requiredRole, router])

  if (isLoading) {
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

  if (!user) {
    return null // Will redirect to login
  }

  if (requiredRole) {
    const userRole = user.email?.includes('manager') ? 'manager' : 'worker'
    if (userRole !== requiredRole) {
      return null // Will redirect to appropriate dashboard
    }
  }

  return <>{children}</>
}
