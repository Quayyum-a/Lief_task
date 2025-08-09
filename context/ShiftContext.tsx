'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { message } from 'antd'
import { useLocation } from '@/hooks/useLocation'
import { perimeterManager, defaultPerimeters } from '@/lib/perimeter'
import { clockManager } from '@/lib/clock'
import { notificationService } from '@/lib/notifications'
import type {
  ShiftContextType,
  User,
  Shift,
  StaffMember,
  Perimeter,
  DashboardStats,
  GeolocationState,
  Location
} from '@/types'

// Initial state
const initialGeolocationState: GeolocationState = {
  location: null,
  isLoading: false,
  error: null,
  isInPerimeter: false,
}

const initialDashboardStats: DashboardStats = {
  averageHoursPerDay: 0,
  dailyClockIns: 0,
  totalActiveStaff: 0,
  weeklyHoursByStaff: [],
}

// Initialize perimeter manager with default perimeters
perimeterManager.setPerimeters(defaultPerimeters)

// Mock data for MVP
const mockPerimeters: Perimeter[] = [
  {
    id: '1',
    name: 'Main Hospital',
    centerLat: 40.7831, // Times Square
    centerLng: -73.9712,
    radiusKm: 0.5, // 500 meters
    createdBy: 'manager',
    createdAt: new Date().toISOString(),
  }
]

const mockStaff: StaffMember[] = [
  {
    id: '1',
    email: 'john.doe@hospital.com',
    name: 'John Doe',
    role: 'worker',
    isOnline: true,
    lastSeen: new Date().toISOString(),
  },
  {
    id: '2', 
    email: 'jane.smith@hospital.com',
    name: 'Jane Smith',
    role: 'worker',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
  }
]

// Context
const ShiftContext = createContext<ShiftContextType | undefined>(undefined)

// State management
interface State {
  currentUser: User | null
  currentShift: Shift | null
  geolocation: GeolocationState
  allStaff: StaffMember[]
  perimeters: Perimeter[]
  dashboardStats: DashboardStats
  isClockingIn: boolean
  isClockingOut: boolean
  isLoading: boolean
}

type Action = 
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CURRENT_SHIFT'; payload: Shift | null }
  | { type: 'SET_GEOLOCATION'; payload: Partial<GeolocationState> }
  | { type: 'SET_STAFF'; payload: StaffMember[] }
  | { type: 'SET_PERIMETERS'; payload: Perimeter[] }
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'SET_CLOCKING_IN'; payload: boolean }
  | { type: 'SET_CLOCKING_OUT'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }

function shiftReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload }
    case 'SET_CURRENT_SHIFT':
      return { ...state, currentShift: action.payload }
    case 'SET_GEOLOCATION':
      return { 
        ...state, 
        geolocation: { ...state.geolocation, ...action.payload }
      }
    case 'SET_STAFF':
      return { ...state, allStaff: action.payload }
    case 'SET_PERIMETERS':
      return { ...state, perimeters: action.payload }
    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload }
    case 'SET_CLOCKING_IN':
      return { ...state, isClockingIn: action.payload }
    case 'SET_CLOCKING_OUT':
      return { ...state, isClockingOut: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

// Utility functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function isWithinPerimeter(userLocation: Location, perimeter: Perimeter): boolean {
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    perimeter.centerLat,
    perimeter.centerLng
  )
  return distance <= perimeter.radiusKm
}

// Provider component
export function ShiftProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const {
    location,
    error: locationError,
    permissionState,
    isSupported
  } = useLocation({ watch: true })

  const [state, dispatch] = useReducer(shiftReducer, {
    currentUser: null,
    currentShift: null,
    geolocation: initialGeolocationState,
    allStaff: mockStaff,
    perimeters: mockPerimeters,
    dashboardStats: initialDashboardStats,
    isClockingIn: false,
    isClockingOut: false,
    isLoading: status === 'loading',
  })

  // Set user from NextAuth session and sync with clock manager
  useEffect(() => {
    if (session?.user) {
      const currentUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: session.user.role,
        picture: session.user.image || undefined,
      }
      dispatch({ type: 'SET_USER', payload: currentUser })

      // Initialize notification service
      notificationService.initialize()

      // Check if user has an active shift
      const activeShift = clockManager.getActiveShift(session.user.id)
      if (activeShift) {
        const shift: Shift = {
          id: activeShift.id,
          userId: activeShift.userId,
          clockIn: {
            id: activeShift.clockIn.id,
            userId: activeShift.clockIn.userId,
            type: 'clock_in' as const,
            timestamp: activeShift.clockIn.timestamp,
            location: activeShift.clockIn.location,
            note: activeShift.clockIn.note,
            perimeterId: activeShift.clockIn.perimeterId,
          },
          status: 'active',
        }
        dispatch({ type: 'SET_CURRENT_SHIFT', payload: shift })
      }
    } else {
      dispatch({ type: 'SET_USER', payload: null })
      dispatch({ type: 'SET_CURRENT_SHIFT', payload: null })
    }
    dispatch({ type: 'SET_LOADING', payload: status === 'loading' })
  }, [session, status])

  // Update geolocation state when location changes
  useEffect(() => {
    if (!state.currentUser) return

    if (!isSupported) {
      dispatch({
        type: 'SET_GEOLOCATION',
        payload: {
          isLoading: false,
          error: 'Geolocation is not supported by this browser.'
        }
      })
      return
    }

    if (locationError) {
      dispatch({
        type: 'SET_GEOLOCATION',
        payload: {
          isLoading: false,
          error: locationError.message
        }
      })
      return
    }

    if (location) {
      // Check if within any perimeter using new perimeter manager
      const perimeterResult = perimeterManager.checkLocation(location)
      const nearestPerimeter = perimeterResult.perimeter

      // Process location for notifications
      notificationService.processLocationUpdate(location)

      dispatch({
        type: 'SET_GEOLOCATION',
        payload: {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
          },
          isLoading: false,
          error: null,
          isInPerimeter: perimeterResult.isWithin,
          nearestPerimeter: nearestPerimeter ? {
            id: '1',
            name: 'Main Work Area',
            centerLat: nearestPerimeter.centerLatitude,
            centerLng: nearestPerimeter.centerLongitude,
            radiusKm: nearestPerimeter.radiusInMeters / 1000,
            createdBy: 'manager',
            createdAt: new Date().toISOString(),
          } : undefined,
        }
      })
    } else if (permissionState === 'granted') {
      dispatch({
        type: 'SET_GEOLOCATION',
        payload: { isLoading: true }
      })
    }
  }, [state.currentUser, location, locationError, permissionState, isSupported])

  // Actions
  const clockIn = async (note?: string) => {
    if (!state.currentUser || !state.geolocation.location) {
      message.error('Location information is required to clock in')
      return
    }

    dispatch({ type: 'SET_CLOCKING_IN', payload: true })

    try {
      const result = await clockManager.clockIn(
        state.currentUser.id,
        state.geolocation.location,
        note
      )

      if (result.success) {
        // Convert clock manager shift to our shift format
        const newShift: Shift = {
          id: result.shift!.id,
          userId: result.shift!.userId,
          clockIn: {
            id: result.shift!.clockIn.id,
            userId: result.shift!.clockIn.userId,
            type: 'clock_in' as const,
            timestamp: result.shift!.clockIn.timestamp,
            location: result.shift!.clockIn.location,
            note: result.shift!.clockIn.note,
            perimeterId: result.shift!.clockIn.perimeterId,
          },
          status: 'active',
        }

        dispatch({ type: 'SET_CURRENT_SHIFT', payload: newShift })
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.error('Failed to clock in. Please try again.')
    } finally {
      dispatch({ type: 'SET_CLOCKING_IN', payload: false })
    }
  }

  const clockOut = async (note?: string) => {
    if (!state.currentUser || !state.geolocation.location) {
      message.error('Location information is required to clock out')
      return
    }

    if (!state.currentShift) {
      message.error('You are not currently clocked in')
      return
    }

    dispatch({ type: 'SET_CLOCKING_OUT', payload: true })

    try {
      const result = await clockManager.clockOut(
        state.currentUser.id,
        state.geolocation.location,
        note
      )

      if (result.success) {
        dispatch({ type: 'SET_CURRENT_SHIFT', payload: null })
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch (error) {
      message.error('Failed to clock out. Please try again.')
    } finally {
      dispatch({ type: 'SET_CLOCKING_OUT', payload: false })
    }
  }

  const setPerimeter = async (perimeter: Omit<Perimeter, 'id' | 'createdAt'>) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const newPerimeter: Perimeter = {
        ...perimeter,
        id: `perimeter_${Date.now()}`,
        createdAt: new Date().toISOString(),
      }

      // Update perimeter manager
      const perimeterSettings = {
        centerLatitude: newPerimeter.centerLat,
        centerLongitude: newPerimeter.centerLng,
        radiusInMeters: newPerimeter.radiusKm * 1000,
        name: newPerimeter.name
      }

      perimeterManager.setPerimeters([perimeterSettings])

      dispatch({
        type: 'SET_PERIMETERS',
        payload: [newPerimeter, ...state.perimeters]
      })
      message.success('Perimeter updated successfully!')
    } catch (error) {
      message.error('Failed to update perimeter.')
    }
  }

  const refreshData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update dashboard stats with mock data
      const stats: DashboardStats = {
        averageHoursPerDay: 8.2,
        dailyClockIns: 12,
        totalActiveStaff: state.allStaff.filter(s => s.isOnline).length,
        weeklyHoursByStaff: state.allStaff.map(staff => ({
          userId: staff.id,
          name: staff.name,
          totalHours: Math.random() * 40 + 20, // Mock hours
        })),
      }
      
      dispatch({ type: 'SET_DASHBOARD_STATS', payload: stats })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  const contextValue: ShiftContextType = {
    ...state,
    clockIn,
    clockOut,
    setPerimeter,
    refreshData,
  }

  return (
    <ShiftContext.Provider value={contextValue}>
      {children}
    </ShiftContext.Provider>
  )
}

// Hook to use the context
export function useShift() {
  const context = useContext(ShiftContext)
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider')
  }
  return context
}
