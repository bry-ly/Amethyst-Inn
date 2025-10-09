import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { backendApi } from '@/lib/origin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

  const target = backendApi('payments/confirm')

    const cookieToken = (await cookies()).get('auth_token')?.value
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!,
        }),
        ...(!request.headers.get('authorization') && cookieToken ? {
          'Authorization': `Bearer ${cookieToken}`,
        } : {}),
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to confirm payment', detail: String(err) },
      { status: 500 }
    )
  }
}
