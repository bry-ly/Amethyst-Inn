import { NextRequest, NextResponse } from 'next/server'

const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

export async function GET(request: NextRequest) {
  // Get query parameters from the request
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  
  // Build the target URL with query parameters
  const target = `${backend.replace(/\/$/, '')}/api/rooms${queryString ? `?${queryString}` : ''}`

  try {
    console.log('Proxying GET request to:', target)
    const res = await fetch(target)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Backend fetch error:', err)
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
    
    // Validate required fields
    const requiredFields = ['number', 'type', 'pricePerNight', 'capacity']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Validate capacity structure
    if (!body.capacity.adults || body.capacity.adults < 1) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Adult capacity must be at least 1' 
        },
        { status: 400 }
      )
    }

    const target = `${backend.replace(/\/$/, '')}/api/rooms`
    
    console.log('Proxying POST request to:', target)
    console.log('Request body:', body)
    
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if available
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
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
