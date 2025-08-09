import { LocationCoordinates } from './location'
import { perimeterManager } from './perimeter'

export interface SimulatedLocationOptions {
  accuracy?: number
  speed?: number // meters per second
  updateInterval?: number // milliseconds
}

export interface LocationSequence {
  locations: LocationCoordinates[]
  durations: number[] // time to spend at each location in milliseconds
  description: string
}

export class LocationSimulator {
  private isRunning = false
  private currentIndex = 0
  private timeoutId: NodeJS.Timeout | null = null
  private callbacks: ((location: LocationCoordinates) => void)[] = []

  /**
   * Add callback for location updates
   */
  onLocationUpdate(callback: (location: LocationCoordinates) => void): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Start simulating a sequence of locations
   */
  startSequence(sequence: LocationSequence, options: SimulatedLocationOptions = {}): void {
    if (this.isRunning) {
      this.stop()
    }

    this.isRunning = true
    this.currentIndex = 0

    console.log(`🎯 Starting location simulation: ${sequence.description}`)

    const processNext = () => {
      if (!this.isRunning || this.currentIndex >= sequence.locations.length) {
        this.stop()
        return
      }

      const location: LocationCoordinates = {
        ...sequence.locations[this.currentIndex],
        accuracy: options.accuracy || 10,
        timestamp: Date.now()
      }

      console.log(`📍 Simulated location ${this.currentIndex + 1}/${sequence.locations.length}:`, {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: location.accuracy
      })

      // Check perimeter status
      const result = perimeterManager.checkLocation(location)
      console.log(`   ${result.isWithin ? '✅' : '❌'} ${result.message}`)

      // Notify callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(location)
        } catch (error) {
          console.error('Location callback error:', error)
        }
      })

      // Schedule next location
      const duration = sequence.durations[this.currentIndex] || 3000
      this.currentIndex++
      this.timeoutId = setTimeout(processNext, duration)
    }

    processNext()
  }

  /**
   * Simulate walking from one point to another
   */
  simulateWalk(
    from: LocationCoordinates,
    to: LocationCoordinates,
    options: SimulatedLocationOptions = {}
  ): void {
    const { speed = 1.4, updateInterval = 2000 } = options // 1.4 m/s = walking speed
    
    // Calculate distance and steps
    const distance = this.calculateDistance(from, to) * 1000 // convert to meters
    const totalTime = distance / speed * 1000 // milliseconds
    const steps = Math.ceil(totalTime / updateInterval)
    
    const locations: LocationCoordinates[] = []
    const durations: number[] = []

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      const lat = from.latitude + (to.latitude - from.latitude) * progress
      const lng = from.longitude + (to.longitude - from.longitude) * progress
      
      locations.push({ latitude: lat, longitude: lng })
      durations.push(updateInterval)
    }

    const sequence: LocationSequence = {
      locations,
      durations,
      description: `Walking from (${from.latitude.toFixed(4)}, ${from.longitude.toFixed(4)}) to (${to.latitude.toFixed(4)}, ${to.longitude.toFixed(4)})`
    }

    this.startSequence(sequence, options)
  }

  /**
   * Stop the current simulation
   */
  stop(): void {
    this.isRunning = false
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    console.log('⏹️ Location simulation stopped')
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  private calculateDistance(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const dLng = (coord2.longitude - coord1.longitude) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  /**
   * Check if currently running
   */
  isSimulating(): boolean {
    return this.isRunning
  }

  /**
   * Get current simulation progress
   */
  getProgress(): { current: number; total: number; isRunning: boolean } {
    return {
      current: this.currentIndex,
      total: 0, // Would need to store sequence length
      isRunning: this.isRunning
    }
  }
}

// Predefined test scenarios
export const testScenarios = {
  // Scenario 1: Approach perimeter from outside
  approachPerimeter: (centerLat: number, centerLng: number, radiusMeters: number): LocationSequence => ({
    locations: [
      { latitude: centerLat - 0.01, longitude: centerLng - 0.01 }, // Far outside
      { latitude: centerLat - 0.005, longitude: centerLng - 0.005 }, // Getting closer
      { latitude: centerLat - 0.002, longitude: centerLng - 0.002 }, // Near perimeter edge
      { latitude: centerLat - 0.001, longitude: centerLng - 0.001 }, // Just inside
      { latitude: centerLat, longitude: centerLng }, // Center
    ],
    durations: [2000, 2000, 2000, 2000, 2000],
    description: 'Approaching perimeter from outside'
  }),

  // Scenario 2: Leave perimeter during active shift
  leavePerimeter: (centerLat: number, centerLng: number, radiusMeters: number): LocationSequence => ({
    locations: [
      { latitude: centerLat, longitude: centerLng }, // Center (inside)
      { latitude: centerLat + 0.001, longitude: centerLng + 0.001 }, // Still inside
      { latitude: centerLat + 0.002, longitude: centerLng + 0.002 }, // Edge of perimeter
      { latitude: centerLat + 0.005, longitude: centerLng + 0.005 }, // Just outside
      { latitude: centerLat + 0.01, longitude: centerLng + 0.01 }, // Far outside
    ],
    durations: [2000, 2000, 2000, 2000, 2000],
    description: 'Leaving perimeter during shift'
  }),

  // Scenario 3: Cross perimeter boundary multiple times
  crossBoundary: (centerLat: number, centerLng: number, radiusMeters: number): LocationSequence => ({
    locations: [
      { latitude: centerLat - 0.005, longitude: centerLng }, // Outside
      { latitude: centerLat - 0.001, longitude: centerLng }, // Inside
      { latitude: centerLat - 0.003, longitude: centerLng }, // Outside
      { latitude: centerLat, longitude: centerLng }, // Inside (center)
      { latitude: centerLat + 0.003, longitude: centerLng }, // Outside
      { latitude: centerLat + 0.001, longitude: centerLng }, // Inside
    ],
    durations: [1500, 1500, 1500, 1500, 1500, 1500],
    description: 'Crossing perimeter boundary multiple times'
  }),

  // Scenario 4: Poor GPS accuracy simulation
  poorAccuracy: (centerLat: number, centerLng: number): LocationSequence => ({
    locations: [
      { latitude: centerLat, longitude: centerLng }, // Center with poor accuracy
      { latitude: centerLat + 0.0001, longitude: centerLng + 0.0001 }, // Small drift
      { latitude: centerLat - 0.0001, longitude: centerLng - 0.0001 }, // Small drift back
    ],
    durations: [3000, 3000, 3000],
    description: 'Poor GPS accuracy test (±100m accuracy)'
  }),

  // Times Square perimeter test (default perimeter from the app)
  timesSquareTest: (): LocationSequence => ({
    locations: [
      { latitude: 40.7831, longitude: -73.9712 }, // Times Square center
      { latitude: 40.7825, longitude: -73.9700 }, // Southeast, inside
      { latitude: 40.7820, longitude: -73.9720 }, // Outside perimeter  
      { latitude: 40.7835, longitude: -73.9725 }, // Outside perimeter
      { latitude: 40.7831, longitude: -73.9712 }, // Back to center
    ],
    durations: [2000, 3000, 3000, 3000, 2000],
    description: 'Times Square perimeter validation test'
  })
}

// Export singleton
export const locationSimulator = new LocationSimulator()

// Development helper functions
export const simulatorUtils = {
  /**
   * Convert coordinates to a more readable format
   */
  formatCoords(coord: LocationCoordinates): string {
    return `${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`
  },

  /**
   * Calculate distance in meters between two points
   */
  distanceInMeters(coord1: LocationCoordinates, coord2: LocationCoordinates): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180
    const dLng = (coord2.longitude - coord1.longitude) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  },

  /**
   * Generate coordinates in a circle around a center point
   */
  generateCirclePoints(center: LocationCoordinates, radiusMeters: number, numPoints: number = 8): LocationCoordinates[] {
    const points: LocationCoordinates[] = []
    const radiusInDegrees = radiusMeters / 111320 // Approximate conversion to degrees
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI
      const lat = center.latitude + radiusInDegrees * Math.cos(angle)
      const lng = center.longitude + radiusInDegrees * Math.sin(angle) / Math.cos(center.latitude * Math.PI / 180)
      points.push({ latitude: lat, longitude: lng })
    }
    
    return points
  },

  /**
   * Log perimeter information
   */
  logPerimeterInfo(): void {
    const perimeters = perimeterManager.getPerimeters()
    console.log('📋 Configured perimeters:')
    perimeters.forEach((p, index) => {
      console.log(`   ${index + 1}. Center: (${p.centerLatitude.toFixed(6)}, ${p.centerLongitude.toFixed(6)}), Radius: ${p.radiusInMeters}m`)
    })
  }
}
