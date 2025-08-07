'use client'

import { Card, Button, Space, Typography, Divider } from 'antd'
import { GoogleOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'
import { useUser } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const { Title, Text } = Typography

export default function LoginForm() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      // Redirect based on user role
      const isManager = user.email?.includes('manager')
      router.push(isManager ? '/manager' : '/worker')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card loading className="w-full max-w-md" />
      </div>
    )
  }

  if (user) {
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

        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Button
              type="primary"
              icon={<GoogleOutlined />}
              size="large"
              block
              href="/auth/callback?role=worker"
              className="h-12 flex items-center justify-center"
            >
              Demo Worker Login
            </Button>
          </div>

          <Divider>or</Divider>

          <div>
            <Button
              icon={<LockOutlined />}
              size="large"
              block
              href="/auth/callback?role=manager"
              className="h-12 flex items-center justify-center"
            >
              Demo Manager Login
            </Button>
          </div>

          <div className="text-center mt-6">
            <Text type="secondary" className="text-sm">
              For demo purposes:
              <br />
              • Use any email with &quot;manager&quot; to access manager features
              <br />
              • Use any other email for worker features
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
