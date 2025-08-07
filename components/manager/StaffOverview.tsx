'use client'

import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Row, 
  Col, 
  Statistic,
  Badge,
  Avatar,
  Typography
} from 'antd'
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  EnvironmentOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useShift } from '@/context/ShiftContext'
import { StaffMember } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

export default function StaffOverview() {
  const { allStaff, dashboardStats, refreshData, isLoading } = useShift()

  const columns: ColumnsType<StaffMember> = [
    {
      title: 'Staff Member',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: StaffMember) => (
        <Space>
          <Avatar 
            size="small" 
            src={record.picture} 
            icon={<UserOutlined />} 
          />
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record: StaffMember) => (
        <Space direction="vertical" size="small">
          <Badge 
            status={record.isOnline ? 'success' : 'default'} 
            text={record.isOnline ? 'Online' : 'Offline'} 
          />
          {record.currentShift ? (
            <Tag color="blue" icon={<ClockCircleOutlined />}>
              Clocked In
            </Tag>
          ) : (
            <Tag color="default">
              Clocked Out
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Current Shift',
      key: 'currentShift',
      render: (_, record: StaffMember) => {
        if (!record.currentShift) {
          return <span className="text-gray-400">Not clocked in</span>
        }
        
        const start = new Date(record.currentShift.clockIn.timestamp)
        const now = new Date()
        const diff = now.getTime() - start.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        return (
          <div>
            <div className="font-medium">{hours}h {minutes}m</div>
            <div className="text-xs text-gray-500">
              Started: {start.toLocaleTimeString()}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeen',
      key: 'lastSeen',
      render: (lastSeen: string) => {
        const date = new Date(lastSeen)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / (1000 * 60))
        
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        
        return date.toLocaleDateString()
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: StaffMember) => (
        <Space>
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            size="small"
            disabled
          >
            View Details
          </Button>
          <Button 
            type="text" 
            icon={<EnvironmentOutlined />} 
            size="small"
            disabled
          >
            Location
          </Button>
        </Space>
      ),
    },
  ]

  // Mock data for current shifts
  const mockCurrentShifts = allStaff.slice(0, 2).map((staff, index) => ({
    ...staff,
    currentShift: index === 0 ? {
      id: `shift_${Date.now()}`,
      userId: staff.id,
      clockIn: {
        id: `clock_in_${Date.now()}`,
        userId: staff.id,
        type: 'clock_in' as const,
        timestamp: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
        location: { latitude: 40.7128, longitude: -74.0060, timestamp: Date.now() }
      },
      status: 'active' as const
    } : undefined
  }))

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Staff"
              value={allStaff.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Currently Clocked In"
              value={mockCurrentShifts.filter(s => s.currentShift).length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Online Staff"
              value={allStaff.filter(s => s.isOnline).length}
              prefix={<Badge status="success" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Daily Check-ins"
              value={dashboardStats.dailyClockIns}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Staff Table */}
      <Card 
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="mb-0">Staff Overview</Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={refreshData}
              loading={isLoading}
            >
              Refresh
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={mockCurrentShifts}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  )
}
