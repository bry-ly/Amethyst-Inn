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

export async function GET() {
  const backend = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'
  const baseUrl = `${backend.replace(/\/$/, '')}/api`

  try {
    // Fetch data from multiple endpoints in parallel
    const [roomsRes, bookingsRes, usersRes] = await Promise.all([
      fetch(`${baseUrl}/rooms`),
      fetch(`${baseUrl}/bookings`),
      fetch(`${baseUrl}/users`)
    ])

    const [roomsRaw, bookingsRaw, usersRaw] = await Promise.all([
      roomsRes.json(),
      bookingsRes.json(),
      usersRes.json()
    ])

    const rooms = isRoomArray(roomsRaw) ? roomsRaw : []
    const bookings = isBookingArray(bookingsRaw) ? bookingsRaw : []
    const users = isUserArray(usersRaw) ? usersRaw : []

    // Calculate dashboard metrics
    const totalRooms = rooms.length
    const availableRooms = rooms.filter(room => room.status === 'available').length
    const occupiedRooms = rooms.filter(room => room.status === 'occupied').length
    const maintenanceRooms = rooms.filter(room => room.status === 'maintenance').length

    const totalBookings = bookings.length
    const activeBookings = bookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'checked-in'
    ).length

    const totalUsers = users.length
    const guestUsers = users.filter(user => user.role === 'guest').length
    const staffUsers = users.filter(user => user.role === 'staff').length

    // Calculate revenue from bookings
    let totalRevenue = 0
    let monthlyRevenue = 0
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    if (bookings.length > 0) {
      bookings.forEach(booking => {
        if (typeof booking.totalAmount === 'number') {
          totalRevenue += booking.totalAmount
          
          // Check if booking is from current month
          const bookingDate = new Date(booking.createdAt ?? booking.checkInDate ?? '')
          if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
            monthlyRevenue += booking.totalAmount
          }
        }
      })
    }

    // Calculate occupancy rate
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0

    // Generate chart data for the last 30 days
    const chartData = []
    const today = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // Count bookings for this date
      const dayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt ?? booking.checkInDate ?? '')
        return bookingDate.toISOString().split('T')[0] === dateStr
      }).length
      
      // Count revenue for this date
      const dayRevenue = bookings
        .filter(booking => {
          const bookingDate = new Date(booking.createdAt ?? booking.checkInDate ?? '')
          return bookingDate.toISOString().split('T')[0] === dateStr
        })
        .reduce((sum: number, booking) => sum + (booking.totalAmount ?? 0), 0)

      chartData.push({
        date: dateStr,
        bookings: dayBookings,
        revenue: dayRevenue
      })
    }

    const dashboardData: DashboardData = {
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        totalBookings,
        activeBookings,
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        totalUsers,
        guestUsers,
        staffUsers
      },
      chartData
    }

    return NextResponse.json(dashboardData)
  } catch (err) {
    console.error('Dashboard API error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', detail: String(err) },
      { status: 502 }
    )
  }
}
