'use client'

import { Card, Button, Space, Typography, Divider, Alert } from 'antd'
import { GoogleOutlined, UserOutlined, MailOutlined, WarningOutlined } from '@ant-design/icons'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const { Title, Text } = Typography

export default function LoginForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authError, setAuthError] = useState(false)

  useEffect(() => {
    if (session?.user && status === 'authenticated') {
      // Redirect based on user role
      const isManager = session.user.role === 'manager'
      router.push(isManager ? '/manager' : '/worker')
    }
  }, [session, status, router])

  useEffect(() => {
    // Check for auth configuration issues
    if (status === 'unauthenticated') {
      // Try to detect if NextAuth is properly configured
      fetch('/api/auth/providers')
        .then(res => res.json())
        .then(providers => {
          if (!providers || Object.keys(providers).length === 0) {
            setAuthError(true)
          }
        })
        .catch(() => {
          setAuthError(true)
        })
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card loading className="w-full max-w-md" />
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <Title level={4}>Redirecting...</Title>
            <Text type="secondary">Setting up your dashboard</Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserOutlined className="text-2xl text-blue-600" />
            </div>
          </div>
          <Title level={2} className="mb-2">HealthShift</Title>
          <Text type="secondary" className="text-base">
            Healthcare Worker Management System
          </Text>
        </div>

        {authError && (
          <Alert
            message="Authentication Setup Needed"
            description="Google OAuth is not configured. Set up your credentials to enable real authentication."
            type="warning"
            icon={<WarningOutlined />}
            className="mb-6"
            showIcon
          />
        )}

        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Link href="/auth/signin">
              <Button
                type="primary"
                icon={<GoogleOutlined />}
                size="large"
                block
                className="h-12 flex items-center justify-center"
              >
                Sign in with Google
              </Button>
            </Link>
          </div>

          <Divider>or</Divider>

          <div>
            <Link href="/auth/signin">
              <Button
                icon={<MailOutlined />}
                size="large"
                block
                className="h-12 flex items-center justify-center"
              >
                Sign in with Email
              </Button>
            </Link>
          </div>

          {authError && (
            <>
              <Divider>Demo Access</Divider>
              <div>
                <Link href="/worker">
                  <Button
                    size="large"
                    block
                    className="h-12 mb-2"
                  >
                    Demo Worker Access
                  </Button>
                </Link>
                <Link href="/manager">
                  <Button
                    size="large"
                    block
                    className="h-12"
                  >
                    Demo Manager Access
                  </Button>
                </Link>
              </div>
            </>
          )}

          <div className="text-center mt-6">
            <Text type="secondary" className="text-sm">
              {authError ? (
                <>
                  To enable real authentication:
                  <br />
                  1. Set up Google OAuth in Google Console
                  <br />
                  2. Add credentials to .env.local
                  <br />
                  3. Restart the development server
                </>
              ) : (
                <>
                  Sign in to access your healthcare shift management dashboard.
                  <br />
                  <br />
                  <strong>Role Assignment:</strong>
                  <br />
                  • Emails containing &quot;manager&quot; → Manager access
                  <br />
                  • All other emails → Worker access
                  <br />
                  <br />
                  New to HealthShift?{' '}
                  <Link href="/auth/signup" className="text-blue-600 hover:underline">
                    Create account
                  </Link>
                </>
              )}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
