'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Form, Space, Typography, Divider, message, Alert } from 'antd'
import { GoogleOutlined, MailOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { signIn, getProviders } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

const { Title, Text } = Typography

interface Provider {
  id: string
  name: string
  type: string
}

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [providers, setProviders] = useState<Record<string, Provider>>({})
  const [form] = Form.useForm()

  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    if (error) {
      message.error('Sign in failed. Please try again.')
    }
    
    // Load available providers
    getProviders().then((providers) => {
      if (providers) {
        setProviders(providers)
      }
    })
  }, [error])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
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
    } catch {
      message.error('Email authentication is not configured')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleDemoSignIn = async (email: string) => {
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: email,
        callbackUrl: callbackUrl
      })
      if (result?.error) {
        message.error('Sign in failed')
      }
    } catch {
      message.error('Demo sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const hasGoogleProvider = providers.google
  const hasEmailProvider = providers.email
  const hasCredentialsProvider = providers.credentials

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

        {!hasGoogleProvider && !hasEmailProvider && (
          <Alert
            message="Authentication Setup Required"
            description="Please configure Google OAuth or Email authentication in your environment variables to enable sign-in."
            type="warning"
            icon={<WarningOutlined />}
            className="mb-6"
            showIcon
          />
        )}

        <Space direction="vertical" size="large" className="w-full">
          {/* Google Sign In */}
          {hasGoogleProvider && (
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
          )}

          {hasGoogleProvider && hasEmailProvider && <Divider>or</Divider>}

          {/* Email Sign In */}
          {hasEmailProvider && (
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
          )}

          {/* Demo Credentials Login */}
          {hasCredentialsProvider && (
            <div>
              <Alert
                message="Demo Mode"
                description="Use demo@worker.com or demo@manager.com to test the application."
                type="info"
                className="mb-4"
              />
              <div className="space-y-2">
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={() => handleDemoSignIn('demo@worker.com')}
                  loading={loading}
                  className="h-12"
                >
                  Sign in as Demo Worker
                </Button>
                <Button
                  size="large"
                  block
                  onClick={() => handleDemoSignIn('demo@manager.com')}
                  loading={loading}
                  className="h-12"
                >
                  Sign in as Demo Manager
                </Button>
              </div>
            </div>
          )}

          <div className="text-center mt-6">
            <Text type="secondary" className="text-sm">
              {hasGoogleProvider || hasEmailProvider ? (
                <>
                  Sign in to access your healthcare shift management dashboard.
                  <br />
                  <br />
                  <strong>Role Assignment:</strong>
                  <br />
                  • Emails containing &quot;manager&quot; → Manager access
                  <br />
                  • All other emails → Worker access
                  <br />
                  <br />
                  Don&apos;t have an account?{' '}
                  <a href="/auth/signup" className="text-blue-600 hover:underline">
                    Sign up here
                  </a>
                </>
              ) : (
                <>
                  To enable real authentication:
                  <br />
                  1. Set up Google OAuth credentials
                  <br />
                  2. Configure email SMTP settings
                  <br />
                  3. Update your .env.local file
                </>
              )}
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
