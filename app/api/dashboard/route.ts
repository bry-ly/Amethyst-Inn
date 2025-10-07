import { NextResponse } from 'next/server'

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

    const [rooms, bookings, users] = await Promise.all([
      roomsRes.json(),
      bookingsRes.json(),
      usersRes.json()
    ])

    // Calculate dashboard metrics
    const totalRooms = Array.isArray(rooms) ? rooms.length : 0
    const availableRooms = Array.isArray(rooms) ? rooms.filter((room: any) => room.status === 'available').length : 0
    const occupiedRooms = Array.isArray(rooms) ? rooms.filter((room: any) => room.status === 'occupied').length : 0
    const maintenanceRooms = Array.isArray(rooms) ? rooms.filter((room: any) => room.status === 'maintenance').length : 0

    const totalBookings = Array.isArray(bookings) ? bookings.length : 0
    const activeBookings = Array.isArray(bookings) ? bookings.filter((booking: any) => 
      booking.status === 'confirmed' || booking.status === 'checked-in'
    ).length : 0

    const totalUsers = Array.isArray(users) ? users.length : 0
    const guestUsers = Array.isArray(users) ? users.filter((user: any) => user.role === 'guest').length : 0
    const staffUsers = Array.isArray(users) ? users.filter((user: any) => user.role === 'staff').length : 0

    // Calculate revenue from bookings
    let totalRevenue = 0
    let monthlyRevenue = 0
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    if (Array.isArray(bookings)) {
      bookings.forEach((booking: any) => {
        if (booking.totalAmount) {
          totalRevenue += booking.totalAmount
          
          // Check if booking is from current month
          const bookingDate = new Date(booking.createdAt || booking.checkInDate)
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
      const dayBookings = Array.isArray(bookings) ? bookings.filter((booking: any) => {
        const bookingDate = new Date(booking.createdAt || booking.checkInDate)
        return bookingDate.toISOString().split('T')[0] === dateStr
      }).length : 0
      
      // Count revenue for this date
      const dayRevenue = Array.isArray(bookings) ? bookings
        .filter((booking: any) => {
          const bookingDate = new Date(booking.createdAt || booking.checkInDate)
          return bookingDate.toISOString().split('T')[0] === dateStr
        })
        .reduce((sum: number, booking: any) => sum + (booking.totalAmount || 0), 0) : 0

      chartData.push({
        date: dateStr,
        bookings: dayBookings,
        revenue: dayRevenue
      })
    }

    const dashboardData = {
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
