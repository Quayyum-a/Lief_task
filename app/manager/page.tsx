'use client'

import { useState } from 'react'
import { Layout, Menu, Button, Space, Drawer } from 'antd'
import {
  TeamOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons'
import { useSession, signOut } from 'next-auth/react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import StaffOverview from '@/components/manager/StaffOverview'
import AnalyticsDashboard from '@/components/manager/AnalyticsDashboard'
import PerimeterManagement from '@/components/manager/PerimeterManagement'

const { Header, Sider, Content } = Layout

type TabKey = 'overview' | 'analytics' | 'perimeters'

const menuItems = [
  {
    key: 'overview',
    icon: <TeamOutlined />,
    label: 'Staff Overview',
  },
  {
    key: 'analytics',
    icon: <BarChartOutlined />,
    label: 'Analytics',
  },
  {
    key: 'perimeters',
    icon: <EnvironmentOutlined />,
    label: 'Perimeters',
  },
]

export default function ManagerDashboard() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <StaffOverview />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'perimeters':
        return <PerimeterManagement />
      default:
        return <StaffOverview />
    }
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Staff Overview'
      case 'analytics':
        return 'Analytics Dashboard'
      case 'perimeters':
        return 'Location Management'
      default:
        return 'Dashboard'
    }
  }

  return (
    <ProtectedRoute requiredRole="manager">
      <Layout className="min-h-screen">
        {/* Desktop Sidebar */}
        <Sider
          width={200}
          className="hidden md:block bg-white border-r border-gray-200"
          breakpoint="md"
          collapsedWidth={0}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-bold text-gray-900">HealthShift</div>
            <div className="text-sm text-gray-500">Manager Portal</div>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => setActiveTab(key as TabKey)}
            className="border-0"
          />
        </Sider>

        {/* Mobile Drawer */}
        <Drawer
          title="Navigation"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          className="md:hidden"
          width={250}
        >
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => {
              setActiveTab(key as TabKey)
              setMobileMenuOpen(false)
            }}
            className="border-0"
          />
        </Drawer>

        <Layout>
          {/* Header */}
          <Header className="bg-white border-b border-gray-200 flex items-center justify-between px-4">
            <div className="flex items-center">
              <Button
                type="text"
                icon={<MenuOutlined />}
                className="md:hidden mr-4"
                onClick={() => setMobileMenuOpen(true)}
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 mb-0">
                  {getPageTitle()}
                </h1>
                <div className="text-sm text-gray-500 md:hidden">
                  Welcome, {session?.user?.name?.split(' ')[0]}
                </div>
              </div>
            </div>

            <Space>
              <span className="hidden md:inline text-gray-600">
                Welcome, {session?.user?.name}
              </span>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-900"
              >
                <span className="hidden sm:inline ml-1">Logout</span>
              </Button>
            </Space>
          </Header>

          {/* Main Content */}
          <Content className="bg-gray-50 p-4 md:p-6">
            {renderContent()}
          </Content>
        </Layout>

        {/* Mobile Bottom Navigation */}
        <div className="mobile-nav md:hidden">
          <div className="grid grid-cols-3 text-center">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as TabKey)}
                className={`py-3 ${
                  activeTab === item.key ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <div className="text-lg">{item.icon}</div>
                <div className="text-xs font-medium">{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
