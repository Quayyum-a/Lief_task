'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Spin } from 'antd'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    // In a real app, this would handle the Auth0 callback
    // For demo, simulate successful login
    setTimeout(() => {
      // Set a demo auth token
      document.cookie = 'auth-token=demo-token; path=/'
      
      // Redirect based on email (demo logic)
      const isManager = new URLSearchParams(window.location.search).get('role') === 'manager'
      router.push(isManager ? '/manager' : '/worker')
    }, 1000)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4">
            <div className="text-lg font-medium">Signing you in...</div>
            <div className="text-gray-500">Please wait</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
