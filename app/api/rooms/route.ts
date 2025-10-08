import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  // Get query parameters from the request
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  
  // Build the target URL with query parameters
  const target = `${backend.replace(/\/$/, '')}/api/rooms${queryString ? `?${queryString}` : ''}`

  try {
    const cookieToken = (await cookies()).get('auth_token')?.value
    const res = await fetch(target, {
      cache: 'no-store',
      headers: {
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!,
        }),
        ...(!request.headers.get('authorization') && cookieToken ? {
          'Authorization': `Bearer ${cookieToken}`,
        } : {}),
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch rooms from backend', 
        detail: String(err) 
      },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields (accept either capacity or guestCapacity)
    const baseRequired = ['number', 'type', 'pricePerNight']
    const missingBase = baseRequired.filter(field => !body[field])

    const hasCapacity = !!body.capacity
    const hasGuestCapacity = typeof body.guestCapacity === 'number'

    if (missingBase.length > 0 || (!hasCapacity && !hasGuestCapacity)) {
      const missing = [...missingBase]
      if (!hasCapacity && !hasGuestCapacity) missing.push('capacity or guestCapacity')
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate capacity/guestCapacity structure
    if (hasGuestCapacity) {
      if (body.guestCapacity < 1) {
        return NextResponse.json(
          { success: false, error: 'Guest capacity must be at least 1' },
          { status: 400 }
        )
      }
    } else {
      if (!body.capacity.adults || body.capacity.adults < 1) {
        return NextResponse.json(
          { success: false, error: 'Adult capacity must be at least 1' },
          { status: 400 }
        )
      }
    }

    const target = `${backend.replace(/\/$/, '')}/api/rooms`
    
    console.log('Proxying POST request to:', target)
    console.log('Request body:', body)
    
    const cookieToken = (await cookies()).get('auth_token')?.value
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if available
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
        ...(!request.headers.get('authorization') && cookieToken ? {
          'Authorization': `Bearer ${cookieToken}`,
        } : {}),
      },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Backend POST error:', err)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create room', 
        detail: String(err) 
      },
      { status: 500 }
    )
  }
}
