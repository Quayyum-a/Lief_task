'use client'

import { useState } from 'react'
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Input, 
  Tag, 
  Alert, 
  Row, 
  Col,
  Spin,
  Avatar,
  Statistic
} from 'antd'
import { 
  ClockCircleOutlined, 
  EnvironmentOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useShift } from '@/context/ShiftContext'
import NotificationDisplay from '@/components/shared/NotificationDisplay'

const { Title, Text } = Typography
const { TextArea } = Input

export default function ClockInterface() {
  const { 
    currentUser,
    currentShift,
    geolocation,
    clockIn,
    clockOut,
    isClockingIn,
    isClockingOut
  } = useShift()

  const [note, setNote] = useState('')

  const handleClockIn = async () => {
    await clockIn(note.trim() || undefined)
    setNote('')
  }

  const handleClockOut = async () => {
    await clockOut(note.trim() || undefined)
    setNote('')
  }

  const getShiftDuration = () => {
    if (!currentShift?.clockIn) return '0h 0m'
    
    const start = new Date(currentShift.clockIn.timestamp)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m`
  }

  const isClocked = !!currentShift

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <Card className="text-center">
        <Space direction="vertical" size="middle" className="w-full">
          <Avatar 
            size={64} 
            src={currentUser?.picture} 
            icon={<UserOutlined />}
            className="mx-auto"
          />
          <div>
            <Title level={3} className="mb-0">{currentUser?.name}</Title>
            <Text type="secondary">{currentUser?.email}</Text>
          </div>
        </Space>
      </Card>

      {/* Location Status */}
      <Card title={<><EnvironmentOutlined /> Location Status</>}>
        {geolocation.isLoading ? (
          <div className="text-center py-4">
            <Spin /> <span className="ml-2">Getting your location...</span>
          </div>
        ) : geolocation.error ? (
          <Alert
            message="Location Error"
            description={geolocation.error}
            type="error"
            showIcon
          />
        ) : (
          <Space direction="vertical" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong>Current Status:</Text>
              <Tag 
                color={geolocation.isInPerimeter ? 'green' : 'red'} 
                icon={geolocation.isInPerimeter ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              >
                {geolocation.isInPerimeter ? 'Within Perimeter' : 'Outside Perimeter'}
              </Tag>
            </div>
            {geolocation.location && (
              <div className="text-sm text-gray-500">
                <div>Latitude: {geolocation.location.latitude.toFixed(6)}</div>
                <div>Longitude: {geolocation.location.longitude.toFixed(6)}</div>
                {geolocation.location.accuracy && (
                  <div>Accuracy: ±{geolocation.location.accuracy.toFixed(0)}m</div>
                )}
              </div>
            )}
            {geolocation.nearestPerimeter && (
              <Alert
                message={`You are within the ${geolocation.nearestPerimeter.name} perimeter`}
                type="success"
                showIcon
              />
            )}
          </Space>
        )}
      </Card>

      {/* Current Shift Status */}
      {isClocked && (
        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Current Shift"
                value={getShiftDuration()}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Clocked In At"
                value={new Date(currentShift?.clockIn.timestamp || '').toLocaleTimeString()}
              />
            </Col>
          </Row>
          {currentShift?.clockIn.note && (
            <div className="mt-4">
              <Text strong>Clock-in Note:</Text>
              <div className="bg-gray-50 p-2 rounded mt-1">
                {currentShift.clockIn.note}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Clock In/Out Interface */}
      <Card 
        title={
          <Space>
            <ClockCircleOutlined />
            {isClocked ? 'Clock Out' : 'Clock In'}
          </Space>
        }
      >
        <Space direction="vertical" size="large" className="w-full">
          {!geolocation.isInPerimeter && !isClocked && (
            <Alert
              message="Cannot Clock In"
              description="You must be within the designated perimeter to clock in."
              type="warning"
              showIcon
            />
          )}

          <div>
            <Text strong className="block mb-2">
              {isClocked ? 'Clock-out note (optional):' : 'Clock-in note (optional):'}
            </Text>
            <TextArea
              rows={3}
              placeholder={`Add a note about your ${isClocked ? 'clock-out' : 'clock-in'}...`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="text-center">
            {isClocked ? (
              <Button
                type="primary"
                danger
                size="large"
                icon={<ClockCircleOutlined />}
                loading={isClockingOut}
                onClick={handleClockOut}
                className="h-16 px-8 text-lg"
              >
                Clock Out
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<ClockCircleOutlined />}
                loading={isClockingIn}
                onClick={handleClockIn}
                disabled={!geolocation.isInPerimeter || geolocation.isLoading}
                className="h-16 px-8 text-lg"
              >
                Clock In
              </Button>
            )}
          </div>

          {isClocked && (
            <Alert
              message="You are currently clocked in"
              description="Make sure to clock out when your shift ends."
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>

      {/* Notifications */}
      <NotificationDisplay maxItems={3} compact />

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Button block size="large" disabled>
              View Shift History
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <Button block size="large" disabled>
              Report Issue
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}
