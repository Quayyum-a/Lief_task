'use client'

import { useState } from 'react'
import { Card, List, Badge, Button, Typography, Space, Alert, Switch } from 'antd'
import { 
  BellOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClearOutlined
} from '@ant-design/icons'
import { useNotifications, LocationNotification, notificationService } from '@/lib/notifications'

const { Text, Title } = Typography

interface NotificationDisplayProps {
  maxItems?: number
  showSettings?: boolean
  compact?: boolean
}

export default function NotificationDisplay({ 
  maxItems = 5, 
  showSettings = false,
  compact = false 
}: NotificationDisplayProps) {
  const { 
    notifications, 
    isInitialized, 
    isSupported, 
    permissionStatus,
    clearNotifications 
  } = useNotifications()

  const [showAll, setShowAll] = useState(false)
  const [settings, setSettings] = useState(notificationService.getOptions())

  const displayNotifications = showAll ? notifications : notifications.slice(0, maxItems)

  const getNotificationIcon = (type: LocationNotification['type']) => {
    switch (type) {
      case 'perimeter_entry':
        return <CheckCircleOutlined className="text-green-500" />
      case 'perimeter_exit':
        return <ExclamationCircleOutlined className="text-orange-500" />
      case 'shift_reminder':
        return <ClockCircleOutlined className="text-blue-500" />
      case 'accuracy_warning':
        return <WarningOutlined className="text-yellow-500" />
      default:
        return <BellOutlined className="text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    notificationService.updateOptions(newSettings)
  }

  if (!isSupported) {
    return (
      <Alert
        message="Notifications Not Supported"
        description="Your browser doesn't support notifications."
        type="warning"
        showIcon
      />
    )
  }

  if (!isInitialized && permissionStatus !== 'granted') {
    return (
      <Alert
        message="Enable Notifications"
        description="Allow notifications to receive important location-based alerts and reminders."
        type="info"
        showIcon
        action={
          <Button 
            size="small" 
            type="primary"
            onClick={() => notificationService.initialize()}
          >
            Enable
          </Button>
        }
      />
    )
  }

  return (
    <Card 
      title={
        <Space>
          <BellOutlined />
          {compact ? 'Alerts' : 'Location Notifications'}
          {notifications.length > 0 && (
            <Badge count={notifications.length} size="small" />
          )}
        </Space>
      }
      size={compact ? 'small' : 'default'}
      extra={
        notifications.length > 0 && (
          <Button 
            type="text" 
            size="small" 
            icon={<ClearOutlined />}
            onClick={clearNotifications}
          >
            Clear
          </Button>
        )
      }
    >
      {notifications.length === 0 ? (
        <div className="text-center py-4">
          <BellOutlined className="text-4xl text-gray-300 mb-2" />
          <Text type="secondary">No notifications yet</Text>
        </div>
      ) : (
        <Space direction="vertical" className="w-full">
          <List
            size="small"
            dataSource={displayNotifications}
            renderItem={(notification) => (
              <List.Item className="hover:bg-gray-50 rounded px-2 -mx-2">
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <div className="flex justify-between items-start">
                      <Text strong className="text-sm">
                        {notification.title}
                      </Text>
                      <Text type="secondary" className="text-xs">
                        {formatTimestamp(notification.timestamp)}
                      </Text>
                    </div>
                  }
                  description={
                    <div>
                      <Text className="text-sm">{notification.message}</Text>
                      {notification.location && (
                        <div className="text-xs text-gray-400 mt-1">
                          <EnvironmentOutlined className="mr-1" />
                          {notification.location.latitude.toFixed(4)}, {notification.location.longitude.toFixed(4)}
                          {notification.location.accuracy && (
                            <span className="ml-2">±{notification.location.accuracy.toFixed(0)}m</span>
                          )}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />

          {notifications.length > maxItems && (
            <div className="text-center">
              <Button 
                type="link" 
                size="small"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : `Show All (${notifications.length})`}
              </Button>
            </div>
          )}
        </Space>
      )}

      {showSettings && (
        <div className="mt-4 pt-4 border-t">
          <Title level={5} className="mb-3">Notification Settings</Title>
          <Space direction="vertical" className="w-full">
            <div className="flex justify-between items-center">
              <Text>Browser Notifications</Text>
              <Text type="secondary" className="capitalize">
                {permissionStatus}
              </Text>
            </div>
            <div className="flex justify-between items-center">
              <Text>Sound Alerts</Text>
              <Switch
                size="small"
                checked={settings.enableSound}
                onChange={(checked) => handleSettingChange('enableSound', checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <Text>Vibration</Text>
              <Switch
                size="small"
                checked={settings.enableVibration}
                onChange={(checked) => handleSettingChange('enableVibration', checked)}
              />
            </div>
            <div className="flex justify-between items-center">
              <Text>Persistent Reminders</Text>
              <Switch
                size="small"
                checked={settings.persistentReminders}
                onChange={(checked) => handleSettingChange('persistentReminders', checked)}
              />
            </div>
          </Space>
        </div>
      )}
    </Card>
  )
}
