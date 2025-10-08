import { NextResponse } from 'next/server'

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
  const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
  const baseUrl = `${backend.replace(/\/$/, '')}`

  try {
    const authHeader = request.headers.get('authorization') || undefined
    const commonHeaders: Record<string, string> = {}
    if (authHeader) {
      commonHeaders['authorization'] = authHeader
    }

    const response = await fetch(`${baseUrl}/api/dashboard/summary`, {
      headers: commonHeaders,
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || `Dashboard summary failed: ${response.status}`)
    }

    const summary = await response.json()

    if (!summary?.success) {
      throw new Error(summary?.message || "Dashboard summary error")
    }

    return NextResponse.json(summary.data)
  } catch (err) {
    console.error('Dashboard API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', detail: String(err) },
      { status: 502 }
    )
  }
}
