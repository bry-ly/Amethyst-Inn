import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { backendApi } from '@/lib/origin'

interface RoomSummary {
  status?: string
  [key: string]: unknown
}

interface BookingSummary {
  status?: string
  totalAmount?: number
  createdAt?: string
  checkInDate?: string
  [key: string]: unknown
}

interface UserSummary {
  role?: string
  [key: string]: unknown
}

interface Metrics {
  totalRevenue: number
  monthlyRevenue: number
  totalBookings: number
  activeBookings: number
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  maintenanceRooms: number
  occupancyRate: number
  totalUsers: number
  guestUsers: number
  staffUsers: number
}

interface ChartDataPoint {
  date: string
  bookings: number
  revenue: number
}

interface DashboardData {
  metrics: Metrics
  chartData: ChartDataPoint[]
}

const isRoomArray = (value: unknown): value is RoomSummary[] => Array.isArray(value)
const isBookingArray = (value: unknown): value is BookingSummary[] => Array.isArray(value)
const isUserArray = (value: unknown): value is UserSummary[] => Array.isArray(value)

export async function GET(request: Request) {
  // Build the correct endpoint once (avoid former /api/api duplication)
  const endpoint = backendApi('dashboard/summary')

  try {
    const authHeader = request.headers.get('authorization') || undefined
    const cookieToken = (await cookies()).get('auth_token')?.value
    const headers: Record<string, string> = {}
    if (authHeader) headers['authorization'] = authHeader
    else if (cookieToken) headers['authorization'] = `Bearer ${cookieToken}`

    const res = await fetch(endpoint, { headers, cache: 'no-store' })

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Upstream dashboard fetch failed', detail: text || res.statusText }, { status: 502 })
    }

    const json = await res.json()
    if (!json?.success || !json.data) {
      return NextResponse.json({ error: 'Malformed dashboard response', detail: json?.message || null }, { status: 502 })
    }
    return NextResponse.json(json.data, { status: 200 })
  } catch (err) {
    console.error('Dashboard API error:', err)
    return NextResponse.json({ error: 'Failed to fetch dashboard data', detail: String(err) }, { status: 502 })
  }
}
