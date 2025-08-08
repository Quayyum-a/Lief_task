# API Documentation

This document describes the key APIs and services used in the HealthShift application.

## Location Services API

### LocationService Class

The core location service handles all GPS-related operations.

```typescript
// lib/location.ts
class LocationService {
  // Check if geolocation is supported
  isSupported(): boolean

  // Get current position once
  getCurrentPosition(options?: PositionOptions): Promise<LocationCoordinates>

  // Start continuous location watching
  startWatching(
    onLocationChange: (location: LocationCoordinates) => void,
    onError?: (error: LocationError) => void,
    options?: LocationWatchOptions
  ): boolean

  // Stop location watching
  stopWatching(): void

  // Calculate distance between two points (Haversine formula)
  calculateDistance(point1, point2): number

  // Check if location is within perimeter
  isWithinPerimeter(location, perimeter): boolean

  // Request location permission
  requestPermission(): Promise<'granted' | 'denied' | 'prompt'>
}
```

### Location Hook

React hook for easy location integration in components.

```typescript
// hooks/useLocation.ts
const {
  location,           // Current location coordinates
  error,             // Location error if any
  loading,           // Loading state
  permissionState,   // Permission status
  isSupported,       // Browser support
  requestLocation,   // Manual location request
  requestPermission, // Permission request
  startWatching,     // Start location tracking
  stopWatching,      // Stop location tracking
  isWatching,        // Watching status
  isWithinPerimeter  // Perimeter check function
} = useLocation(options)
```

## Perimeter Management API

### PerimeterManager Class

Handles work area perimeter validation and management.

```typescript
// lib/perimeter.ts
class PerimeterManager {
  // Set available perimeters
  setPerimeters(perimeters: PerimeterSettings[]): void

  // Check if location is within any perimeter
  checkLocation(location, options?): PerimeterResult

  // Get closest perimeter to location
  getClosestPerimeter(location): { perimeter, distance }

  // Validate clock operation at location
  validateClockOperation(location, operation): { allowed, message, perimeter }

  // Get perimeter entry/exit notifications
  getPerimeterNotification(previousLocation, currentLocation): NotificationResult
}
```

### Perimeter Types

```typescript
interface PerimeterSettings {
  centerLatitude: number
  centerLongitude: number
  radiusInMeters: number
  name?: string
}

interface PerimeterResult {
  isWithin: boolean
  distance: number
  perimeter: PerimeterSettings | null
  message: string
}
```

## Clock Operations API

### ClockManager Class

Manages all clock in/out operations with location validation.

```typescript
// lib/clock.ts
class ClockManager {
  // Clock in a user
  async clockIn(
    userId: string,
    location: LocationCoordinates,
    note?: string,
    options?: PerimeterValidationOptions
  ): Promise<ClockOperationResult>

  // Clock out a user
  async clockOut(
    userId: string,
    location: LocationCoordinates,
    note?: string,
    options?: PerimeterValidationOptions
  ): Promise<ClockOperationResult>

  // Get active shift for user
  getActiveShift(userId: string): ActiveShift | null

  // Get all active shifts (managers)
  getAllActiveShifts(): ActiveShift[]

  // Check if user is clocked in
  isUserClockedIn(userId: string): boolean

  // Get current shift duration
  getCurrentShiftDuration(userId: string): DurationResult | null

  // Force clock out (managers only)
  async forceClockOut(userId, managerUserId, reason): Promise<ClockOperationResult>
}
```

### Clock Types

```typescript
interface ClockEvent {
  id: string
  userId: string
  type: 'clock_in' | 'clock_out'
  timestamp: string
  location: LocationCoordinates
  note?: string
  perimeterId?: string
  validationData: {
    isLocationValid: boolean
    distanceFromCenter: number
    accuracy: number
    message: string
  }
}

interface ActiveShift {
  id: string
  userId: string
  clockIn: ClockEvent
  clockOut?: ClockEvent
  status: 'active' | 'completed'
  totalHours?: number
  createdAt: string
  updatedAt: string
}
```

## Notification Services API

### NotificationService Class

Handles location-based notifications and alerts.

```typescript
// lib/notifications.ts
class NotificationService {
  // Initialize notification service
  async initialize(options?): Promise<boolean>

  // Add notification listener
  addListener(callback): () => void

  // Process location update for notifications
  processLocationUpdate(location): LocationNotification[]

  // Send manual notification
  sendNotification(type, title, message, location?, data?): LocationNotification

  // Send specific notification types
  sendClockInReminder(location, perimeterName?): void
  sendClockOutReminder(location, perimeterName?): void

  // Get notification history
  getNotifications(limit?): LocationNotification[]

  // Update notification settings
  updateOptions(options): void
}
```

### Notification Types

```typescript
interface LocationNotification {
  id: string
  type: 'perimeter_entry' | 'perimeter_exit' | 'shift_reminder' | 'accuracy_warning'
  title: string
  message: string
  timestamp: number
  location?: LocationCoordinates
  data?: Record<string, any>
}

interface NotificationOptions {
  enableSound?: boolean
  enableVibration?: boolean
  persistentReminders?: boolean
  accuracyThreshold?: number
}
```

## Authentication API

### NextAuth Configuration

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    // Email provider when configured
  ],
  callbacks: {
    async session({ session, user }) {
      // Add user ID and role to session
      session.user.id = user.id
      session.user.role = (user as any).role || 'worker'
      return session
    },
    async signIn({ user }) {
      // Auto-assign manager role based on email
      if (user.email?.includes('manager')) {
        // Update user role to manager
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
}
```

## Context API

### ShiftContext

Global state management for shift-related data.

```typescript
// context/ShiftContext.tsx
interface ShiftContextType {
  // State
  currentUser: User | null
  currentShift: Shift | null
  geolocation: GeolocationState
  allStaff: StaffMember[]
  perimeters: Perimeter[]
  dashboardStats: DashboardStats
  isClockingIn: boolean
  isClockingOut: boolean
  isLoading: boolean

  // Actions
  clockIn: (note?: string) => Promise<void>
  clockOut: (note?: string) => Promise<void>
  setPerimeter: (perimeter: Omit<Perimeter, 'id' | 'createdAt'>) => Promise<void>
  refreshData: () => Promise<void>
}
```

## Environment Variables

The application uses the DevServerControl tool for secure environment variable management:

```bash
# Google OAuth (required)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth (auto-generated in development)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database (SQLite for development)
DATABASE_URL="file:./dev.db"
```

## Error Handling

### Location Errors

```typescript
interface LocationError {
  code: number
  message: string
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED'
}
```

### Clock Operation Errors

```typescript
interface ClockOperationResult {
  success: boolean
  message: string
  shift?: ActiveShift
  event?: ClockEvent
  error?: 'ALREADY_CLOCKED_IN' | 'NOT_CLOCKED_IN' | 'LOCATION_INVALID' | 'SYSTEM_ERROR'
}
```

## Rate Limiting & Performance

- **Location updates**: Maximum once per 30 seconds for battery optimization
- **Notification throttling**: Prevents spam notifications
- **Data refresh**: Automatic refresh every 30 seconds for real-time updates
- **Mock data generation**: Simulated for development performance

## Security Considerations

- **Location data**: Only stored temporarily for validation
- **Authentication**: Secure OAuth flow with role-based access
- **Environment variables**: Managed through secure DevServerControl
- **Input validation**: All user inputs validated and sanitized
- **HTTPS required**: For production location services
