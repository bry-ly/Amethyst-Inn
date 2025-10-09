import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { backendApi } from '@/lib/origin'

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const target = backendApi(`users/${id}`)
  try {
    const auth = request.headers.get('authorization') || undefined
    const cookieToken = (await cookies()).get('auth_token')?.value
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (auth) headers['authorization'] = auth
    else if (cookieToken) headers['authorization'] = `Bearer ${cookieToken}`
    const res = await fetch(target, { method: 'DELETE', headers })
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

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const target = backendApi(`users/${id}`)
  try {
    const body = await request.text()
    const auth = request.headers.get('authorization') || undefined
    const cookieToken = (await cookies()).get('auth_token')?.value
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (auth) headers['authorization'] = auth
    else if (cookieToken) headers['authorization'] = `Bearer ${cookieToken}`
    const res = await fetch(target, { method: 'PUT', headers, body })
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


