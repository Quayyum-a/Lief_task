import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ConfigProvider } from 'antd'
import AuthProvider from '@/components/auth/AuthProvider'
import { ShiftProvider } from '@/context/ShiftContext'
import PWAInstaller from '@/components/shared/PWAInstaller'
import '@ant-design/v5-patch-for-react-19'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HealthShift - Healthcare Worker Management',
  description: 'Clock in and out system for healthcare workers',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1890ff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 8,
              },
              components: {
                Layout: {
                  headerBg: '#fff',
                  headerHeight: 64,
                },
                Card: {
                  headerBg: 'transparent',
                },
              },
            }}
          >
            <ShiftProvider>
              {children}
              <PWAInstaller />
            </ShiftProvider>
          </ConfigProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
