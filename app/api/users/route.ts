import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { backendApi } from '@/lib/origin'

export async function GET(request: Request) {
  const target = backendApi('users')

  try {
    const auth = request.headers.get('authorization') || undefined
    const cookieToken = (await cookies()).get('auth_token')?.value
    const headers: Record<string, string> = {}
    if (auth) headers['authorization'] = auth
    else if (cookieToken) headers['authorization'] = `Bearer ${cookieToken}`

    const res = await fetch(target, { headers })
    const text = await res.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: res.status })
    } catch (e) {
      return new Response(text, { status: res.status })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to proxy to backend', detail: String(err) }, { status: 502 })
  }
}
