# Component Documentation

This document describes the key React components in the HealthShift application.

## Authentication Components

### AuthProvider
**Location**: `components/auth/AuthProvider.tsx`

Wrapper component that provides NextAuth session context to the entire application.

```typescript
<AuthProvider>
  {children}
</AuthProvider>
```

### LoginForm
**Location**: `components/auth/LoginForm.tsx`

Basic login form component with Google and email sign-in options. Redirects to role-appropriate dashboard after authentication.

**Features:**
- Google OAuth integration
- Email authentication (when configured)
- Role-based redirection
- Error handling for auth issues

### ProtectedRoute
**Location**: `components/auth/ProtectedRoute.tsx`

Route protection wrapper that ensures users are authenticated and have the required role.

```typescript
<ProtectedRoute requiredRole="worker" | "manager">
  {children}
</ProtectedRoute>
```

## Worker Components

### ClockInterface
**Location**: `components/worker/ClockInterface.tsx`

Main interface for healthcare workers to clock in and out of shifts.

**Features:**
- Real-time location status display
- Clock in/out buttons with validation
- Current shift timer
- Optional notes for clock events
- Location-based restrictions
- Notification display integration

**Props:** None (uses ShiftContext)

**Key Functions:**
- Location permission checking
- Perimeter validation before clock operations
- Real-time shift duration calculation
- Integration with notification system

## Manager Components

### PerimeterManagement
**Location**: `components/manager/PerimeterManagement.tsx`

Interface for managers to create and manage work area perimeters.

**Features:**
- Create/edit work area boundaries
- Real-time manager location display
- Distance calculation to perimeters
- Visual perimeter status indicators
- Form validation and guidelines

**Props:** None (uses ShiftContext and location hooks)

**Key Functions:**
- Perimeter CRUD operations
- Real-time location status
- Distance calculations
- Current location integration for perimeter setup

### StaffOverview
**Location**: `components/manager/StaffOverview.tsx`

Real-time dashboard for monitoring all staff members and their current status.

**Features:**
- Real-time staff location monitoring
- Clock in/out status tracking
- Force clock out capability
- Staff filtering and searching
- Detailed staff information modals
- Weekly hour summaries

**Props:** None (uses ShiftContext)

**Key Functions:**
- Staff status monitoring
- Location validation display
- Force clock out operations
- Staff performance tracking

### AnalyticsDashboard
**Location**: `components/manager/AnalyticsDashboard.tsx`

Comprehensive analytics dashboard with charts and metrics.

**Features:**
- Daily/weekly hour trends (Line charts)
- Clock-in patterns by hour (Bar charts)
- Department breakdown (Pie charts)
- Staff performance tables
- Key metrics statistics
- Date range filtering
- Export functionality

**Props:** None (uses ShiftContext)

**Dependencies:**
- Chart.js with react-chartjs-2
- dayjs for date handling
- Ant Design charts and tables

## Shared Components

### LocationPermission
**Location**: `components/shared/LocationPermission.tsx`

User-friendly component for requesting and managing location permissions.

**Features:**
- Permission state detection
- Clear permission request flow
- Error handling and troubleshooting
- Current location display
- Browser compatibility checking
- Mobile-friendly design

**Props:**
```typescript
interface LocationPermissionProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
  showCurrentLocation?: boolean
  title?: string
  description?: string
}
```

### NotificationDisplay
**Location**: `components/shared/NotificationDisplay.tsx`

Component for displaying location-based notifications and alerts.

**Features:**
- Real-time notification updates
- Notification history display
- Settings for sound/vibration
- Compact and full display modes
- Notification clearing
- Permission status display

**Props:**
```typescript
interface NotificationDisplayProps {
  maxItems?: number
  showSettings?: boolean
  compact?: boolean
}
```

### PWAInstaller
**Location**: `components/shared/PWAInstaller.tsx`

Component that prompts users to install the app as a PWA on mobile devices.

**Features:**
- Install prompt detection
- Mobile-specific installation UI
- Cross-browser compatibility
- Automatic prompt dismissal

## Page Components

### Worker Dashboard
**Location**: `app/worker/page.tsx`

Main page for healthcare workers with location permission flow and clock interface.

**Features:**
- Location permission checking
- Role-based protection
- Mobile navigation
- Header with user info and logout

### Manager Dashboard  
**Location**: `app/manager/page.tsx`

Tabbed interface for managers with all management tools.

**Features:**
- Tab navigation (Staff Overview, Analytics, Perimeters)
- Mobile drawer navigation
- Role-based protection
- Responsive design

**Tabs:**
- `overview`: Staff Overview dashboard
- `analytics`: Analytics Dashboard  
- `perimeters`: Perimeter Management

### Authentication Pages

#### Sign In Page
**Location**: `app/auth/signin/page.tsx`

Comprehensive sign-in page with multiple authentication options.

**Features:**
- Google OAuth integration
- Email authentication (when configured)
- Demo mode for development
- Role assignment information
- Link to sign-up page

#### Sign Up Page
**Location**: `app/auth/signup/page.tsx`

User registration page with same authentication methods as sign-in.

**Features:**
- Account creation flow
- Same authentication providers as sign-in
- Link back to sign-in page
- Account type explanations

## Component Patterns

### Location Integration Pattern

Most components that need location data follow this pattern:

```typescript
const { 
  location, 
  error, 
  permissionState,
  isSupported 
} = useLocation()

// Handle permission states
if (permissionState !== 'granted') {
  return <LocationPermission />
}

// Use location data
if (location) {
  // Component logic with location
}
```

### Context Usage Pattern

Components access global state through ShiftContext:

```typescript
const { 
  currentUser,
  currentShift,
  geolocation,
  clockIn,
  clockOut 
} = useShift()
```

### Error Handling Pattern

All components implement consistent error handling:

```typescript
if (error) {
  return (
    <Alert
      message="Error Title"
      description={error.message}
      type="error"
      showIcon
    />
  )
}
```

### Loading State Pattern

Components show loading states during async operations:

```typescript
if (loading) {
  return (
    <div className="text-center py-4">
      <Spin />
      <span className="ml-2">Loading...</span>
    </div>
  )
}
```

## Styling Conventions

### CSS Classes
- **Ant Design**: Primary UI library with custom theming
- **Tailwind CSS**: Utility classes for layout and spacing
- **Custom Classes**: Component-specific styles in globals.css

### Responsive Design
- **Mobile-first**: All components designed for mobile compatibility
- **Breakpoints**: Tailwind responsive utilities (sm:, md:, lg:)
- **Touch-friendly**: Large touch targets and mobile navigation

### Design System
- **Colors**: Consistent color palette for status indicators
- **Typography**: Ant Design typography with custom sizing
- **Spacing**: Tailwind spacing utilities for consistent gaps
- **Icons**: Ant Design icons throughout the application

## Performance Considerations

### Location Updates
- **Throttling**: Location updates limited to prevent excessive re-renders
- **Accuracy Checking**: GPS accuracy validation to prevent poor location data
- **Battery Optimization**: Configurable update intervals

### Chart Rendering
- **Lazy Loading**: Charts only render when visible
- **Data Optimization**: Efficient data structures for large datasets
- **Memory Management**: Proper cleanup of chart instances

### State Management
- **Context Optimization**: Selective context updates to prevent unnecessary re-renders
- **Local State**: Component-level state for UI-only data
- **Memoization**: React.memo and useMemo for expensive computations

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through interfaces
- **Keyboard Shortcuts**: Common shortcuts for frequent actions
- **Focus Management**: Proper focus handling in modals and forms

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Status Announcements**: Live regions for status updates
- **Semantic HTML**: Proper heading structure and landmarks

### Visual Accessibility
- **Color Contrast**: High contrast for all text and buttons
- **Icon Labels**: Text labels alongside icons
- **Size Options**: Configurable text and button sizes
