# Google OAuth Setup Guide

To enable real Google authentication in HealthShift, follow these steps:

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.developers.google.com)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or People API)

## 2. Create OAuth 2.0 Credentials

1. Go to **Credentials** in the sidebar
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Configure the consent screen:
   - Application name: "HealthShift"
   - User support email: Your email
   - Developer contact: Your email
4. Choose **Web application** as application type
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

## 3. Get Your Credentials

1. Copy the **Client ID** and **Client Secret**
2. Update your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## 4. Restart Development Server

```bash
npm run dev
```

## 5. Test Authentication

1. Visit `http://localhost:3000`
2. Click "Sign in with Google"
3. You should see the Google OAuth consent screen

## Troubleshooting

### Common Issues:

1. **"Error 400: redirect_uri_mismatch"**
   - Make sure the redirect URI in Google Console exactly matches: `http://localhost:3000/api/auth/callback/google`

2. **"This app isn't verified"**
   - This is normal during development
   - Click "Advanced" → "Go to HealthShift (unsafe)" for testing

3. **"Access blocked"**
   - Make sure you've enabled the Google+ API or People API
   - Check that your OAuth consent screen is configured

### Production Setup:

For production deployment:
1. Add your production domain to authorized origins
2. Update redirect URI to use HTTPS
3. Submit app for verification if needed
4. Set production environment variables

## Environment Variables Reference

```env
# Required for Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Required for NextAuth
NEXTAUTH_URL=http://localhost:3000  # Change to your domain in production
NEXTAUTH_SECRET=your-secret-key     # Generate with: openssl rand -base64 32

# Database
DATABASE_URL="file:./dev.db"        # SQLite for development
```

## Security Notes

- Never commit your `.env.local` file to version control
- Use different credentials for development and production
- Regularly rotate your client secret
- Monitor usage in Google Cloud Console

Once configured, users will be able to sign in with their Google accounts and the application will automatically assign roles based on their email addresses.
