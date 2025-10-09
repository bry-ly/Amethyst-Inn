import { NextResponse } from 'next/server'
import { backendApi } from '@/lib/origin'

export async function GET() {
  const target = backendApi('health')
  try {
    const res = await fetch(target, { cache: 'no-store' })
    const text = await res.text()
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data, { status: res.status })
    } catch {
      return new NextResponse(text, { status: res.status })
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Backend unreachable', detail: String(err) }, { status: 503 })
  }
}

