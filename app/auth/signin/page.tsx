'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Form, Space, Typography, Divider, message } from 'antd'
import { GoogleOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const { Title, Text } = Typography

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [form] = Form.useForm()

  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    if (error) {
      message.error('Sign in failed. Please try again.')
    }
  }, [error])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch (error) {
      message.error('Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (values: { email: string }) => {
    setEmailLoading(true)
    try {
      const result = await signIn('email', {
        email: values.email,
        redirect: false,
      })

      if (result?.ok) {
        message.success('Check your email for a sign-in link!')
        form.resetFields()
      } else {
        message.error('Failed to send email. Please try again.')
      }
    } catch (error) {
      message.error('Failed to send sign-in email')
    } finally {
      setEmailLoading(false)
    }
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
          {/* Google Sign In */}
          <div>
            <Button
              type="primary"
              icon={<GoogleOutlined />}
              size="large"
              block
              loading={loading}
              onClick={handleGoogleSignIn}
              className="h-12 flex items-center justify-center"
            >
              Continue with Google
            </Button>
          </div>

          <Divider>or</Divider>

          {/* Email Sign In */}
          <div>
            <Form
              form={form}
              onFinish={handleEmailSignIn}
              layout="vertical"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter your email address"
                  size="large"
                />
              </Form.Item>
              
              <Form.Item className="mb-0">
                <Button
                  type="default"
                  htmlType="submit"
                  size="large"
                  block
                  loading={emailLoading}
                  className="h-12"
                >
                  Send Magic Link
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className="text-center mt-6">
            <Text type="secondary" className="text-sm">
              Sign in to access your healthcare shift management dashboard.
              <br />
              <br />
              <strong>Demo Role Assignment:</strong>
              <br />
              • Emails containing &quot;manager&quot; → Manager access
              <br />
              • All other emails → Worker access
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
