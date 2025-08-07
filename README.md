# HealthShift - Healthcare Worker Management System

A comprehensive web application for healthcare workers to clock in and out of their shifts, with **real Google OAuth and email authentication**, location validation, and manager oversight.

## 🚀 Features

### 🔐 **Real Authentication:**
- **Google OAuth** - Sign in with your Google account
- **Magic Link Email** - Secure passwordless email authentication
- **Role-based Access** - Automatic role assignment based on email
- **Session Management** - Secure session handling with NextAuth.js

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
- **NextAuth.js** for real authentication (Google OAuth + Email)
- **Prisma** with SQLite database (production-ready)
- **Ant Design** for UI components
- **Tailwind CSS** for responsive styling
- **Chart.js** for data visualization
- **React Context** for state management
- **PWA** with service worker support
- **Geolocation API** for location services

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd healthshift
npm install
```

### 2. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 3. Environment Configuration

Create a `.env.local` file:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth Configuration  
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Email Configuration (for magic links)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Database URL
DATABASE_URL="file:./dev.db"
```

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

### 5. Set Up Email Authentication

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_SERVER_PASSWORD`

### 6. Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Add the output to `NEXTAUTH_SECRET` in `.env.local`

### 7. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔐 Authentication Flow

### Sign In Options:
1. **Google OAuth** - One-click sign in with Google account
2. **Magic Link Email** - Passwordless authentication via email

### Role Assignment:
- **Manager Access**: Emails containing "manager" → Full dashboard access
- **Worker Access**: All other emails → Clock in/out interface

### Security Features:
- Secure session management with NextAuth.js
- Database-stored sessions
- Automatic role detection
- Protected routes based on authentication status

## 📱 Mobile Features

- **Responsive Design** - Works on all screen sizes
- **Bottom Navigation** - Easy thumb navigation on mobile
- **Touch Optimized** - Large touch targets and gestures
- **PWA Support** - Install on home screen
- **Offline Capability** - Basic functionality without internet

## 🎯 Key Features Implemented

### ✅ **Real Authentication**
- Google OAuth integration
- Magic link email authentication
- Secure session management
- Role-based access control

### ✅ **Location Management**
- 2km radius perimeter validation
- Real-time GPS tracking
- Automatic in/out detection
- Location history tracking

### ✅ **Analytics Dashboard**
- Real-time staff status
- Weekly hours tracking
- Attendance trends
- Performance metrics

### ✅ **Mobile Experience**
- Mobile-first responsive design
- Bottom tab navigation
- Touch-friendly interface
- PWA installation support

## 🔧 Production Deployment

### 1. Database Setup (PostgreSQL recommended)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/healthshift"
```

### 2. Environment Variables
Update `.env.production`:
```env
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
# ... other production configs
```

### 3. Deploy to Vercel/Netlify
```bash
npm run build
# Deploy using your preferred platform
```

### 4. Update Google OAuth
Add production callback URL to Google Console:
```
https://yourdomain.com/api/auth/callback/google
```

## 📈 Database Schema

The application uses Prisma with the following models:

- **User** - Authentication and profile data
- **Account** - OAuth account linking
- **Session** - Active user sessions
- **Shift** - Clock in/out records
- **Perimeter** - Location boundaries

## 🛡️ Security Features

- **OAuth 2.0** integration with Google
- **CSRF protection** via NextAuth.js
- **Secure session cookies** with HTTP-only flags
- **Environment variable** protection for secrets
- **Role-based access** control throughout the app

## 🌟 Future Enhancements

- Multiple OAuth providers (GitHub, LinkedIn)
- Push notifications for shift reminders
- Advanced reporting and analytics
- Shift scheduling system
- Time off request management
- Payroll integration
- Multi-tenant support

## 📱 PWA Features

- **Offline functionality** for basic operations
- **Home screen installation** on mobile devices
- **Push notifications** (coming soon)
- **Background sync** for data synchronization

## 🔒 Privacy & Data Protection

- Minimal data collection
- Secure authentication flows
- Location data processed client-side
- GDPR-compliant user management

## 📞 Support

For questions or support regarding authentication setup or deployment, please reach out.

---

Built with ❤️ for healthcare workers using modern authentication and security best practices.
