'use client'

import { useEffect, useState } from 'react'
import { Button, notification } from 'antd'
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration)
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError)
          })
      })
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      notification.success({
        message: 'App Installed!',
        description: 'HealthShift has been added to your home screen.',
      })
    }

    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-dismissed', 'true')
  }

  // Don't show if dismissed this session or already installed
  if (!showInstallPrompt || sessionStorage.getItem('pwa-dismissed')) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">Install HealthShift</h4>
          <p className="text-sm text-gray-600">
            Add to your home screen for quick access and offline functionality.
          </p>
        </div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="primary"
          size="small"
          icon={<DownloadOutlined />}
          onClick={handleInstallClick}
          className="flex-1"
        >
          Install App
        </Button>
        <Button size="small" onClick={handleDismiss}>
          Not Now
        </Button>
      </div>
    </div>
  )
}
