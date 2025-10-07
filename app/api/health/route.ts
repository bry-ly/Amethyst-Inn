import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
  const target = `${backend.replace(/\/$/, '')}/api/health`

  try {
    console.log('Proxying health check to:', target)
    const res = await fetch(target)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Backend health check error:', err)
    return NextResponse.json(
      { 
        success: false,
        error: 'Backend server is not running', 
        detail: String(err) 
      },
      { status: 503 }
    )
  }
}

