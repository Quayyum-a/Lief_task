import { locationService, LocationCoordinates, PerimeterSettings } from './location'

export interface PerimeterResult {
  isWithin: boolean
  distance: number
  perimeter: PerimeterSettings | null
  message: string
}

export interface PerimeterValidationOptions {
  allowBuffer?: number // Additional buffer in meters for edge cases
  requireHighAccuracy?: boolean // Require location accuracy below threshold
  accuracyThreshold?: number // Maximum acceptable accuracy in meters
}

export class PerimeterManager {
  private perimeters: PerimeterSettings[] = []

  /**
   * Set the available perimeters for checking
   */
  setPerimeters(perimeters: PerimeterSettings[]): void {
    this.perimeters = perimeters
  }

  /**
   * Get all configured perimeters
   */
  getPerimeters(): PerimeterSettings[] {
    return [...this.perimeters]
  }

  /**
   * Check if location is within any perimeter
   */
  checkLocation(
    location: LocationCoordinates,
    options: PerimeterValidationOptions = {}
  ): PerimeterResult {
    const {
      allowBuffer = 0,
      requireHighAccuracy = true,
      accuracyThreshold = 50
    } = options

    // Check location accuracy if required
    if (requireHighAccuracy && location.accuracy && location.accuracy > accuracyThreshold) {
      return {
        isWithin: false,
        distance: Infinity,
        perimeter: null,
        message: `Location accuracy too low (±${location.accuracy.toFixed(0)}m). Please wait for better GPS signal.`
      }
    }

    if (this.perimeters.length === 0) {
      return {
        isWithin: false,
        distance: Infinity,
        perimeter: null,
        message: 'No work perimeters configured. Contact your manager.'
      }
    }

    // Find the closest perimeter
    let closestPerimeter: PerimeterSettings | null = null
    let shortestDistance = Infinity

    for (const perimeter of this.perimeters) {
      const distance = locationService.calculateDistance(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: perimeter.centerLatitude, longitude: perimeter.centerLongitude }
      )

      if (distance < shortestDistance) {
        shortestDistance = distance
        closestPerimeter = perimeter
      }
    }

    if (!closestPerimeter) {
      return {
        isWithin: false,
        distance: Infinity,
        perimeter: null,
        message: 'Unable to determine work location.'
      }
    }

    const effectiveRadius = closestPerimeter.radiusInMeters + allowBuffer
    const isWithin = shortestDistance <= effectiveRadius

    return {
      isWithin,
      distance: shortestDistance,
      perimeter: closestPerimeter,
      message: isWithin
        ? `Within work area (${shortestDistance.toFixed(0)}m from center)`
        : `Outside work area (${shortestDistance.toFixed(0)}m from center, max ${effectiveRadius}m allowed)`
    }
  }

  /**
   * Get the closest perimeter to a location
   */
  getClosestPerimeter(location: LocationCoordinates): {
    perimeter: PerimeterSettings | null
    distance: number
  } {
    if (this.perimeters.length === 0) {
      return { perimeter: null, distance: Infinity }
    }

    let closestPerimeter: PerimeterSettings | null = null
    let shortestDistance = Infinity

    for (const perimeter of this.perimeters) {
      const distance = locationService.calculateDistance(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: perimeter.centerLatitude, longitude: perimeter.centerLongitude }
      )

      if (distance < shortestDistance) {
        shortestDistance = distance
        closestPerimeter = perimeter
      }
    }

    return {
      perimeter: closestPerimeter,
      distance: shortestDistance
    }
  }

  /**
   * Calculate how far inside or outside a perimeter a location is
   */
  getPerimeterStatus(location: LocationCoordinates, perimeter: PerimeterSettings): {
    isInside: boolean
    distanceFromEdge: number
    distanceFromCenter: number
  } {
    const distanceFromCenter = locationService.calculateDistance(
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: perimeter.centerLatitude, longitude: perimeter.centerLongitude }
    )

    const isInside = distanceFromCenter <= perimeter.radiusInMeters
    const distanceFromEdge = perimeter.radiusInMeters - distanceFromCenter

    return {
      isInside,
      distanceFromEdge, // Positive = inside, negative = outside
      distanceFromCenter
    }
  }

  /**
   * Validate if a clock operation is allowed at the current location
   */
  validateClockOperation(
    location: LocationCoordinates,
    operation: 'clock_in' | 'clock_out',
    options: PerimeterValidationOptions = {}
  ): {
    allowed: boolean
    message: string
    perimeter: PerimeterSettings | null
  } {
    const result = this.checkLocation(location, options)

    // Clock in requires being within perimeter
    if (operation === 'clock_in') {
      return {
        allowed: result.isWithin,
        message: result.isWithin
          ? `Ready to clock in at ${result.perimeter?.name || 'work location'}`
          : result.message,
        perimeter: result.perimeter
      }
    }

    // Clock out can be done from anywhere (in case worker left perimeter during shift)
    if (operation === 'clock_out') {
      return {
        allowed: true,
        message: result.isWithin
          ? `Clocking out from ${result.perimeter?.name || 'work location'}`
          : 'Clocking out from outside work area',
        perimeter: result.perimeter
      }
    }

    return {
      allowed: false,
      message: 'Invalid operation',
      perimeter: null
    }
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  /**
   * Get perimeter entry/exit notifications
   */
  getPerimeterNotification(
    previousLocation: LocationCoordinates | null,
    currentLocation: LocationCoordinates
  ): {
    type: 'entered' | 'exited' | 'none'
    perimeter: PerimeterSettings | null
    message: string
  } | null {
    if (!previousLocation) return null

    const previousResult = this.checkLocation(previousLocation)
    const currentResult = this.checkLocation(currentLocation)

    // Entered perimeter
    if (!previousResult.isWithin && currentResult.isWithin) {
      return {
        type: 'entered',
        perimeter: currentResult.perimeter,
        message: `You've entered the ${currentResult.perimeter?.name || 'work area'}. You can now clock in.`
      }
    }

    // Exited perimeter
    if (previousResult.isWithin && !currentResult.isWithin) {
      return {
        type: 'exited',
        perimeter: previousResult.perimeter,
        message: `You've left the ${previousResult.perimeter?.name || 'work area'}. Don't forget to clock out if you're ending your shift.`
      }
    }

    return {
      type: 'none',
      perimeter: currentResult.perimeter,
      message: ''
    }
  }
}

// Export singleton instance
export const perimeterManager = new PerimeterManager()

// Default perimeter settings for development/demo
export const defaultPerimeters: PerimeterSettings[] = [
  {
    centerLatitude: 40.7831, // Times Square, NYC
    centerLongitude: -73.9712,
    radiusInMeters: 500, // 500 meter radius
  },
  {
    centerLatitude: 37.7749, // San Francisco
    centerLongitude: -122.4194,
    radiusInMeters: 1000, // 1km radius
  }
]
