'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Avatar,
  Tooltip,
  Select,
  Input,
  Alert,
  Modal
} from 'antd'
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  EnvironmentOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useShift } from '@/context/ShiftContext'
import { clockManager } from '@/lib/clock'
import { perimeterManager } from '@/lib/perimeter'

const { Title, Text } = Typography
const { Search } = Input

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  isOnline: boolean
  lastSeen: string
  currentShift?: { id: string; userId: string; clockIn: { timestamp: string; note?: string } }
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
    timestamp: number
  }
  totalHoursThisWeek?: number
  shiftsThisWeek?: number
}

export default function StaffOverview() {
  const { allStaff, refreshData, currentUser } = useShift()
  const [staffData, setStaffData] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'clocked-in' | 'clocked-out'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Mock real-time staff data with shifts
  useEffect(() => {
    const generateMockStaffData = (): StaffMember[] => {
      const activeShifts = clockManager.getAllActiveShifts()
      
      return allStaff.map(staff => {
        const activeShift = activeShifts.find(shift => shift.userId === staff.id)
        const mockLocation = {
          latitude: 40.7831 + (Math.random() - 0.5) * 0.01, // Near Times Square
          longitude: -73.9712 + (Math.random() - 0.5) * 0.01,
          accuracy: Math.random() * 50 + 5,
          timestamp: Date.now()
        }

        return {
          ...staff,
          currentShift: activeShift,
          location: staff.isOnline ? mockLocation : undefined,
          totalHoursThisWeek: Math.random() * 40 + 10,
          shiftsThisWeek: Math.floor(Math.random() * 7) + 1
        }
      })
    }

    setStaffData(generateMockStaffData())

    // Update every 30 seconds for real-time effect
    const interval = setInterval(() => {
      setStaffData(generateMockStaffData())
    }, 30000)

    return () => clearInterval(interval)
  }, [allStaff])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await refreshData()
    } finally {
      setLoading(false)
    }
  }

  const handleForceClockOut = async (staffId: string, staffName: string) => {
    Modal.confirm({
      title: 'Force Clock Out',
      content: `Are you sure you want to force clock out ${staffName}? This should only be done if the worker forgot to clock out.`,
      okText: 'Force Clock Out',
      okType: 'danger',
      onOk: async () => {
        try {
          await clockManager.forceClockOut(staffId, currentUser?.id || '', 'Manager forced clock out')
          handleRefresh()
        } catch (error) {
          console.error('Failed to force clock out:', error)
        }
      }
    })
  }

  const getStatusTag = (staff: StaffMember) => {
    if (staff.currentShift) {
      return <Tag color="green" icon={<ClockCircleOutlined />}>Clocked In</Tag>
    }
    if (staff.isOnline) {
      return <Tag color="blue" icon={<CheckCircleOutlined />}>Online</Tag>
    }
    return <Tag color="default">Offline</Tag>
  }

  const getLocationStatus = (staff: StaffMember) => {
    if (!staff.location) return <Tag color="default">No Location</Tag>
    
    // Check if in perimeter
    const result = perimeterManager.checkLocation(staff.location)
    
    return (
      <Tooltip title={`${staff.location.latitude.toFixed(6)}, ${staff.location.longitude.toFixed(6)}`}>
        <Tag 
          color={result.isWithin ? 'green' : 'orange'}
          icon={<EnvironmentOutlined />}
        >
          {result.isWithin ? 'In Area' : `${(result.distance/1000).toFixed(1)}km away`}
        </Tag>
      </Tooltip>
    )
  }

  const getCurrentShiftDuration = (staff: StaffMember) => {
    if (!staff.currentShift) return 'N/A'
    
    const duration = clockManager.getCurrentShiftDuration(staff.id)
    if (!duration) return 'N/A'
    
    return `${duration.hours}h ${duration.minutes}m`
  }

  const filteredStaff = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'online' && staff.isOnline) ||
                         (filterStatus === 'clocked-in' && staff.currentShift) ||
                         (filterStatus === 'clocked-out' && !staff.currentShift && staff.isOnline)
    
    return matchesSearch && matchesFilter
  })

  const columns = [
    {
      title: 'Staff Member',
      key: 'staff',
      render: (record: StaffMember) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className="text-xs">{record.email}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: StaffMember) => (
        <Space direction="vertical" size="small">
          {getStatusTag(record)}
          {getLocationStatus(record)}
        </Space>
      )
    },
    {
      title: 'Current Shift',
      key: 'shift',
      render: (record: StaffMember) => (
        <div>
          {record.currentShift ? (
            <div>
              <Text strong>{getCurrentShiftDuration(record)}</Text>
              <br />
              <Text type="secondary" className="text-xs">
                Started: {new Date(record.currentShift.clockIn.timestamp).toLocaleTimeString()}
              </Text>
            </div>
          ) : (
            <Text type="secondary">Not clocked in</Text>
          )}
        </div>
      )
    },
    {
      title: 'This Week',
      key: 'week',
      render: (record: StaffMember) => (
        <div>
          <Text strong>{record.totalHoursThisWeek?.toFixed(1)}h</Text>
          <br />
          <Text type="secondary" className="text-xs">
            {record.shiftsThisWeek} shifts
          </Text>
        </div>
      )
    },
    {
      title: 'Last Seen',
      key: 'lastSeen',
      render: (record: StaffMember) => (
        <Text type="secondary" className="text-xs">
          {new Date(record.lastSeen).toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: StaffMember) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => setSelectedStaff(record)}
          >
            View
          </Button>
          {record.currentShift && (
            <Button 
              size="small" 
              danger
              icon={<StopOutlined />}
              onClick={() => handleForceClockOut(record.id, record.name)}
            >
              Force Clock Out
            </Button>
          )}
        </Space>
      )
    }
  ]

  const stats = {
    totalStaff: staffData.length,
    onlineStaff: staffData.filter(s => s.isOnline).length,
    clockedInStaff: staffData.filter(s => s.currentShift).length,
    averageHours: staffData.reduce((acc, s) => acc + (s.totalHoursThisWeek || 0), 0) / staffData.length
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Staff Overview</Title>
        <Button 
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Staff"
              value={stats.totalStaff}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Online Now"
              value={stats.onlineStaff}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Clocked In"
              value={stats.clockedInStaff}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Hours/Week"
              value={stats.averageHours}
              precision={1}
              suffix="h"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search staff by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={6}>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              className="w-full"
              suffixIcon={<FilterOutlined />}
            >
              <Select.Option value="all">All Staff</Select.Option>
              <Select.Option value="online">Online Only</Select.Option>
              <Select.Option value="clocked-in">Clocked In</Select.Option>
              <Select.Option value="clocked-out">Available</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={10}>
            <Text type="secondary">
              Showing {filteredStaff.length} of {staffData.length} staff members
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Staff Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredStaff}
          rowKey="id"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} staff members`
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Staff Detail Modal */}
      <Modal
        title={selectedStaff ? `${selectedStaff.name} - Staff Details` : 'Staff Details'}
        open={!!selectedStaff}
        onCancel={() => setSelectedStaff(null)}
        footer={null}
        width={600}
      >
        {selectedStaff && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Basic Info">
                  <Space direction="vertical" className="w-full">
                    <div>
                      <Text strong>Name: </Text>
                      <Text>{selectedStaff.name}</Text>
                    </div>
                    <div>
                      <Text strong>Email: </Text>
                      <Text>{selectedStaff.email}</Text>
                    </div>
                    <div>
                      <Text strong>Role: </Text>
                      <Text className="capitalize">{selectedStaff.role}</Text>
                    </div>
                    <div>
                      <Text strong>Status: </Text>
                      {getStatusTag(selectedStaff)}
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Location">
                  {selectedStaff.location ? (
                    <Space direction="vertical" className="w-full">
                      <div>
                        <Text strong>Coordinates: </Text>
                        <Text code>
                          {selectedStaff.location.latitude.toFixed(6)}, {selectedStaff.location.longitude.toFixed(6)}
                        </Text>
                      </div>
                      <div>
                        <Text strong>Accuracy: </Text>
                        <Text>±{selectedStaff.location.accuracy?.toFixed(0)}m</Text>
                      </div>
                      <div>
                        <Text strong>Status: </Text>
                        {getLocationStatus(selectedStaff)}
                      </div>
                    </Space>
                  ) : (
                    <Text type="secondary">Location not available</Text>
                  )}
                </Card>
              </Col>
            </Row>

            {selectedStaff.currentShift && (
              <Card size="small" title="Current Shift" className="mt-4">
                <Space direction="vertical" className="w-full">
                  <div>
                    <Text strong>Duration: </Text>
                    <Text>{getCurrentShiftDuration(selectedStaff)}</Text>
                  </div>
                  <div>
                    <Text strong>Started: </Text>
                    <Text>{new Date(selectedStaff.currentShift.clockIn.timestamp).toLocaleString()}</Text>
                  </div>
                  {selectedStaff.currentShift.clockIn.note && (
                    <div>
                      <Text strong>Clock-in Note: </Text>
                      <Text>{selectedStaff.currentShift.clockIn.note}</Text>
                    </div>
                  )}
                </Space>
              </Card>
            )}

            <Card size="small" title="Weekly Summary" className="mt-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Total Hours"
                    value={selectedStaff.totalHoursThisWeek}
                    precision={1}
                    suffix="hours"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Shifts Worked"
                    value={selectedStaff.shiftsThisWeek}
                    suffix="shifts"
                  />
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}
