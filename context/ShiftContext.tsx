'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useUser } from '@/context/AuthContext'
import { message } from 'antd'
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

// Mock data for MVP
const mockPerimeters: Perimeter[] = [
  {
    id: '1',
    name: 'Main Hospital',
    centerLat: 40.7128,
    centerLng: -74.0060,
    radiusKm: 2,
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
  const { user, isLoading: authLoading } = useUser()
  
  const [state, dispatch] = useReducer(shiftReducer, {
    currentUser: null,
    currentShift: null,
    geolocation: initialGeolocationState,
    allStaff: mockStaff,
    perimeters: mockPerimeters,
    dashboardStats: initialDashboardStats,
    isClockingIn: false,
    isClockingOut: false,
    isLoading: authLoading,
  })

  // Set user from Auth0
  useEffect(() => {
    if (user) {
      const currentUser: User = {
        id: user.sub || '',
        email: user.email || '',
        name: user.name || '',
        role: user.email?.includes('manager') ? 'manager' : 'worker',
        picture: user.picture,
      }
      dispatch({ type: 'SET_USER', payload: currentUser })
    } else {
      dispatch({ type: 'SET_USER', payload: null })
    }
    dispatch({ type: 'SET_LOADING', payload: authLoading })
  }, [user, authLoading])

  // Geolocation tracking
  useEffect(() => {
    if (!state.currentUser) return

    const watchLocation = () => {
      dispatch({ type: 'SET_GEOLOCATION', payload: { isLoading: true } })

      if (!navigator.geolocation) {
        dispatch({ 
          type: 'SET_GEOLOCATION', 
          payload: { 
            isLoading: false,
            error: 'Geolocation is not supported by this browser.' 
          }
        })
        return
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          }

          // Check if within any perimeter
          const nearestPerimeter = state.perimeters[0] // For MVP, use first perimeter
          const isInPerimeter = nearestPerimeter ? 
            isWithinPerimeter(location, nearestPerimeter) : false

          dispatch({ 
            type: 'SET_GEOLOCATION', 
            payload: { 
              location,
              isLoading: false,
              error: null,
              isInPerimeter,
              nearestPerimeter: isInPerimeter ? nearestPerimeter : undefined,
            }
          })
        },
        (error) => {
          dispatch({ 
            type: 'SET_GEOLOCATION', 
            payload: { 
              isLoading: false,
              error: error.message 
            }
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }

    const cleanup = watchLocation()
    return cleanup
  }, [state.currentUser, state.perimeters])

  // Actions
  const clockIn = async (note?: string) => {
    if (!state.currentUser || !state.geolocation.location) return

    if (!state.geolocation.isInPerimeter) {
      message.error('You must be within the designated perimeter to clock in')
      return
    }

    dispatch({ type: 'SET_CLOCKING_IN', payload: true })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const clockInEvent = {
        id: `clock_in_${Date.now()}`,
        userId: state.currentUser.id,
        type: 'clock_in' as const,
        timestamp: new Date().toISOString(),
        location: state.geolocation.location,
        note,
        perimeterId: state.geolocation.nearestPerimeter?.id,
      }

      const newShift: Shift = {
        id: `shift_${Date.now()}`,
        userId: state.currentUser.id,
        clockIn: clockInEvent,
        status: 'active',
      }

      dispatch({ type: 'SET_CURRENT_SHIFT', payload: newShift })
      message.success('Successfully clocked in!')
    } catch (error) {
      message.error('Failed to clock in. Please try again.')
    } finally {
      dispatch({ type: 'SET_CLOCKING_IN', payload: false })
    }
  }

  const clockOut = async (note?: string) => {
    if (!state.currentUser || !state.currentShift || !state.geolocation.location) return

    dispatch({ type: 'SET_CLOCKING_OUT', payload: true })

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const clockOutEvent = {
        id: `clock_out_${Date.now()}`,
        userId: state.currentUser.id,
        type: 'clock_out' as const,
        timestamp: new Date().toISOString(),
        location: state.geolocation.location,
        note,
      }

      const clockInTime = new Date(state.currentShift.clockIn.timestamp)
      const clockOutTime = new Date(clockOutEvent.timestamp)
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

      const updatedShift: Shift = {
        ...state.currentShift,
        clockOut: clockOutEvent,
        totalHours,
        status: 'completed',
      }

      dispatch({ type: 'SET_CURRENT_SHIFT', payload: null })
      message.success(`Successfully clocked out! Total hours: ${totalHours.toFixed(2)}`)
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
