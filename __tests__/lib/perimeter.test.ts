import { PerimeterManager } from '@/lib/perimeter'
import { LocationCoordinates } from '@/lib/location'

describe('PerimeterManager', () => {
  let perimeterManager: PerimeterManager

  beforeEach(() => {
    perimeterManager = new PerimeterManager()
  })

  describe('distance calculations', () => {
    it('should calculate distance correctly using Haversine formula', () => {
      // Times Square to a point about 500m away
      const timesSquare = { latitude: 40.7831, longitude: -73.9712 }
      const nearbyPoint = { latitude: 40.7786, longitude: -73.9712 } // About 500m south

      perimeterManager.setPerimeters([{
        centerLatitude: timesSquare.latitude,
        centerLongitude: timesSquare.longitude,
        radiusInMeters: 1000
      }])

      const result = perimeterManager.checkLocation(nearbyPoint)
      
      // Distance should be approximately 450-550 meters
      expect(result.distance).toBeGreaterThan(400)
      expect(result.distance).toBeLessThan(600)
    })

    it('should return zero distance for same coordinates', () => {
      const location = { latitude: 40.7831, longitude: -73.9712 }
      
      perimeterManager.setPerimeters([{
        centerLatitude: location.latitude,
        centerLongitude: location.longitude,
        radiusInMeters: 100
      }])

      const result = perimeterManager.checkLocation(location)
      expect(result.distance).toBe(0)
      expect(result.isWithin).toBe(true)
    })

    it('should handle small distance calculations accurately', () => {
      const center = { latitude: 40.7831, longitude: -73.9712 }
      // Move approximately 50 meters north
      const nearby = { latitude: center.latitude + 0.00045, longitude: center.longitude }

      perimeterManager.setPerimeters([{
        centerLatitude: center.latitude,
        centerLongitude: center.longitude,
        radiusInMeters: 100
      }])

      const result = perimeterManager.checkLocation(nearby)
      
      // Should be approximately 50 meters
      expect(result.distance).toBeGreaterThan(40)
      expect(result.distance).toBeLessThan(60)
      expect(result.isWithin).toBe(true)
    })
  })

  describe('perimeter validation', () => {
    beforeEach(() => {
      // Set up a test perimeter at Times Square with 500m radius
      perimeterManager.setPerimeters([{
        centerLatitude: 40.7831,
        centerLongitude: -73.9712,
        radiusInMeters: 500
      }])
    })

    it('should correctly identify locations inside perimeter', () => {
      // Location very close to center
      const insideLocation: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(insideLocation)
      expect(result.isWithin).toBe(true)
      expect(result.distance).toBeLessThan(500)
    })

    it('should correctly identify locations outside perimeter', () => {
      // Empire State Building (approximately 650m away)
      const outsideLocation: LocationCoordinates = {
        latitude: 40.7484,
        longitude: -73.9857,
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(outsideLocation)
      expect(result.isWithin).toBe(false)
      expect(result.distance).toBeGreaterThan(500)
    })

    it('should handle edge case at perimeter boundary', () => {
      // Calculate a point exactly at the boundary (500m away)
      const boundaryLocation: LocationCoordinates = {
        latitude: 40.7831 + (500 / 111320), // Approximate degrees for 500m north
        longitude: -73.9712,
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(boundaryLocation)
      
      // Should be very close to 500m (within 10m tolerance)
      expect(Math.abs(result.distance - 500)).toBeLessThan(10)
    })
  })

  describe('accuracy threshold validation', () => {
    beforeEach(() => {
      perimeterManager.setPerimeters([{
        centerLatitude: 40.7831,
        centerLongitude: -73.9712,
        radiusInMeters: 100
      }])
    })

    it('should reject locations with poor accuracy', () => {
      const poorAccuracyLocation: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        accuracy: 100, // Poor accuracy
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(poorAccuracyLocation, {
        requireHighAccuracy: true,
        accuracyThreshold: 50
      })

      expect(result.isWithin).toBe(false)
      expect(result.message).toContain('accuracy too low')
    })

    it('should accept locations with good accuracy', () => {
      const goodAccuracyLocation: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        accuracy: 10, // Good accuracy
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(goodAccuracyLocation, {
        requireHighAccuracy: true,
        accuracyThreshold: 50
      })

      expect(result.isWithin).toBe(true)
    })

    it('should skip accuracy check when not required', () => {
      const poorAccuracyLocation: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        accuracy: 100,
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(poorAccuracyLocation, {
        requireHighAccuracy: false
      })

      expect(result.isWithin).toBe(true)
    })
  })

  describe('multiple perimeters', () => {
    beforeEach(() => {
      // Set up multiple perimeters
      perimeterManager.setPerimeters([
        {
          centerLatitude: 40.7831, // Times Square
          centerLongitude: -73.9712,
          radiusInMeters: 200
        },
        {
          centerLatitude: 40.7484, // Empire State Building
          centerLongitude: -73.9857,
          radiusInMeters: 300
        }
      ])
    })

    it('should find closest perimeter', () => {
      // Location closer to Empire State Building
      const location: LocationCoordinates = {
        latitude: 40.7480,
        longitude: -73.9860,
        timestamp: Date.now()
      }

      const { perimeter, distance } = perimeterManager.getClosestPerimeter(location)
      
      expect(perimeter).toBeTruthy()
      expect(perimeter?.centerLatitude).toBeCloseTo(40.7484)
      expect(distance).toBeLessThan(100) // Should be very close to Empire State
    })

    it('should validate against closest perimeter', () => {
      // Location near Empire State Building but outside Times Square
      const location: LocationCoordinates = {
        latitude: 40.7484,
        longitude: -73.9857,
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(location)
      
      expect(result.isWithin).toBe(true) // Within Empire State perimeter
      expect(result.perimeter?.centerLatitude).toBeCloseTo(40.7484)
    })
  })

  describe('clock operation validation', () => {
    beforeEach(() => {
      perimeterManager.setPerimeters([{
        centerLatitude: 40.7831,
        centerLongitude: -73.9712,
        radiusInMeters: 500
      }])
    })

    it('should allow clock in only within perimeter', () => {
      const insideLocation: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      }

      const result = perimeterManager.validateClockOperation(insideLocation, 'clock_in')
      expect(result.allowed).toBe(true)
      expect(result.message).toContain('Ready to clock in')
    })

    it('should not allow clock in outside perimeter', () => {
      const outsideLocation: LocationCoordinates = {
        latitude: 40.7484, // Empire State Building
        longitude: -73.9857,
        timestamp: Date.now()
      }

      const result = perimeterManager.validateClockOperation(outsideLocation, 'clock_in')
      expect(result.allowed).toBe(false)
      expect(result.message).toContain('Outside work area')
    })

    it('should allow clock out from anywhere', () => {
      const outsideLocation: LocationCoordinates = {
        latitude: 40.7484,
        longitude: -73.9857,
        timestamp: Date.now()
      }

      const result = perimeterManager.validateClockOperation(outsideLocation, 'clock_out')
      expect(result.allowed).toBe(true)
    })
  })

  describe('perimeter notifications', () => {
    beforeEach(() => {
      perimeterManager.setPerimeters([{
        centerLatitude: 40.7831,
        centerLongitude: -73.9712,
        radiusInMeters: 500
      }])
    })

    it('should detect perimeter entry', () => {
      const outsideLocation: LocationCoordinates = {
        latitude: 40.7484,
        longitude: -73.9857,
        timestamp: Date.now()
      }

      const insideLocation: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      }

      const notification = perimeterManager.getPerimeterNotification(outsideLocation, insideLocation)
      
      expect(notification).toBeTruthy()
      expect(notification!.type).toBe('entered')
      expect(notification!.message).toContain('entered')
    })

    it('should detect perimeter exit', () => {
      const insideLocation: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      }

      const outsideLocation: LocationCoordinates = {
        latitude: 40.7484,
        longitude: -73.9857,
        timestamp: Date.now()
      }

      const notification = perimeterManager.getPerimeterNotification(insideLocation, outsideLocation)
      
      expect(notification).toBeTruthy()
      expect(notification!.type).toBe('exited')
      expect(notification!.message).toContain('left')
    })

    it('should not trigger notification for same perimeter state', () => {
      const location1: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      }

      const location2: LocationCoordinates = {
        latitude: 40.7832,
        longitude: -73.9713,
        timestamp: Date.now()
      }

      const notification = perimeterManager.getPerimeterNotification(location1, location2)
      
      expect(notification!.type).toBe('none')
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle no perimeters configured', () => {
      const location: LocationCoordinates = {
        latitude: 40.7831,
        longitude: -73.9712,
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(location)
      
      expect(result.isWithin).toBe(false)
      expect(result.message).toContain('No work perimeters configured')
    })

    it('should handle extreme coordinates', () => {
      perimeterManager.setPerimeters([{
        centerLatitude: 0,
        centerLongitude: 0,
        radiusInMeters: 1000
      }])

      const extremeLocation: LocationCoordinates = {
        latitude: 85, // Near north pole
        longitude: 180, // Date line
        timestamp: Date.now()
      }

      const result = perimeterManager.checkLocation(extremeLocation)
      
      expect(result.distance).toBeGreaterThan(1000)
      expect(result.isWithin).toBe(false)
    })

    it('should format distances correctly', () => {
      expect(perimeterManager.formatDistance(500)).toBe('500m')
      expect(perimeterManager.formatDistance(1000)).toBe('1.0km')
      expect(perimeterManager.formatDistance(1500)).toBe('1.5km')
      expect(perimeterManager.formatDistance(50)).toBe('50m')
    })
  })

  describe('buffer zone handling', () => {
    beforeEach(() => {
      perimeterManager.setPerimeters([{
        centerLatitude: 40.7831,
        centerLongitude: -73.9712,
        radiusInMeters: 100
      }])
    })

    it('should apply buffer to perimeter radius', () => {
      // Location 120m away (outside normal perimeter)
      const location: LocationCoordinates = {
        latitude: 40.7831 + (120 / 111320),
        longitude: -73.9712,
        timestamp: Date.now()
      }

      // Without buffer - should be outside
      const resultNoBuffer = perimeterManager.checkLocation(location)
      expect(resultNoBuffer.isWithin).toBe(false)

      // With 50m buffer - should now be inside
      const resultWithBuffer = perimeterManager.checkLocation(location, { allowBuffer: 50 })
      expect(resultWithBuffer.isWithin).toBe(true)
    })
  })
})
