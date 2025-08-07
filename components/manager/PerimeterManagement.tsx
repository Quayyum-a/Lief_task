'use client'

import { useState } from 'react'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Table,
  Space,
  Modal,
  message,
  Tag,
  Typography,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EnvironmentOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useShift } from '@/context/ShiftContext'
import { Perimeter } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { confirm } = Modal

interface PerimeterFormData {
  name: string
  centerLat: number
  centerLng: number
  radiusKm: number
}

export default function PerimeterManagement() {
  const { perimeters, setPerimeter } = useShift()
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPerimeter, setEditingPerimeter] = useState<Perimeter | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (values: PerimeterFormData) => {
    setIsSubmitting(true)
    try {
      await setPerimeter({
        name: values.name,
        centerLat: values.centerLat,
        centerLng: values.centerLng,
        radiusKm: values.radiusKm,
        createdBy: 'current-manager-id', // This would come from auth context
      })
      
      form.resetFields()
      setIsModalOpen(false)
      setEditingPerimeter(null)
    } catch (error) {
      message.error('Failed to save perimeter')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (perimeter: Perimeter) => {
    setEditingPerimeter(perimeter)
    form.setFieldsValue({
      name: perimeter.name,
      centerLat: perimeter.centerLat,
      centerLng: perimeter.centerLng,
      radiusKm: perimeter.radiusKm,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (perimeter: Perimeter) => {
    confirm({
      title: 'Delete Perimeter',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${perimeter.name}"?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        message.info('Delete functionality will be implemented in full version')
      },
    })
  }

  const columns: ColumnsType<Perimeter> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <EnvironmentOutlined />
          <span className="font-medium">{name}</span>
        </Space>
      ),
    },
    {
      title: 'Center Coordinates',
      key: 'coordinates',
      render: (_, record: Perimeter) => (
        <div className="text-sm">
          <div>Lat: {record.centerLat.toFixed(6)}</div>
          <div>Lng: {record.centerLng.toFixed(6)}</div>
        </div>
      ),
    },
    {
      title: 'Radius',
      dataIndex: 'radiusKm',
      key: 'radiusKm',
      render: (radius: number) => (
        <Tag color="blue">{radius} km</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: () => (
        <Tag color="green">Active</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Perimeter) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      message.error('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setFieldsValue({
          centerLat: position.coords.latitude,
          centerLng: position.coords.longitude,
        })
        message.success('Current location set as center point')
      },
      (error) => {
        message.error('Failed to get current location')
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Perimeters"
              value={perimeters.length}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Perimeters"
              value={perimeters.length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Staff in Perimeters"
              value={2}
              suffix="/ 4"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Perimeter Table */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <Title level={4} className="mb-0">Location Perimeters</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingPerimeter(null)
                form.resetFields()
                setIsModalOpen(true)
              }}
            >
              Add Perimeter
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={perimeters}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingPerimeter ? 'Edit Perimeter' : 'Add New Perimeter'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingPerimeter(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Perimeter Name"
            rules={[{ required: true, message: 'Please enter a perimeter name' }]}
          >
            <Input placeholder="e.g., Main Hospital Campus" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="centerLat"
                label="Center Latitude"
                rules={[
                  { required: true, message: 'Please enter latitude' },
                  { type: 'number', min: -90, max: 90, message: 'Invalid latitude' },
                ]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="40.7128"
                  step={0.000001}
                  precision={6}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="centerLng"
                label="Center Longitude"
                rules={[
                  { required: true, message: 'Please enter longitude' },
                  { type: 'number', min: -180, max: 180, message: 'Invalid longitude' },
                ]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="-74.0060"
                  step={0.000001}
                  precision={6}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="mb-4">
            <Button type="dashed" onClick={getCurrentLocation} block>
              Use Current Location as Center
            </Button>
          </div>

          <Form.Item
            name="radiusKm"
            label="Radius (kilometers)"
            rules={[
              { required: true, message: 'Please enter radius' },
              { type: 'number', min: 0.1, max: 50, message: 'Radius must be between 0.1 and 50 km' },
            ]}
          >
            <InputNumber
              className="w-full"
              placeholder="2.0"
              step={0.1}
              precision={1}
              addonAfter="km"
            />
          </Form.Item>

          <div className="bg-blue-50 p-3 rounded mb-4">
            <p className="text-sm text-blue-700 mb-0">
              <strong>Note:</strong> Staff members will only be able to clock in when they are within 
              the specified radius from the center point. Make sure the radius covers all necessary 
              work areas.
            </p>
          </div>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
              >
                {editingPerimeter ? 'Update' : 'Create'} Perimeter
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
