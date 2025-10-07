import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Try to get token from Authorization header first, then from cookies
  const authHeader = request.headers.get('authorization')
  const cookieToken = (await cookies()).get('auth_token')?.value
  const token = authHeader?.replace('Bearer ', '') || cookieToken
  
  if (!token) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  const backend = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '')
  try {
    const res = await fetch(`${backend}/api/auth/me`, {
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
    return NextResponse.json({ error: 'Failed to proxy to backend', detail: String(err) }, { status: 502 })
  }
}



