import { NextResponse } from 'next/server'

// Simple endpoint to acknowledge cookie consent preference.
// You could extend this later to persist in a database or analytics suppression list.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { consent?: boolean }
    // (Optional) persist body.consent somewhere.
    return NextResponse.json({ success: true, consent: body.consent ?? null })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 400 })
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 0