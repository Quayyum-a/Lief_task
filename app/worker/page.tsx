'use client'

import { Layout, Button, Space } from 'antd'
import { LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ClockInterface from '@/components/worker/ClockInterface'

const { Header, Content } = Layout

export default function WorkerDashboard() {
  const { user } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <ProtectedRoute requiredRole="worker">
      <Layout className="min-h-screen">
        <Header className="bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button
              type="text"
              icon={<MenuOutlined />}
              className="md:hidden mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
            <div className="text-xl font-bold text-gray-900">
              HealthShift
            </div>
          </div>
          
          <Space>
            <span className="hidden sm:inline text-gray-600">
              Welcome, {user?.name?.split(' ')[0]}
            </span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => {
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
                window.location.href = '/'
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <span className="hidden sm:inline ml-1">Logout</span>
            </Button>
          </Space>
        </Header>

        <Content className="bg-gray-50">
          <ClockInterface />
        </Content>

        {/* Mobile Bottom Navigation */}
        <div className="mobile-nav md:hidden">
          <div className="grid grid-cols-3 text-center">
            <button className="py-3 text-blue-600">
              <div className="text-lg">🕐</div>
              <div className="text-xs font-medium">Clock</div>
            </button>
            <button className="py-3 text-gray-600" disabled>
              <div className="text-lg">📊</div>
              <div className="text-xs">History</div>
            </button>
            <button className="py-3 text-gray-600" disabled>
              <div className="text-lg">⚙️</div>
              <div className="text-xs">Settings</div>
            </button>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
