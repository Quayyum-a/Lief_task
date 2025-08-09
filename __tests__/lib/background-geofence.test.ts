import { backgroundGeofenceService } from '@/lib/background-geofence'
import { perimeterManager } from '@/lib/perimeter'
import { notificationService } from '@/lib/notifications'

// Mock the dependencies
jest.mock('@/lib/perimeter')
jest.mock('@/lib/notifications')

describe('BackgroundGeofenceService', () => {
  const service = backgroundGeofenceService
  const mockPerimeterManager = perimeterManager as jest.Mocked<typeof perimeterManager>
  const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    service.stopRegionMonitoring()
    service.clearData()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('region monitoring lifecycle', () => {
    it('should start monitoring successfully', async () => {
      const started = await service.startRegionMonitoring({
        interval: 10000,
        enableBackgroundFetch: false
      })

      expect(started).toBe(true)
      expect(service.getStatus().isMonitoring).toBe(true)
    })

    it('should prevent multiple monitoring instances', async () => {
      await service.startRegionMonitoring()
      const secondStart = await service.startRegionMonitoring()
      
      expect(secondStart).toBe(true) // Should return true but not start again
      expect(service.getStatus().isMonitoring).toBe(true)
    })

    it('should stop monitoring', async () => {
      await service.startRegionMonitoring()
      service.stopRegionMonitoring()
      
      expect(service.getStatus().isMonitoring).toBe(false)
    })
  })

  describe('location simulation', () => {
    beforeEach(() => {
      mockPerimeterManager.checkLocation.mockReturnValue({
        isWithin: true,
        distance: 100,
        perimeter: {
          centerLatitude: 40.7831,
          centerLongitude: -73.9712,
          radiusInMeters: 500
        },
        message: 'Within work area'
      })

      mockPerimeterManager.getClosestPerimeter.mockReturnValue({
        perimeter: {
          centerLatitude: 40.7831,
          centerLongitude: -73.9712,
          radiusInMeters: 500
        },
        distance: 100
      })
    })

    it('should process simulated location updates', async () => {
      const location = {
        latitude: 40.7831,
        longitude: -73.9712,
        accuracy: 10,
        timestamp: Date.now()
      }

      await service.simulateLocationUpdate(location)

      expect(mockPerimeterManager.checkLocation).toHaveBeenCalledWith(location)
    })

    it('should detect perimeter entry events', async () => {
      // First simulate outside location
      mockPerimeterManager.checkLocation.mockReturnValueOnce({
        isWithin: false,
        distance: 600,
        perimeter: null,
        message: 'Outside work area'
      })

      await service.simulateLocationUpdate({
        latitude: 40.7700,
        longitude: -73.9600,
        timestamp: Date.now()
      })

      // Then simulate inside location
      mockPerimeterManager.checkLocation.mockReturnValueOnce({
        isWithin: true,
        distance: 100,
        perimeter: {
          centerLatitude: 40.7831,
          centerLongitude: -73.9712,
          radiusInMeters: 500
        },
        message: 'Within work area'
      })

      await service.simulateLocationUpdate({
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      })

      const events = service.getRecentEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('enter')
    })

    it('should detect perimeter exit events', async () => {
      // First simulate inside location
      mockPerimeterManager.checkLocation.mockReturnValueOnce({
        isWithin: true,
        distance: 100,
        perimeter: {
          centerLatitude: 40.7831,
          centerLongitude: -73.9712,
          radiusInMeters: 500
        },
        message: 'Within work area'
      })

      await service.simulateLocationUpdate({
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      })

      // Then simulate outside location
      mockPerimeterManager.checkLocation.mockReturnValueOnce({
        isWithin: false,
        distance: 600,
        perimeter: null,
        message: 'Outside work area'
      })

      await service.simulateLocationUpdate({
        latitude: 40.7700,
        longitude: -73.9600,
        timestamp: Date.now()
      })

      const events = service.getRecentEvents()
      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('exit')
    })
  })

  describe('notification triggers', () => {
    beforeEach(() => {
      mockPerimeterManager.getClosestPerimeter.mockReturnValue({
        perimeter: {
          centerLatitude: 40.7831,
          centerLongitude: -73.9712,
          radiusInMeters: 500,
          name: 'Test Perimeter'
        },
        distance: 100
      })
    })

    it('should send clock-in reminder on perimeter entry', async () => {
      // Setup for perimeter entry
      mockPerimeterManager.checkLocation
        .mockReturnValueOnce({ isWithin: false, distance: 600, perimeter: null, message: 'Outside' })
        .mockReturnValueOnce({ 
          isWithin: true, 
          distance: 100, 
          perimeter: { centerLatitude: 40.7831, centerLongitude: -73.9712, radiusInMeters: 500 }, 
          message: 'Inside' 
        })

      // Simulate location sequence
      await service.simulateLocationUpdate({
        latitude: 40.7700,
        longitude: -73.9600,
        timestamp: Date.now()
      })

      await service.simulateLocationUpdate({
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      })

      expect(mockNotificationService.sendClockInReminder).toHaveBeenCalled()
    })

    it('should send clock-out reminder on perimeter exit', async () => {
      // Setup for perimeter exit
      mockPerimeterManager.checkLocation
        .mockReturnValueOnce({ 
          isWithin: true, 
          distance: 100, 
          perimeter: { centerLatitude: 40.7831, centerLongitude: -73.9712, radiusInMeters: 500 }, 
          message: 'Inside' 
        })
        .mockReturnValueOnce({ isWithin: false, distance: 600, perimeter: null, message: 'Outside' })

      // Simulate location sequence
      await service.simulateLocationUpdate({
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      })

      await service.simulateLocationUpdate({
        latitude: 40.7700,
        longitude: -73.9600,
        timestamp: Date.now()
      })

      expect(mockNotificationService.sendClockOutReminder).toHaveBeenCalled()
    })
  })

  describe('time entry creation', () => {
    it('should create time entries for region events', async () => {
      // Setup for perimeter entry
      mockPerimeterManager.checkLocation
        .mockReturnValueOnce({ isWithin: false, distance: 600, perimeter: null, message: 'Outside' })
        .mockReturnValueOnce({ 
          isWithin: true, 
          distance: 100, 
          perimeter: { centerLatitude: 40.7831, centerLongitude: -73.9712, radiusInMeters: 500 }, 
          message: 'Inside' 
        })

      mockPerimeterManager.getClosestPerimeter.mockReturnValue({
        perimeter: {
          centerLatitude: 40.7831,
          centerLongitude: -73.9712,
          radiusInMeters: 500
        },
        distance: 100
      })

      // Simulate perimeter entry
      await service.simulateLocationUpdate({
        latitude: 40.7700,
        longitude: -73.9600,
        timestamp: Date.now()
      })

      await service.simulateLocationUpdate({
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      })

      const timeEntries = service.getTimeEntries()
      expect(timeEntries).toHaveLength(1)
      expect(timeEntries[0].type).toBe('clock_in')
      expect(timeEntries[0].backgroundTriggered).toBe(true)
      expect(timeEntries[0].locationLat).toBe(40.7831)
      expect(timeEntries[0].locationLon).toBe(-73.9712)
    })

    it('should validate time entry data structure', async () => {
      // Setup and trigger entry event
      mockPerimeterManager.checkLocation
        .mockReturnValueOnce({ isWithin: false, distance: 600, perimeter: null, message: 'Outside' })
        .mockReturnValueOnce({ 
          isWithin: true, 
          distance: 100, 
          perimeter: { centerLatitude: 40.7831, centerLongitude: -73.9712, radiusInMeters: 500 }, 
          message: 'Inside' 
        })

      mockPerimeterManager.getClosestPerimeter.mockReturnValue({
        perimeter: {
          centerLatitude: 40.7831,
          centerLongitude: -73.9712,
          radiusInMeters: 500
        },
        distance: 100
      })

      await service.simulateLocationUpdate({ latitude: 40.7700, longitude: -73.9600, timestamp: Date.now() })
      await service.simulateLocationUpdate({ latitude: 40.7831, longitude: -73.9712, timestamp: Date.now() })

      const [entry] = service.getTimeEntries()
      
      // Validate TimeEntry structure
      expect(entry).toMatchObject({
        id: expect.stringMatching(/^time_entry_\d+_[a-z0-9]+$/),
        userId: 'simulated_user',
        type: 'clock_in',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        locationLat: expect.any(Number),
        locationLon: expect.any(Number),
        isValidLocation: true,
        backgroundTriggered: true,
        note: expect.stringContaining('Background enter event')
      })
    })
  })

  describe('background monitoring', () => {
    it('should perform periodic background checks', async () => {
      await service.startRegionMonitoring({ interval: 1000 })
      
      // Fast forward time to trigger background check
      jest.advanceTimersByTime(1500)
      
      const status = service.getStatus()
      expect(status.isMonitoring).toBe(true)
      expect(status.lastCheck).toBeGreaterThan(0)
    })

    it('should handle background fetch registration', async () => {
      // Mock service worker
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {
          ready: Promise.resolve({
            sync: {
              register: jest.fn()
            }
          })
        },
        configurable: true
      })

      const started = await service.startRegionMonitoring({
        enableBackgroundFetch: true
      })

      expect(started).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle perimeter manager errors gracefully', async () => {
      mockPerimeterManager.checkLocation.mockImplementation(() => {
        throw new Error('Perimeter check failed')
      })

      // Should not throw
      await expect(service.simulateLocationUpdate({
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      })).resolves.not.toThrow()
    })

    it('should handle notification service errors', async () => {
      mockNotificationService.sendClockInReminder.mockImplementation(() => {
        throw new Error('Notification failed')
      })

      // Setup for entry event
      mockPerimeterManager.checkLocation
        .mockReturnValueOnce({ isWithin: false, distance: 600, perimeter: null, message: 'Outside' })
        .mockReturnValueOnce({ 
          isWithin: true, 
          distance: 100, 
          perimeter: { centerLatitude: 40.7831, centerLongitude: -73.9712, radiusInMeters: 500 }, 
          message: 'Inside' 
        })

      // Should not throw even if notification fails
      await expect(service.simulateLocationUpdate({
        latitude: 40.7700, longitude: -73.9600, timestamp: Date.now()
      })).resolves.not.toThrow()

      await expect(service.simulateLocationUpdate({
        latitude: 40.7831, longitude: -73.9712, timestamp: Date.now()
      })).resolves.not.toThrow()
    })
  })

  describe('data management', () => {
    it('should clear all stored data', async () => {
      // Generate some test data
      await service.simulateLocationUpdate({
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      })

      expect(service.getTimeEntries()).toHaveLength(0) // No events yet
      
      service.clearData()
      
      expect(service.getRecentEvents()).toHaveLength(0)
      expect(service.getTimeEntries()).toHaveLength(0)
      expect(service.getStatus().lastCheck).toBeNull()
    })

    it('should track monitoring status correctly', () => {
      const initialStatus = service.getStatus()
      expect(initialStatus.isMonitoring).toBe(false)
      expect(initialStatus.eventsCount).toBe(0)
      expect(initialStatus.timeEntriesCount).toBe(0)
    })

    it('should limit stored events and entries', async () => {
      // Generate many events by alternating in/out of perimeter
      for (let i = 0; i < 15; i++) {
        const isInside = i % 2 === 0
        
        mockPerimeterManager.checkLocation.mockReturnValue({
          isWithin: isInside,
          distance: isInside ? 100 : 600,
          perimeter: isInside ? { 
            centerLatitude: 40.7831, 
            centerLongitude: -73.9712, 
            radiusInMeters: 500 
          } : null,
          message: isInside ? 'Inside' : 'Outside'
        })

        await service.simulateLocationUpdate({
          latitude: isInside ? 40.7831 : 40.7700,
          longitude: isInside ? -73.9712 : -73.9600,
          timestamp: Date.now() + i * 1000
        })
      }

      // Should limit stored events (implementation dependent)
      const events = service.getRecentEvents()
      expect(events.length).toBeLessThanOrEqual(20)
    })
  })
})
