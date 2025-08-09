import { LocationCoordinates } from './location'
import { perimeterManager, PerimeterValidationOptions } from './perimeter'

export interface ClockEvent {
  id: string
  userId: string
  type: 'clock_in' | 'clock_out'
  timestamp: string
  location: LocationCoordinates
  note?: string
  perimeterId?: string
  perimeterName?: string
  validationData: {
    isLocationValid: boolean
    distanceFromCenter: number
    accuracy: number
    message: string
  }
}

export interface ActiveShift {
  id: string
  userId: string
  clockIn: ClockEvent
  clockOut?: ClockEvent
  status: 'active' | 'completed'
  totalHours?: number
  createdAt: string
  updatedAt: string
}

export interface ClockOperationResult {
  success: boolean
  message: string
  shift?: ActiveShift
  event?: ClockEvent
  error?: string
}

export class ClockManager {
  private activeShifts: Map<string, ActiveShift> = new Map()
  private shiftHistory: ClockEvent[] = []

  /**
   * Attempt to clock in a user
   */
  async clockIn(
    userId: string,
    location: LocationCoordinates,
    note?: string,
    options: PerimeterValidationOptions = {}
  ): Promise<ClockOperationResult> {
    try {
      // Check if user already has an active shift
      const existingShift = this.activeShifts.get(userId)
      if (existingShift) {
        return {
          success: false,
          message: 'You are already clocked in. Please clock out first.',
          error: 'ALREADY_CLOCKED_IN'
        }
      }

      // Validate location
      const validation = perimeterManager.validateClockOperation(location, 'clock_in', options)
      if (!validation.allowed) {
        return {
          success: false,
          message: validation.message,
          error: 'LOCATION_INVALID'
        }
      }

      // Create clock in event
      const clockInEvent: ClockEvent = {
        id: `clock_in_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'clock_in',
        timestamp: new Date().toISOString(),
        location,
        note: note?.trim() || undefined,
        perimeterId: validation.perimeter?.centerLatitude + ',' + validation.perimeter?.centerLongitude,
        perimeterName: validation.perimeter?.name || 'Work Location',
        validationData: {
          isLocationValid: true,
          distanceFromCenter: perimeterManager.getClosestPerimeter(location).distance,
          accuracy: location.accuracy || 0,
          message: validation.message
        }
      }

      // Create active shift
      const shift: ActiveShift = {
        id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        clockIn: clockInEvent,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Store the shift
      this.activeShifts.set(userId, shift)
      this.shiftHistory.push(clockInEvent)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        success: true,
        message: `Successfully clocked in at ${validation.perimeter?.name || 'work location'}`,
        shift,
        event: clockInEvent
      }
    } catch {
      return {
        success: false,
        message: 'Failed to clock in. Please try again.',
        error: 'SYSTEM_ERROR'
      }
    }
  }

  /**
   * Attempt to clock out a user
   */
  async clockOut(
    userId: string,
    location: LocationCoordinates,
    note?: string,
    options: PerimeterValidationOptions = {}
  ): Promise<ClockOperationResult> {
    try {
      // Check if user has an active shift
      const activeShift = this.activeShifts.get(userId)
      if (!activeShift) {
        return {
          success: false,
          message: 'You are not currently clocked in.',
          error: 'NOT_CLOCKED_IN'
        }
      }

      // Validate location (clock out is more lenient)
      const validation = perimeterManager.validateClockOperation(location, 'clock_out', options)

      // Create clock out event
      const clockOutEvent: ClockEvent = {
        id: `clock_out_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'clock_out',
        timestamp: new Date().toISOString(),
        location,
        note: note?.trim() || undefined,
        perimeterId: validation.perimeter?.centerLatitude + ',' + validation.perimeter?.centerLongitude,
        perimeterName: validation.perimeter?.name || 'Unknown Location',
        validationData: {
          isLocationValid: validation.allowed,
          distanceFromCenter: perimeterManager.getClosestPerimeter(location).distance,
          accuracy: location.accuracy || 0,
          message: validation.message
        }
      }

      // Calculate total hours
      const clockInTime = new Date(activeShift.clockIn.timestamp)
      const clockOutTime = new Date(clockOutEvent.timestamp)
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

      // Update shift
      const completedShift: ActiveShift = {
        ...activeShift,
        clockOut: clockOutEvent,
        status: 'completed',
        totalHours,
        updatedAt: new Date().toISOString()
      }

      // Remove from active shifts and add to history
      this.activeShifts.delete(userId)
      this.shiftHistory.push(clockOutEvent)

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        success: true,
        message: `Successfully clocked out. Total time: ${totalHours.toFixed(2)} hours`,
        shift: completedShift,
        event: clockOutEvent
      }
    } catch {
      return {
        success: false,
        message: 'Failed to clock out. Please try again.',
        error: 'SYSTEM_ERROR'
      }
    }
  }

  /**
   * Get active shift for a user
   */
  getActiveShift(userId: string): ActiveShift | null {
    return this.activeShifts.get(userId) || null
  }

  /**
   * Get all active shifts (for managers)
   */
  getAllActiveShifts(): ActiveShift[] {
    return Array.from(this.activeShifts.values())
  }

  /**
   * Get shift history for a user
   */
  getUserShiftHistory(userId: string, limit: number = 50): ClockEvent[] {
    return this.shiftHistory
      .filter(event => event.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Get all shift history (for managers)
   */
  getAllShiftHistory(limit: number = 100): ClockEvent[] {
    return this.shiftHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Check if user is currently clocked in
   */
  isUserClockedIn(userId: string): boolean {
    return this.activeShifts.has(userId)
  }

  /**
   * Get current shift duration for a user
   */
  getCurrentShiftDuration(userId: string): {
    hours: number
    minutes: number
    totalMinutes: number
  } | null {
    const shift = this.activeShifts.get(userId)
    if (!shift) return null

    const startTime = new Date(shift.clockIn.timestamp)
    const currentTime = new Date()
    const diffMs = currentTime.getTime() - startTime.getTime()
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return {
      hours,
      minutes,
      totalMinutes
    }
  }

  /**
   * Force clock out a user (for managers)
   */
  async forceClockOut(
    userId: string,
    managerUserId: string,
    reason: string
  ): Promise<ClockOperationResult> {
    const activeShift = this.activeShifts.get(userId)
    if (!activeShift) {
      return {
        success: false,
        message: 'User is not currently clocked in.',
        error: 'NOT_CLOCKED_IN'
      }
    }

    // Use last known location or a default
    const location: LocationCoordinates = {
      latitude: 0,
      longitude: 0,
      accuracy: 0,
      timestamp: Date.now()
    }

    return this.clockOut(userId, location, `Force clock out by manager: ${reason}`)
  }

  /**
   * Clear all data (for development/testing)
   */
  clearAllData(): void {
    this.activeShifts.clear()
    this.shiftHistory = []
  }
}

// Export singleton instance
export const clockManager = new ClockManager()
