import { NextRequest, NextResponse } from 'next/server'

const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const target = `${backend.replace(/\/$/, '')}/api/rooms/${encodeURIComponent(id)}`
  try {
    const res = await fetch(target, {
      cache: 'no-store',
      headers: {
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!,
        }),
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch room from backend',
        detail: String(err),
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const target = `${backend.replace(/\/$/, '')}/api/rooms/${encodeURIComponent(id)}`

  try {
    const body = await request.json()
    const res = await fetch(target, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!,
        }),
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update room on backend',
        detail: String(err),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const target = `${backend.replace(/\/$/, '')}/api/rooms/${encodeURIComponent(id)}`

  try {
    const res = await fetch(target, {
      method: 'DELETE',
      headers: {
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!,
        }),
      },
    })

    const text = await res.text()
    const contentType = res.headers.get('content-type') || ''
    const payload = contentType.includes('application/json') ? JSON.parse(text || '{}') : { message: text }

    return NextResponse.json(payload, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete room on backend',
        detail: String(err),
      },
      { status: 500 }
    )
  }
}
