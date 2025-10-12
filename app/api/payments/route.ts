import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { backendApi } from '@/lib/origin'

export async function GET(request: Request) {
  // Try to get token from Authorization header first, then from cookies
  const authHeader = request.headers.get('authorization')
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get('auth_token')?.value
  const token = authHeader?.replace('Bearer ', '') || cookieToken
  
  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }

  // Get query parameters
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  // Build query string
  const queryParams = new URLSearchParams()
  if (status) queryParams.append('status', status)
  if (page) queryParams.append('page', page)
  if (limit) queryParams.append('limit', limit)
  
  const queryString = queryParams.toString()
  const paymentsUrl = backendApi(`payments${queryString ? `?${queryString}` : ''}`)

  try {
    const res = await fetch(paymentsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
    return NextResponse.json(
      { message: 'Failed to fetch payments', error: String(err) },
      { status: 502 }
    )
  }
}
