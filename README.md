# HealthShift - Healthcare Worker Management System

A modern web application for healthcare organizations to manage worker shifts with location-based clock in/out functionality.

## 🏥 Overview

HealthShift is a Progressive Web App (PWA) that allows healthcare workers to clock in and out of their shifts while ensuring they are within designated work perimeters. Managers can monitor staff in real-time, set up work area boundaries, and analyze shift data through comprehensive dashboards.

## ✨ Key Features Implemented

### 🧑‍⚕️ For Healthcare Workers
- **Location-based Clock In/Out**: Workers can only clock in when within designated work perimeters
- **Real-time Location Tracking**: Continuous GPS monitoring with accuracy validation
- **Smart Notifications**: Automatic alerts when entering/leaving work areas
- **Shift Notes**: Optional notes when clocking in or out
- **Current Shift Tracking**: View ongoing shift duration and details
- **PWA Support**: Install on mobile devices for app-like experience

### 👨‍💼 For Managers
- **Staff Overview Dashboard**: Real-time monitoring of all staff members
- **Perimeter Management**: Create and configure work area boundaries
- **Location Monitoring**: See which staff are currently in work areas
- **Force Clock Out**: Emergency clock out capability for staff
- **Analytics Dashboard**: Comprehensive shift metrics and insights
- **Performance Tracking**: Staff hour tracking and performance metrics

### 🔧 Technical Features
- **Google OAuth Authentication**: Secure login with role-based access
- **Progressive Web App**: Offline capabilities and mobile installation
- **Real-time Location Services**: High-accuracy GPS with error handling
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Advanced Analytics**: Charts and graphs for shift data visualization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Google OAuth credentials (for authentication)
- Prisma Accelerate setup (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthshift
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```bash
   # Database Configuration
   # For local development (SQLite):
   DATABASE_URL_LOCAL="file:./dev.db"
   
   # For production (Prisma Accelerate):
   DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_ACTUAL_API_KEY"
   
   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-key-for-development"
   
   # Google OAuth (Optional for development)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # Environment
   NODE_ENV="development"
   ```

4. **Database setup**
   ```bash
   # Run the setup script
   ./setup.sh
   
   # OR manually:
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication pages
│   │   ├── signin/page.tsx       # Sign in page
│   │   ├── signup/page.tsx       # Sign up page
│   │   └── error/page.tsx        # Auth error page
│   ├── worker/page.tsx           # Worker dashboard
│   ├── manager/page.tsx          # Manager dashboard
│   ├── api/auth/[...nextauth]/   # NextAuth API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   │   ├── AuthProvider.tsx      # NextAuth provider wrapper
│   │   ├── LoginForm.tsx         # Login form component
│   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   ├── manager/                  # Manager-specific components
│   │   ├── AnalyticsDashboard.tsx   # Analytics and charts
│   │   ├── PerimeterManagement.tsx # Work area configuration
│   │   └── StaffOverview.tsx       # Real-time staff monitoring
│   ├── worker/                   # Worker-specific components
│   │   └── ClockInterface.tsx    # Clock in/out interface
│   └── shared/                   # Shared components
│       ├── LocationPermission.tsx   # Location access component
│       ├── NotificationDisplay.tsx  # Notification UI
│       └── PWAInstaller.tsx         # PWA installation prompt
├── context/                      # React context providers
│   └── ShiftContext.tsx          # Global shift state management
├── hooks/                        # Custom React hooks
│   └── useLocation.ts            # Location services hook
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── clock.ts                  # Clock operations manager
│   ├── location.ts               # Location services
│   ├── notifications.ts          # Notification system
│   └── perimeter.ts              # Perimeter validation logic
├── prisma/                       # Database configuration
│   └── schema.prisma             # Database schema
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Main type definitions
│   └── next-auth.d.ts            # NextAuth type extensions
└── public/                       # Static assets
    ├── manifest.json             # PWA manifest
    └── sw.js                     # Service worker
```

## 🔐 Authentication Setup

The application uses NextAuth with Google OAuth for authentication.

### Google OAuth Configuration

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.developers.google.com)
   - Create a new project or select existing one
   - Enable Google+ API or People API

2. **Create OAuth 2.0 Credentials**
   - Go to Credentials → Create Credentials → OAuth 2.0 Client ID
   - Choose "Web application"
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`

3. **Set Environment Variables**
   The app uses DevServerControl for secure environment variable management:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

### Role Assignment
- Emails containing "manager" → Manager access
- All other emails → Worker access

## ⚡ Prisma Accelerate Setup

### For Production Database Performance

HealthShift uses Prisma Accelerate for enhanced database performance and global caching.

#### 1. Setup Prisma Accelerate
1. **Visit Prisma Console**: Go to [https://console.prisma.io/](https://console.prisma.io/)
2. **Create/Select Project**: Create a new project or select existing one
3. **Enable Accelerate**: Enable Accelerate for your database
4. **Get Connection String**: Copy your Accelerate connection string

#### 2. Configure Environment Variables
```bash
# Production (Prisma Accelerate)
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=YOUR_ACTUAL_API_KEY"

# Development fallback (local SQLite)
DATABASE_URL_LOCAL="file:./dev.db"
```

#### 3. Test Accelerate Connection
```bash
# Test database connectivity and caching
npm run test-accelerate
```

### Accelerate Benefits:
- **Global Edge Caching**: Reduced latency worldwide
- **Connection Pooling**: Efficient database connections
- **Query Caching**: Automatic caching of frequently used queries
- **Performance Monitoring**: Built-in query performance insights

### Rollback Instructions
To switch back to local database:
1. **Update Environment Variable**:
   ```bash
   # In .env file, change:
   DATABASE_URL="file:./dev.db"
   # OR use the local fallback:
   DATABASE_URL="$DATABASE_URL_LOCAL"
   ```
2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```
3. **Push Schema** (if needed):
   ```bash
   npx prisma db push
   ```

## 📍 Location Services

### Core Location Features
- **Real-time GPS tracking** with high accuracy requirements
- **Permission management** with user-friendly prompts
- **Distance calculations** using Haversine formula
- **Perimeter validation** for work area enforcement
- **Automatic notifications** for perimeter entry/exit

### Location Service Architecture

```typescript
// Enhanced LocationService (lib/LocationService.ts) - NEW v2.4.0
- Singleton pattern with proper state management
- Smart permission handling with rate limiting
- Advanced caching and performance optimization
- Comprehensive error handling and recovery

// Legacy Location Service (lib/location.ts)
- Basic LocationService class for GPS operations
- Permission handling and error management
- Distance calculations and perimeter checking

// Location Hook (hooks/useLocation.ts)
- React hook for easy component integration
- Real-time location updates
- Permission state management

// Perimeter Manager (lib/perimeter.ts)
- Multiple work area support
- Validation logic for clock operations
- Distance-based perimeter checking
```

### 🆕 New LocationService API (v2.4.0)

The enhanced LocationService provides superior permission management and performance:

#### Key Features:
- **Smart Permission Management**: Prevents repeated permission requests
- **Automatic Rate Limiting**: Prevents browser permission dialog spam
- **Local Caching**: Stores permission state for better UX
- **Exponential Backoff**: Intelligent retry logic for failed requests
- **Singleton Pattern**: Consistent state across the application

#### Basic Usage:
```typescript
import { enhancedLocationService } from '@/lib/LocationService'

// Check and request location access (smart - won't spam user)
const hasAccess = await enhancedLocationService.ensureLocationAccess()

// Get current position
if (hasAccess) {
  const location = await enhancedLocationService.getCurrentPosition()
  console.log(location.latitude, location.longitude)
}

// Start watching location changes
const success = await enhancedLocationService.startWatching(
  (location) => console.log('New location:', location),
  (error) => console.error('Location error:', error)
)
```

#### Advanced Features:
```typescript
// Check if location is within perimeter
const isWithin = enhancedLocationService.isWithinPerimeter(currentLocation, {
  centerLatitude: 40.7128,
  centerLongitude: -74.0060,
  radiusInMeters: 100
})

// Calculate distance between points
const distance = enhancedLocationService.calculateDistance(
  { latitude: 40.7128, longitude: -74.0060 },
  { latitude: 40.7589, longitude: -73.9851 }
)

// Get cached permission status
const permissionStatus = enhancedLocationService.getPermissionStatus()

// Clear cache (for testing/reset)
enhancedLocationService.clearCache()
```

#### Configuration Options:
```typescript
const locationService = LocationService.getInstance({
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  maxRetryAttempts: 3,
  backoffMultiplier: 2000 // 2 seconds base
})
```

## 🎯 Clock In/Out System

### Clock Operations Flow
1. **Location Validation**: Check if user is within work perimeter
2. **Permission Verification**: Ensure location access is granted
3. **Accuracy Check**: Validate GPS accuracy meets requirements
4. **Clock Operation**: Record clock in/out with location data
5. **Shift Tracking**: Update active shift status

### Clock Manager Features
- **Active shift tracking** with duration calculation
- **Location logging** for each clock event
- **Note support** for additional context
- **Force clock out** capability for managers
- **Shift history** maintenance

## 📊 Analytics & Reporting

### Manager Analytics Include:
- **Daily/Weekly Trends**: Hour tracking over time
- **Staff Performance**: Individual and team metrics
- **Clock-in Patterns**: Peak hours and shift timing analysis
- **Department Breakdown**: Hours by department/area
- **Real-time Stats**: Current online and clocked-in staff

### Chart Types Implemented:
- Line charts for trend analysis
- Bar charts for pattern visualization
- Pie charts for department breakdown
- Progress indicators for performance metrics

## 🔔 Notification System

### Notification Types:
- **Perimeter Entry/Exit**: Automatic location-based alerts
- **Accuracy Warnings**: GPS signal quality notifications
- **Shift Reminders**: Clock in/out prompts
- **Browser Notifications**: System-level alerts with actions

### Notification Features:
- **Custom settings** for sound, vibration, persistence
- **Action buttons** for quick clock in/out
- **Notification history** with timestamps
- **Cross-platform support** for web and mobile

## 🗄️ Database Schema

### Core Models:
```prisma
User {
  id, email, name, role, image
  accounts, sessions, shifts
}

Shift {
  id, userId, clockIn, clockOut
  clockInLat, clockInLng, clockOutLat, clockOutLng
  clockInNote, clockOutNote, totalHours
  status, perimeterId
}

Perimeter {
  id, name, centerLat, centerLng, radiusKm
  createdBy, createdAt, updatedAt
}
```

## 🧪 Development Features

### Mock Data System
- Realistic staff data generation
- Simulated location tracking
- Sample shift patterns
- Test perimeter configurations

### Development Tools
- **Location simulation** for testing
- **Notification testing** without GPS
- **Role switching** for UI testing
- **Real-time updates** simulation

## 📱 Progressive Web App (PWA)

### PWA Features:
- **Installable** on mobile devices
- **Offline functionality** for core features
- **App-like experience** with native feel
- **Background sync** for data updates

### Mobile Optimizations:
- **Responsive design** for all screen sizes
- **Touch-friendly** interface elements
- **Mobile navigation** with bottom tabs
- **Gesture support** for common actions

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Library**: Ant Design with custom styling
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Prisma ORM with SQLite (development)
- **Charts**: Chart.js with react-chartjs-2
- **Styling**: Tailwind CSS
- **PWA**: next-pwa for service worker
- **Location**: Browser Geolocation API with custom utilities

## 🚦 Usage

### For Workers:
1. **Sign in** with Google account
2. **Grant location permission** when prompted
3. **Navigate to worker dashboard**
4. **Clock in** when within work perimeter
5. **Add optional notes** for shifts
6. **Clock out** when shift ends

### For Managers:
1. **Sign in** with manager account (email contains "manager")
2. **Set up work perimeters** in Location Management
3. **Monitor staff** in real-time through Staff Overview
4. **View analytics** and generate reports
5. **Force clock out** staff if needed

## 🔍 Features Implemented vs Requirements

✅ **Completed Features:**
- Location-based clock in/out with perimeter validation
- Manager perimeter configuration (within X km of location)
- Real-time staff monitoring and location tracking
- Analytics dashboard with metrics and trends
- Google OAuth authentication
- Progressive Web App functionality
- Automatic location-based notifications
- Force clock out capability
- Shift history and notes
- Mobile-responsive design

✅ **Technical Implementation:**
- Real-time location tracking
- Distance calculations and perimeter checking
- Cross-platform compatibility
- Error handling and edge cases
- Security best practices
- Performance optimizations

## 🐛 Known Limitations

- **Mock Data**: Uses simulated data for development/demo
- **Single Organization**: Currently designed for one organization
- **Offline Sync**: Limited offline functionality
- **Location Accuracy**: Dependent on device GPS capabilities

## 📈 Future Enhancements

- **Backend API**: Replace mock data with real database
- **Multi-organization**: Support multiple healthcare facilities
- **Advanced Analytics**: More detailed reporting features
- **Integration**: Connect with existing HR systems
- **Audit Logs**: Comprehensive activity tracking

---

**Built with ❤️ for healthcare workers and their managers**
