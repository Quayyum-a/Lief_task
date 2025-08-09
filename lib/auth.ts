import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prismaServer as prisma } from './prisma-server'

// Build providers array conditionally
const providers = []

// Add demo credentials provider for development
if (process.env.NODE_ENV === 'development') {
  providers.push(
    CredentialsProvider({
      name: 'Demo Login',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@example.com' },
        role: { label: 'Role', type: 'select', options: ['worker', 'manager'] }
      },
      async authorize(credentials) {
        // This is for demo purposes only
        if (credentials?.email) {
          return {
            id: credentials.email === 'demo@manager.com' ? '1' : '2',
            email: credentials.email,
            name: credentials.email === 'demo@manager.com' ? 'Demo Manager' : 'Demo Worker',
            role: credentials.email === 'demo@manager.com' ? 'manager' : 'worker'
          }
        }
        return null
      },
    })
  )
}

// Add Google provider if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

// Add Email provider if SMTP is configured
if (
  process.env.EMAIL_SERVER_HOST &&
  process.env.EMAIL_SERVER_USER &&
  process.env.EMAIL_SERVER_PASSWORD
) {
  providers.push(
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
    })
  )
}

export const authOptions: NextAuthOptions = {
  // Use adapter only when not using credentials provider for demo
  ...(process.env.NODE_ENV !== 'development' && { adapter: PrismaAdapter(prisma) }),
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        // Add user ID and role to session from token
        session.user.id = token.id as string
        session.user.role = token.role as 'manager' | 'worker'
      }
      return session
    },
    async jwt({ token, user }) {
      // Persist the user data to the token right after signin
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role || (user.email?.includes('manager') ? 'manager' : 'worker')
      }
      return token
    },
    async signIn() {
      // For demo purposes, always allow sign in
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: process.env.NODE_ENV === 'development' ? 'jwt' : 'database',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
}
