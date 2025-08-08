# Development Guide

This guide explains how to set up and work with the HealthShift codebase for development.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with location services support

### Initial Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd healthshift
   npm install
   ```

2. **Environment Configuration**
   The application uses DevServerControl for environment variables. No `.env` file setup required for basic development.

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Google OAuth Setup (Required for Authentication)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create new project: "HealthShift Development"
3. Enable APIs:
   - Google+ API (or People API)
   - Google Sign-In API

### 2. Configure OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Choose "External" for testing
3. Fill required fields:
   - Application name: "HealthShift Dev"
   - User support email: Your email
   - Developer contact: Your email

### 3. Create OAuth Credentials

1. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
2. Application type: "Web application"
3. Name: "HealthShift Development"
4. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### 4. Set Environment Variables

Use the DevServerControl tool in the application to set:
- `GOOGLE_CLIENT_ID`: Your client ID
- `GOOGLE_CLIENT_SECRET`: Your client secret

## Project Structure Explained

### Key Directories

```
app/                     # Next.js 13+ App Router
├── auth/               # Authentication pages and flows
├── worker/             # Worker-specific pages  
├── manager/            # Manager-specific pages
├── api/auth/           # NextAuth API routes
└── globals.css         # Global styles and Ant Design imports

components/             # React components organized by domain
├── auth/              # Authentication-related components
├── worker/            # Worker dashboard components
├── manager/           # Manager dashboard components
└── shared/            # Reusable components across roles

lib/                   # Utility libraries and business logic
├── auth.ts           # NextAuth configuration
├── location.ts       # Core location services
├── perimeter.ts      # Perimeter validation logic
├── clock.ts          # Clock in/out operations
└── notifications.ts  # Notification system

hooks/                 # Custom React hooks
└── useLocation.ts    # Location services hook

context/               # React Context providers
└── ShiftContext.tsx  # Global state management

types/                 # TypeScript type definitions
├── index.ts          # Main application types
└── next-auth.d.ts    # NextAuth type extensions
```

### Important Files

- **`app/layout.tsx`**: Root layout with providers and global configuration
- **`context/ShiftContext.tsx`**: Main state management for shifts and location
- **`lib/location.ts`**: Core location services with GPS handling
- **`lib/auth.ts`**: NextAuth configuration with role assignment
- **`prisma/schema.prisma`**: Database schema definition

## Development Workflow

### 1. Mock Data System

The application uses mock data for development to simulate real-world scenarios:

```typescript
// Mock staff data
const mockStaff = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@hospital.com',
    role: 'worker',
    isOnline: true,
  }
]

// Mock perimeters (Times Square for testing)
const defaultPerimeters = [
  {
    centerLatitude: 40.7831,
    centerLongitude: -73.9712,
    radiusInMeters: 500,
  }
]
```

### 2. Location Testing

For development without GPS access:

```typescript
// Override location in browser dev tools
navigator.geolocation.getCurrentPosition = (success) => {
  success({
    coords: {
      latitude: 40.7831,  // Times Square
      longitude: -73.9712,
      accuracy: 10
    }
  })
}
```

### 3. Role Testing

Test different user roles by using emails:
- **Manager Role**: Use any email containing "manager" (e.g., `manager@test.com`)
- **Worker Role**: Use any other email (e.g., `worker@test.com`)

### 4. Component Development

When creating new components:

1. **Follow existing patterns**:
   ```typescript
   'use client'
   
   import { useState } from 'react'
   import { Card, Button } from 'antd'
   import { useShift } from '@/context/ShiftContext'
   
   export default function MyComponent() {
     const { currentUser } = useShift()
     const [loading, setLoading] = useState(false)

     const handleAction = async () => {
       setLoading(true)
       try {
         // Component logic here
         console.log('Action performed')
       } finally {
         setLoading(false)
       }
     }

     return (
       <Card title="My Component">
         <div>
           <p>Welcome, {currentUser?.name}</p>
           <Button
             type="primary"
             loading={loading}
             onClick={handleAction}
           >
             Perform Action
           </Button>
         </div>
       </Card>
     )
   }
   ```

2. **Use TypeScript**: All components should be fully typed
3. **Follow naming conventions**: PascalCase for components, camelCase for functions
4. **Add error handling**: Always handle loading and error states

## Testing Strategies

### Manual Testing

1. **Authentication Flow**:
   - Test Google OAuth sign-in
   - Verify role assignment based on email
   - Check protected route access

2. **Location Services**:
   - Test permission request flow
   - Verify location accuracy requirements
   - Test perimeter entry/exit detection

3. **Clock Operations**:
   - Test clock in within/outside perimeter
   - Verify clock out functionality
   - Check shift duration calculations

4. **Manager Features**:
   - Test perimeter creation/editing
   - Verify staff monitoring dashboard
   - Check analytics data display

### Browser Testing

Test in multiple browsers:
- **Chrome**: Primary development browser
- **Safari**: iOS Safari for mobile testing
- **Firefox**: Alternative desktop browser
- **Edge**: Windows compatibility

### Mobile Testing

1. **Responsive Design**: Test all screen sizes
2. **Touch Interactions**: Verify touch-friendly interface
3. **PWA Installation**: Test app installation flow
4. **Location Services**: Test mobile GPS accuracy

## Common Development Tasks

### Adding a New Component

1. Create component file in appropriate directory
2. Follow existing patterns and TypeScript conventions
3. Add to relevant page or parent component
4. Test responsive design and accessibility

### Modifying Location Logic

1. **Location Service**: Modify `lib/location.ts`
2. **Perimeter Logic**: Update `lib/perimeter.ts`
3. **React Integration**: Adjust `hooks/useLocation.ts`
4. **Test thoroughly**: Location changes affect core functionality

### Adding New Analytics

1. **Data Generation**: Add to mock data in `AnalyticsDashboard.tsx`
2. **Chart Configuration**: Use Chart.js patterns
3. **Responsive Design**: Ensure charts work on mobile
4. **Performance**: Consider large dataset handling

### Database Schema Changes

1. **Modify Schema**: Update `prisma/schema.prisma`
2. **Generate Client**: Run `npx prisma generate`
3. **Push Changes**: Run `npx prisma db push`
4. **Update Types**: Adjust TypeScript interfaces

## Performance Optimization

### Location Services

- **Update Frequency**: Limit location updates to 30-second intervals
- **Accuracy Filtering**: Filter out low-accuracy readings
- **Battery Optimization**: Use appropriate location options

### React Performance

- **Memo Usage**: Use React.memo for expensive components
- **Context Splitting**: Keep context updates focused
- **Lazy Loading**: Implement for heavy components like charts

### Bundle Size

- **Tree Shaking**: Ensure unused code is eliminated
- **Chart.js**: Only import required chart types
- **Ant Design**: Use specific component imports

## Debugging Tips

### Location Issues

1. **Check Browser Support**: Verify geolocation API availability
2. **HTTPS Requirement**: Location services require HTTPS in production
3. **Permission State**: Debug using browser dev tools
4. **Accuracy Problems**: Test in different environments

### Authentication Problems

1. **Google OAuth Config**: Verify redirect URIs match exactly
2. **Environment Variables**: Check DevServerControl settings
3. **CORS Issues**: Ensure proper domain configuration
4. **Session Problems**: Clear browser data and test fresh

### State Management Issues

1. **Context Updates**: Use React DevTools to track state changes
2. **Mock Data**: Verify mock data generation is working
3. **Memory Leaks**: Check for proper cleanup in useEffect
4. **Race Conditions**: Ensure proper async handling

## Build and Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Variables for Production

Set these through your deployment platform:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`  
- `NEXTAUTH_URL` (your production domain)
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `DATABASE_URL` (production database connection)

### PWA Considerations

- **HTTPS Required**: PWA features require HTTPS
- **Service Worker**: Configured through next-pwa
- **Manifest**: Defined in `public/manifest.json`
- **Icons**: Ensure proper PWA icons are available

## Code Quality Standards

### TypeScript

- **Strict Mode**: Enabled in tsconfig.json
- **No Any Types**: Avoid `any`, use proper typing
- **Interface Exports**: Export interfaces for reusability
- **Type Guards**: Use type guards for runtime type checking

### Code Style

- **ESLint**: Configured with Next.js standards
- **Prettier**: Not configured but recommended
- **Imports**: Use absolute imports with `@/` prefix
- **Comments**: Add JSDoc for complex functions

### Git Workflow

- **Feature Branches**: Create branches for new features
- **Commit Messages**: Use descriptive commit messages
- **Small Commits**: Keep commits focused and atomic
- **Testing**: Test thoroughly before committing

---

This development guide should help you get started with the HealthShift codebase. For additional questions, refer to the main README.md or component documentation.
