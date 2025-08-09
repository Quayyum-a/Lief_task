export interface User {
  id: string
  email: string
  name: string
  role: 'manager' | 'worker'
  picture?: string
}

export interface Location {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp: number
}

export interface Perimeter {
  id: string
  name: string
  centerLat: number
  centerLng: number
  radiusKm: number
  createdBy: string
  createdAt: string
  description?: string
}

export interface ClockEvent {
  id: string
  userId: string
  type: 'clock_in' | 'clock_out'
  timestamp: string
  location: Location
  note?: string
  perimeterId?: string
}

export interface Shift {
  id: string
  userId: string
  clockIn: ClockEvent
  clockOut?: ClockEvent
  totalHours?: number
  status: 'active' | 'completed'
}

export interface StaffMember extends User {
  currentShift?: Shift
  isOnline: boolean
  lastSeen: string
}

export interface DashboardStats {
  averageHoursPerDay: number
  dailyClockIns: number
  totalActiveStaff: number
  weeklyHoursByStaff: Array<{
    userId: string
    name: string
    totalHours: number
  }>
}

export interface GeolocationState {
  location: Location | null
  isLoading: boolean
  error: string | null
  isInPerimeter: boolean
  nearestPerimeter?: Perimeter
}

export interface ShiftContextType {
  // Current user state
  currentUser: User | null
  currentShift: Shift | null
  
  // Geolocation state
  geolocation: GeolocationState
  
  // Manager data
  allStaff: StaffMember[]
  perimeters: Perimeter[]
  dashboardStats: DashboardStats
  
  // Actions
  clockIn: (note?: string) => Promise<void>
  clockOut: (note?: string) => Promise<void>
  setPerimeter: (perimeter: Omit<Perimeter, 'id' | 'createdAt'>) => Promise<void>
  refreshData: () => Promise<void>
  
  // Loading states
  isClockingIn: boolean
  isClockingOut: boolean
  isLoading: boolean
}

export interface LocationPermissionStatus {
  granted: boolean
  denied: boolean
  prompt: boolean
}
