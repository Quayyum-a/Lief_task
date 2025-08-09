'use client'

import { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  InputNumber, 
  Space, 
  Typography, 
  List, 
  Tag, 
  Popconfirm, 
  Modal,
  Row,
  Col,
  Alert,
  Statistic,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  EnvironmentOutlined, 
  EditOutlined, 
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useShift } from '@/context/ShiftContext'
import { perimeterManager } from '@/lib/perimeter'
import { useLocation } from '@/hooks/useLocation'
import LocationPermission from '@/components/shared/LocationPermission'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface PerimeterForm {
  name: string
  centerLat: number
  centerLng: number
  radiusKm: number
  description?: string
}

export default function PerimeterManagement() {
  const { perimeters, setPerimeter } = useShift()
  const { location, permissionState } = useLocation()
  
  const [form] = Form.useForm()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingPerimeter, setEditingPerimeter] = useState<{ id: string; name: string; centerLat: number; centerLng: number; radiusKm: number; description?: string } | null>(null)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [loading, setLoading] = useState(false)

  // Calculate current location status for all perimeters
  const [locationStatus, setLocationStatus] = useState<{
    [key: string]: { distance: number; isWithin: boolean }
  }>({})

  useEffect(() => {
    if (location) {
      const status: typeof locationStatus = {}
      perimeters.forEach(perimeter => {
        const perimeterSettings = {
          centerLatitude: perimeter.centerLat,
          centerLongitude: perimeter.centerLng,
          radiusInMeters: perimeter.radiusKm * 1000
        }

        // Temporarily set this perimeter for checking
        perimeterManager.setPerimeters([perimeterSettings])
        const result = perimeterManager.checkLocation(location)

        status[perimeter.id] = {
          distance: result.distance,
          isWithin: result.isWithin
        }
      })
      setLocationStatus(status)
    }
  }, [location, perimeters])

  const handleOpenModal = (perimeter?: { id: string; name: string; centerLat: number; centerLng: number; radiusKm: number; description?: string }) => {
    setEditingPerimeter(perimeter || null)
    setIsModalVisible(true)
    
    if (perimeter) {
      form.setFieldsValue({
        name: perimeter.name,
        centerLat: perimeter.centerLat,
        centerLng: perimeter.centerLng,
        radiusKm: perimeter.radiusKm,
        description: perimeter.description || ''
      })
    } else {
      form.resetFields()
      if (location && useCurrentLocation) {
        form.setFieldsValue({
          centerLat: location.latitude,
          centerLng: location.longitude,
          radiusKm: 0.5 // Default 500m radius
        })
      }
    }
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
    setEditingPerimeter(null)
    setUseCurrentLocation(false)
    form.resetFields()
  }

  const handleUseCurrentLocation = () => {
    if (location) {
      form.setFieldsValue({
        centerLat: location.latitude,
        centerLng: location.longitude
      })
      setUseCurrentLocation(true)
    }
  }

  const handleSubmit = async (values: PerimeterForm) => {
    setLoading(true)
    try {
      await setPerimeter({
        name: values.name,
        centerLat: values.centerLat,
        centerLng: values.centerLng,
        radiusKm: values.radiusKm,
        createdBy: 'manager',
        description: values.description
      })
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save perimeter:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (perimeterId: string) => {
    // In a real app, this would call an API to delete the perimeter
    console.log('Delete perimeter:', perimeterId)
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Show location permission if not granted
  if (permissionState !== 'granted') {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Title level={2}>Perimeter Management</Title>
        <Alert
          message="Location Access Required"
          description="Location access is needed to manage work perimeters and see your current position relative to them."
          type="info"
          className="mb-4"
        />
        <LocationPermission 
          title="Enable Location for Perimeter Management"
          description="Managers need location access to set up work perimeters and monitor their effectiveness."
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Perimeter Management</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
        >
          Add Perimeter
        </Button>
      </div>

      {/* Current Location Status */}
      {location && (
        <Card title={<><EnvironmentOutlined /> Current Manager Location</>} size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title="Latitude"
                value={location.latitude.toFixed(6)}
                precision={6}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Longitude"
                value={location.longitude.toFixed(6)}
                precision={6}
              />
            </Col>
          </Row>
          {location.accuracy && (
            <div className="mt-2">
              <Text type="secondary">
                Accuracy: ±{location.accuracy.toFixed(0)}m
              </Text>
            </div>
          )}
        </Card>
      )}

      {/* Perimeters List */}
      <Card title="Work Area Perimeters">
        {perimeters.length === 0 ? (
          <div className="text-center py-8">
            <EnvironmentOutlined className="text-4xl text-gray-300 mb-4" />
            <Title level={4} type="secondary">No Perimeters Configured</Title>
            <Paragraph type="secondary">
              Set up work area perimeters to control where workers can clock in and out.
            </Paragraph>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
            >
              Create First Perimeter
            </Button>
          </div>
        ) : (
          <List
            dataSource={perimeters}
            renderItem={(perimeter) => {
              const status = locationStatus[perimeter.id]
              return (
                <List.Item
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleOpenModal(perimeter)}
                    >
                      Edit
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="Delete this perimeter?"
                      description="This will affect all workers using this perimeter."
                      onConfirm={() => handleDelete(perimeter.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okType="danger"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<EnvironmentOutlined className="text-2xl text-blue-600" />}
                    title={
                      <div className="flex items-center gap-2">
                        <Text strong>{perimeter.name}</Text>
                        {status && (
                          <Tag 
                            color={status.isWithin ? 'green' : 'blue'}
                            icon={status.isWithin ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
                          >
                            {status.isWithin ? 'You are here' : formatDistance(status.distance)}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <Space direction="vertical" size="small" className="w-full">
                        <div>
                          <Text type="secondary">
                            Center: {perimeter.centerLat.toFixed(6)}, {perimeter.centerLng.toFixed(6)}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">
                            Radius: {perimeter.radiusKm}km ({(perimeter.radiusKm * 1000).toFixed(0)}m)
                          </Text>
                        </div>
                        {perimeter.description && (
                          <div>
                            <Text type="secondary">{perimeter.description}</Text>
                          </div>
                        )}
                        <div>
                          <Text type="secondary" className="text-xs">
                            Created: {new Date(perimeter.createdAt).toLocaleDateString()}
                          </Text>
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )
            }}
          />
        )}
      </Card>

      {/* Perimeter Form Modal */}
      <Modal
        title={editingPerimeter ? 'Edit Perimeter' : 'Add New Perimeter'}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="Perimeter Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="e.g., Main Hospital, Clinic A" />
          </Form.Item>

          <Form.Item
            label="Description (Optional)"
            name="description"
          >
            <TextArea 
              rows={2} 
              placeholder="Additional details about this work area..."
            />
          </Form.Item>

          <Divider orientation="left">Location Settings</Divider>

          {location && !editingPerimeter && (
            <div className="mb-4">
              <Alert
                message="Current Location Available"
                description={
                  <div>
                    <Text>Your current location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</Text>
                    <br />
                    <Button 
                      type="link" 
                      size="small"
                      onClick={handleUseCurrentLocation}
                      className="p-0 h-auto"
                    >
                      Use current location as center
                    </Button>
                  </div>
                }
                type="info"
                showIcon
                className="mb-4"
              />
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="centerLat"
                label="Center Latitude"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: -90, max: 90, message: 'Invalid latitude' }
                ]}
              >
                <InputNumber
                  step={0.000001}
                  precision={6}
                  className="w-full"
                  placeholder="40.7831"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="centerLng"
                label="Center Longitude"
                rules={[
                  { required: true, message: 'Required' },
                  { type: 'number', min: -180, max: 180, message: 'Invalid longitude' }
                ]}
              >
                <InputNumber
                  step={0.000001}
                  precision={6}
                  className="w-full"
                  placeholder="-73.9712"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="radiusKm"
            label="Radius (kilometers)"
            rules={[
              { required: true, message: 'Please enter radius' },
              { type: 'number', min: 0.01, max: 50, message: 'Radius must be between 0.01 and 50 km' }
            ]}
          >
            <InputNumber
              step={0.1}
              precision={2}
              className="w-full"
              placeholder="0.5"
              addonAfter="km"
            />
          </Form.Item>

          <Alert
            message="Perimeter Guidelines"
            description={
              <ul className="text-sm mt-2 ml-4">
                <li>Choose a radius that covers the work area but isn&apos;t too large</li>
                <li>Consider building size and parking areas</li>
                <li>Test the perimeter by walking the boundaries</li>
                <li>Typical hospital perimeters: 200m - 1km radius</li>
              </ul>
            }
            type="info"
            showIcon
            className="mb-4"
          />

          <div className="flex justify-end gap-2">
            <Button onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
            >
              {editingPerimeter ? 'Update' : 'Create'} Perimeter
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
