import { LocationCoordinates } from './location'
import { perimeterManager } from './perimeter'

export interface LocationNotification {
  id: string
  type: 'perimeter_entry' | 'perimeter_exit' | 'shift_reminder' | 'accuracy_warning'
  title: string
  message: string
  timestamp: number
  location?: LocationCoordinates
  data?: Record<string, unknown>
}

export interface NotificationOptions {
  enableSound?: boolean
  enableVibration?: boolean
  persistentReminders?: boolean
  accuracyThreshold?: number
}

class NotificationService {
  private notifications: LocationNotification[] = []
  private listeners: ((notification: LocationNotification) => void)[] = []
  private lastLocation: LocationCoordinates | null = null
  private lastPerimeterState: boolean | null = null
  private options: NotificationOptions = {
    enableSound: true,
    enableVibration: true,
    persistentReminders: false,
    accuracyThreshold: 50
  }

  /**
   * Initialize notification service and request permissions
   */
  async initialize(options: Partial<NotificationOptions> = {}): Promise<boolean> {
    this.options = { ...this.options, ...options }

    // Request notification permission for web notifications
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      } catch (error) {
        console.warn('Notification permission request failed:', error)
        return false
      }
    }

    return Notification.permission === 'granted'
  }

  /**
   * Add notification listener
   */
  addListener(callback: (notification: LocationNotification) => void): () => void {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Process location update and generate appropriate notifications
   */
  processLocationUpdate(location: LocationCoordinates): LocationNotification[] {
    const newNotifications: LocationNotification[] = []

    // Check location accuracy
    if (location.accuracy && location.accuracy > (this.options.accuracyThreshold || 50)) {
      const accuracyNotification = this.createNotification(
        'accuracy_warning',
        'Improving Location Accuracy',
        `GPS accuracy is low (±${location.accuracy.toFixed(0)}m). Move to an open area for better signal.`,
        location
      )
      newNotifications.push(accuracyNotification)
    }

    // Check perimeter entry/exit
    if (this.lastLocation) {
      const perimeterChange = perimeterManager.getPerimeterNotification(this.lastLocation, location)
      
      if (perimeterChange && perimeterChange.type !== 'none') {
        const notification = this.createNotification(
          perimeterChange.type === 'entered' ? 'perimeter_entry' : 'perimeter_exit',
          perimeterChange.type === 'entered' ? 'Entered Work Area' : 'Left Work Area',
          perimeterChange.message,
          location,
          { perimeter: perimeterChange.perimeter }
        )
        newNotifications.push(notification)

        // Send browser notification for important events
        this.sendBrowserNotification(notification)
      }
    }

    // Store location for next comparison
    this.lastLocation = location

    // Add to notification history and notify listeners
    for (const notification of newNotifications) {
      this.notifications.unshift(notification)
      this.notifyListeners(notification)
    }

    // Keep only last 50 notifications
    this.notifications = this.notifications.slice(0, 50)

    return newNotifications
  }

  /**
   * Create a standardized notification
   */
  private createNotification(
    type: LocationNotification['type'],
    title: string,
    message: string,
    location?: LocationCoordinates,
    data?: Record<string, unknown>
  ): LocationNotification {
    return {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      location,
      data
    }
  }

  /**
   * Send browser notification
   */
  private async sendBrowserNotification(notification: LocationNotification): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
      const notificationActions = notification.type === 'perimeter_entry' ? [
          { action: 'clock-in', title: 'Clock In Now' }
        ] : notification.type === 'perimeter_exit' ? [
          { action: 'clock-out', title: 'Clock Out' }
        ] : []

        const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png', // PWA icon
        badge: '/icon-192x192.png',
        tag: notification.type, // Replace previous notifications of same type
        requireInteraction: notification.type === 'perimeter_entry', // Keep entry notifications visible
      })

        // Handle notification clicks
        browserNotification.onclick = () => {
          window.focus()
          browserNotification.close()
          
          // Emit custom event for app to handle
          window.dispatchEvent(new CustomEvent('notificationClick', {
            detail: { notification, action: 'click' }
          }))
        }

        // Auto-close after 10 seconds for non-persistent notifications
        if (!this.options.persistentReminders) {
          setTimeout(() => {
            browserNotification.close()
          }, 10000)
        }

        // Vibrate on mobile if enabled
        if (this.options.enableVibration && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200])
        }

      } catch (error) {
        console.warn('Failed to send browser notification:', error)
      }
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(notification: LocationNotification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification)
      } catch (error) {
        console.error('Notification listener error:', error)
      }
    })
  }

  /**
   * Manually trigger a notification
   */
  sendNotification(
    type: LocationNotification['type'],
    title: string,
    message: string,
    location?: LocationCoordinates,
    data?: Record<string, unknown>
  ): LocationNotification {
    const notification = this.createNotification(type, title, message, location, data)
    this.notifications.unshift(notification)
    this.notifyListeners(notification)
    this.sendBrowserNotification(notification)
    
    return notification
  }

  /**
   * Send clock-in reminder when user enters perimeter
   */
  sendClockInReminder(location: LocationCoordinates, perimeterName?: string): void {
    this.sendNotification(
      'shift_reminder',
      'Ready to Clock In',
      `You're now at ${perimeterName || 'your work location'}. Don't forget to clock in for your shift!`,
      location,
      { action: 'clock-in' }
    )
  }

  /**
   * Send clock-out reminder when user leaves perimeter
   */
  sendClockOutReminder(location: LocationCoordinates, perimeterName?: string): void {
    this.sendNotification(
      'shift_reminder',
      'Clock Out Reminder',
      `You've left ${perimeterName || 'your work location'}. Remember to clock out if your shift has ended.`,
      location,
      { action: 'clock-out' }
    )
  }

  /**
   * Get notification history
   */
  getNotifications(limit: number = 20): LocationNotification[] {
    return this.notifications.slice(0, limit)
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.notifications = []
  }

  /**
   * Update notification options
   */
  updateOptions(options: Partial<NotificationOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Get current options
   */
  getOptions(): NotificationOptions {
    return { ...this.options }
  }

  /**
   * Check if notifications are supported and enabled
   */
  isSupported(): boolean {
    return 'Notification' in window
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission | 'not-supported' {
    if (!this.isSupported()) return 'not-supported'
    return Notification.permission
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// React hook for using notifications
export function useNotifications(options?: Partial<NotificationOptions>) {
  const [notifications, setNotifications] = React.useState<LocationNotification[]>([])
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    notificationService.initialize(options).then(setIsInitialized)
    
    const unsubscribe = notificationService.addListener((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 19)]) // Keep last 20
    })

    // Load existing notifications
    setNotifications(notificationService.getNotifications())

    return unsubscribe
  }, [options])

  return {
    notifications,
    isInitialized,
    isSupported: notificationService.isSupported(),
    permissionStatus: notificationService.getPermissionStatus(),
    sendNotification: notificationService.sendNotification.bind(notificationService),
    clearNotifications: () => {
      notificationService.clearNotifications()
      setNotifications([])
    }
  }
}

// Import React for the hook
import React from 'react'
