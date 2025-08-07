'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  sub: string
  name: string
  email: string
  picture?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error?: Error
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for auth token (demo implementation)
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
    
    if (token) {
      // Mock user data for demo
      setUser({
        sub: 'demo-user-123',
        name: 'Demo User',
        email: window.location.pathname.includes('manager') ? 'manager@example.com' : 'worker@example.com',
        picture: undefined
      })
    }
    
    setIsLoading(false)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useUser() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider')
  }
  return context
}
