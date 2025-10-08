import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getBackendBase() {
  return (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '')
}

export async function GET(request: Request) {
  const backend = getBackendBase()
  const target = `${backend}/api/reservations`

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

export async function POST(request: Request) {
  const backend = getBackendBase()
  const target = `${backend}/api/reservations`

  try {
    // Get the FormData from the request
    const formData = await request.formData()
  const auth = request.headers.get('authorization') || undefined
  const cookieToken = (await cookies()).get('auth_token')?.value
    
  const headers: Record<string, string> = {}
  if (auth) headers['authorization'] = auth
  else if (cookieToken) headers['authorization'] = `Bearer ${cookieToken}`
    // Note: Don't set Content-Type for FormData, browser will set it with boundary

    const res = await fetch(target, { 
      method: 'POST', 
      headers, 
      body: formData  // Send FormData directly
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
