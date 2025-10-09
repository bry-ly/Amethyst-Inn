import { NextResponse } from 'next/server'
import { backendApi } from '@/lib/origin'

export async function POST(request: Request) {
  const target = backendApi('auth/login')

  try {
    const body = await request.text()
    const res = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    })

    const text = await res.text()
    try {
      const data = JSON.parse(text)
      const response = NextResponse.json(data, { status: res.status })
      if (res.ok && data?.token) {
        const isSecure = process.env.NODE_ENV === 'production'
        response.cookies.set('auth_token', data.token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isSecure,
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
        })
      }
      return response
    } catch {
      return new Response(text, { status: res.status })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to login', detail: String(err) }, { status: 502 })
  }
}

















