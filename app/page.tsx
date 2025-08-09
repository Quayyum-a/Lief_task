'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card } from 'antd'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session?.user) {
      // Redirect authenticated users to their dashboard
      const isManager = session.user.role === 'manager'
      router.push(isManager ? '/manager' : '/worker')
    } else {
      // Redirect unauthenticated users to sign-in
      router.push('/auth/signin')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card loading className="w-full max-w-md" />
    </div>
  )
}
