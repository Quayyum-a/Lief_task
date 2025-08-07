import { NextRequest, NextResponse } from 'next/server'

// Simplified auth endpoint for MVP demo
export async function GET(
  request: NextRequest,
  { params }: { params: { auth0: string[] } }
) {
  const action = params.auth0[0]

  if (action === 'login') {
    // In a real app, this would redirect to Auth0
    // For demo, we'll redirect to a mock success page
    return NextResponse.redirect(new URL('/auth/callback?demo=true', request.url))
  }

  if (action === 'logout') {
    // Clear any auth cookies and redirect
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.delete('auth-token')
    return response
  }

  if (action === 'me') {
    // Return mock user data for demo
    return NextResponse.json({
      user: {
        sub: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
        picture: null
      }
    })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
