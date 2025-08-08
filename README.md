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
   ```bash
   # The app uses DevServerControl tool for environment variables
   # Google OAuth credentials are set through the admin interface
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
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

## 📍 Location Services

### Core Location Features
- **Real-time GPS tracking** with high accuracy requirements
- **Permission management** with user-friendly prompts
- **Distance calculations** using Haversine formula
- **Perimeter validation** for work area enforcement
- **Automatic notifications** for perimeter entry/exit

### Location Service Architecture

```typescript
// Location Service (lib/location.ts)
- LocationService class for GPS operations
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
