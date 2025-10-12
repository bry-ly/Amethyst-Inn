import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { backendApi } from '@/lib/origin'

export async function PUT(request: Request) {
  // Try to get token from Authorization header first, then from cookies
  const authHeader = request.headers.get('authorization')
  const cookieToken = (await cookies()).get('auth_token')?.value
  const token = authHeader?.replace('Bearer ', '') || cookieToken
  
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const body = await request.json()
    const backendUpdate = backendApi('users/me/password')
    
    const res = await fetch(backendUpdate, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
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
    return NextResponse.json({ error: 'Failed to change password', detail: String(err) }, { status: 502 })
  }
}
