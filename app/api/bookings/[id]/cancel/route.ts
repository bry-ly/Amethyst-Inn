import { NextResponse } from 'next/server'

function getBackendBase() {
  return (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '')
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const backend = getBackendBase()
  const target = `${backend}/api/bookings/${id}/cancel`

  try {
    const body = await request.text()
    const auth = request.headers.get('authorization') || undefined
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (auth) headers['authorization'] = auth

    const res = await fetch(target, { 
      method: 'PUT', 
      headers,
      body: body || JSON.stringify({})
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
