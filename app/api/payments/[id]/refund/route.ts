import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { backendApi } from '@/lib/origin'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const token = (await cookies()).get('auth_token')?.value || req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return Response.json({ message: 'Not authenticated' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const refundUrl = backendApi(`payments/${id}/refund`)
    
    const res = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (err) {
    return Response.json(
      { message: 'Failed to process refund', error: String(err) },
      { status: 500 }
    )
  }
}
