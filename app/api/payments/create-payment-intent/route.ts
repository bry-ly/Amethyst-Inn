import { NextRequest, NextResponse } from 'next/server'

const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const target = `${backend.replace(/\/$/, '')}/api/payments/create-payment-intent`

    const res = await fetch(target, {
      method: 'POST',
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
      { success: false, error: 'Failed to create payment intent', detail: String(err) },
      { status: 500 }
    )
  }
}
