import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' })
  
  // Clear the auth token cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0, // Expire immediately
  })
  
  return response
}
