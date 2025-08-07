# HealthShift - Healthcare Worker Management System

A comprehensive web application for healthcare workers to clock in and out of their shifts, with location validation and manager oversight.

## 🚀 Features

### For Healthcare Workers:
- **Location-based Clock In/Out** - Only clock in within designated perimeters
- **Real-time Location Tracking** - Automatic perimeter detection
- **Mobile-First Design** - Touch-friendly interface optimized for mobile
- **Shift Management** - Track current shift duration and notes
- **PWA Support** - Install as a home screen app for quick access

### For Managers:
- **Staff Overview Dashboard** - Real-time staff status and locations
- **Analytics & Reports** - Charts showing attendance and performance
- **Location Perimeter Management** - Set geographic boundaries (2km radius)
- **Comprehensive Tracking** - Clock-in/out history with locations and notes

## 🛠 Tech Stack

- **Next.js 15** with TypeScript and App Router
- **Ant Design** for UI components
- **Tailwind CSS** for responsive styling
- **Chart.js** for data visualization
- **React Context** for state management
- **PWA** with service worker support
- **Geolocation API** for location services

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file (Auth0 setup for production):
```env
AUTH0_SECRET='your-secret-key'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Demo Login
- **Worker Access**: Click "Demo Worker Login" 
- **Manager Access**: Click "Demo Manager Login"

## 📱 Mobile Features

- **Responsive Design** - Works on all screen sizes
- **Bottom Navigation** - Easy thumb navigation on mobile
- **Touch Optimized** - Large touch targets and gestures
- **PWA Support** - Install on home screen
- **Offline Capability** - Basic functionality without internet

## 🎯 Key Features Implemented

### ✅ Location Management
- 2km radius perimeter validation
- Real-time GPS tracking
- Automatic in/out detection
- Location history tracking

### ✅ Authentication & Security
- Demo authentication system
- Role-based access (worker/manager)
- Protected routes and data
- Secure session management

### ✅ Analytics Dashboard
- Real-time staff status
- Weekly hours tracking
- Attendance trends
- Performance metrics

### ✅ Mobile Experience
- Mobile-first responsive design
- Bottom tab navigation
- Touch-friendly interface
- PWA installation support

## 🔧 Production Setup

For production deployment:

1. Set up Auth0 application
2. Configure environment variables
3. Deploy to Vercel/Netlify
4. Enable HTTPS for geolocation
5. Configure domain settings

## 📊 Dashboard Features

### Manager Dashboard:
- Staff overview table
- Real-time analytics charts
- Location perimeter management
- Attendance tracking

### Worker Interface:
- Clock in/out buttons
- Current shift timer
- Location status indicator
- Optional shift notes

## 🌟 Future Enhancements

- Real Auth0 integration
- Database integration
- Push notifications
- Shift scheduling
- Time off requests
- Payroll integration

## 🔒 Security Notes

- Location data is processed client-side
- Demo authentication for MVP
- Role-based access control
- Secure API endpoints

## 📞 Support

For questions or support, contact: career@lief.care

---

Built with ❤️ for healthcare workers
