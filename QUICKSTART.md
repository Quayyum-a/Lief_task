# 🏥 HealthShift - Quick Start Guide

## For Lief Interview Presentation

This application implements **all required features** from the Lief WebDev Engineer task.

### ✅ Features Implemented:

**Healthcare Workers Can:**
- Clock in/out with location validation
- Only clock in when within designated perimeter
- Add optional notes
- View current shift duration
- See location status

**Managers Can:**
- Set location perimeters (radius in km)
- See all clocked-in staff in real-time
- View complete clock in/out history
- Analytics dashboard with:
  - Average daily hours
  - Daily clock-in numbers  
  - Weekly hours per staff
  - Charts and trends

**Authentication:**
- Demo login ready (no Google OAuth setup needed)
- Role-based access (manager vs worker)
- Mobile and web responsive

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
./setup.sh
# OR manually:
# DATABASE_URL="file:./dev.db" npx prisma generate
# DATABASE_URL="file:./dev.db" npx prisma db push
```

### 3. Run Application
```bash
npm run dev
```

### 4. Open in Browser
Go to `http://localhost:3000`

## 🎯 Demo Login

**Worker Account:**
- Click "Sign in as Demo Worker"
- Access clock in/out interface

**Manager Account:**
- Click "Sign in as Demo Manager"  
- Access full management dashboard

## 📱 Mobile Testing

1. Open on mobile browser
2. Install as PWA (Add to Home Screen)
3. Test location permissions
4. Test clock in/out functionality

## 🔧 For Production

To enable Google OAuth:
1. Set up Google Cloud Console OAuth
2. Add credentials to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## 📊 Key Demo Points

1. **Location-based Validation** - Clock in only works within perimeter
2. **Real-time Tracking** - Manager sees live staff status
3. **Mobile-first Design** - Works perfectly on phones
4. **Professional UI** - Clean, healthcare-appropriate interface
5. **Complete Analytics** - Rich dashboard with charts
6. **PWA Ready** - Installable as mobile app

The application is **fully functional and presentation-ready**!
