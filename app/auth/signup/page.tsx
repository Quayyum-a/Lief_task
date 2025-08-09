'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Form, Space, Typography, Divider, message, Alert } from 'antd'
import { GoogleOutlined, MailOutlined, WarningOutlined, UserAddOutlined } from '@ant-design/icons'
import { signIn, getProviders } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const { Title, Text } = Typography

interface Provider {
  id: string
  name: string
  type: string
}

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [providers, setProviders] = useState<Record<string, Provider>>({})
  const [form] = Form.useForm()

  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    if (error) {
      message.error('Sign up failed. Please try again.')
    }
    
    // Load available providers
    getProviders().then((providers) => {
      if (providers) {
        setProviders(providers)
      }
    })
  }, [error])

  const handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl })
    } catch {
      message.error('Failed to sign up with Google')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async (values: { email: string }) => {
    setEmailLoading(true)
    try {
      const result = await signIn('email', {
        email: values.email,
        redirect: false,
      })

      if (result?.ok) {
        message.success('Check your email for a sign-up link!')
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

  const hasGoogleProvider = providers.google
  const hasEmailProvider = providers.email

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserAddOutlined className="text-2xl text-green-600" />
            </div>
          </div>
          <Title level={2} className="mb-2">Join HealthShift</Title>
          <Text type="secondary" className="text-base">
            Create your account to get started with healthcare shift management
          </Text>
        </div>

        {!hasGoogleProvider && !hasEmailProvider && (
          <Alert
            message="Authentication Setup Required"
            description="Please configure Google OAuth or Email authentication in your environment variables to enable sign-up."
            type="warning"
            icon={<WarningOutlined />}
            className="mb-6"
            showIcon
          />
        )}

        <Space direction="vertical" size="large" className="w-full">
          {/* Google Sign Up */}
          {hasGoogleProvider && (
            <div>
              <Button
                type="primary"
                icon={<GoogleOutlined />}
                size="large"
                block
                loading={loading}
                onClick={handleGoogleSignUp}
                className="h-12 flex items-center justify-center"
              >
                Sign up with Google
              </Button>
            </div>
          )}

          {hasGoogleProvider && hasEmailProvider && <Divider>or</Divider>}

          {/* Email Sign Up */}
          {hasEmailProvider && (
            <div>
              <Form
                form={form}
                onFinish={handleEmailSignUp}
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
                    Send Sign-up Link
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}

          {/* Demo Access */}
          {!hasGoogleProvider && !hasEmailProvider && (
            <div>
              <Alert
                message="Demo Mode"
                description="For demonstration purposes, you can continue without authentication. Real authentication requires Google OAuth setup."
                type="info"
                className="mb-4"
              />
              <Button
                type="primary"
                size="large"
                block
                onClick={() => router.push('/worker')}
                className="h-12"
              >
                Try as Demo Worker
              </Button>
              <Button
                size="large"
                block
                onClick={() => router.push('/manager')}
                className="h-12 mt-2"
              >
                Try as Demo Manager
              </Button>
            </div>
          )}

          <div className="text-center mt-6">
            <Text type="secondary" className="text-sm">
              {hasGoogleProvider || hasEmailProvider ? (
                <>
                  Create your account to manage healthcare shifts effectively.
                  <br />
                  <br />
                  <strong>Account Types:</strong>
                  <br />
                  • Emails with &quot;manager&quot; → Manager account
                  <br />
                  • All other emails → Worker account
                  <br />
                  <br />
                  Already have an account?{' '}
                  <Link href="/auth/signin" className="text-blue-600 hover:underline">
                    Sign in here
                  </Link>
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
