'use client'

import { Card, Button, Typography, Space } from 'antd'
import { ExclamationCircleOutlined, HomeOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const { Title, Text } = Typography

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification link was invalid or has expired.'
      default:
        return 'An error occurred during authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationCircleOutlined className="text-2xl text-red-600" />
            </div>
          </div>
          
          <Title level={3} className="mb-4">Authentication Error</Title>
          
          <Text type="secondary" className="text-base mb-6 block">
            {getErrorMessage(error)}
          </Text>

          <Space direction="vertical" size="middle" className="w-full">
            <Link href="/auth/signin">
              <Button type="primary" size="large" block>
                Try Again
              </Button>
            </Link>
            
            <Link href="/">
              <Button icon={<HomeOutlined />} size="large" block>
                Go Home
              </Button>
            </Link>
          </Space>
        </div>
      </Card>
    </div>
  )
}
