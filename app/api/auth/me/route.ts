import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { backendApi } from '@/lib/origin'

export async function GET(request: Request) {
  // Try to get token from Authorization header first, then from cookies
  const authHeader = request.headers.get('authorization')
  const cookieToken = (await cookies()).get('auth_token')?.value
  const token = authHeader?.replace('Bearer ', '') || cookieToken
  
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  const backendMe = backendApi('auth/me')
  try {
    const res = await fetch(backendMe, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const text = await res.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: res.status })
    } catch {
      return new Response(text, { status: res.status })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to get user profile', detail: String(err) }, { status: 502 })
  }
}



