import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
  const target = `${backend.replace(/\/$/, '')}/api/auth/register`

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
    return NextResponse.json({ error: 'Failed to proxy to backend', detail: String(err) }, { status: 502 })
  }
}










