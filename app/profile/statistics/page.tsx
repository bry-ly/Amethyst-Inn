"use client"
import React from 'react'
import { UserSidebar } from '@/components/layout/user-sidebar'
import { UserSiteHeaderWrapper } from '@/components/layout/user-site-header-wrapper'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react'
import { IconCurrencyPeso } from '@tabler/icons-react'

export default function UserStatisticsPage() {
  const [stats, setStats] = React.useState({
    total: 0,
    confirmed: 0,
    completed: 0,
    totalSpent: 0,
  })

  React.useEffect(() => {
    document.title = "Amethyst Inn - My Statistics"
    
    // Load statistics
    const loadStats = async () => {
      try {
        const res = await fetch('/api/bookings', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const bookings = Array.isArray(data) ? data : data.data || []
          
          setStats({
            total: bookings.length,
            confirmed: bookings.filter((b: any) => 
              b.status === "confirmed" || b.status === "checked_in"
            ).length,
            completed: bookings.filter((b: any) => 
              b.status === "completed" || b.status === "checked_out"
            ).length,
            totalSpent: bookings.reduce((sum: number, b: any) => 
              sum + (b.totalPrice ?? 0), 0
            ),
          })
        }
      } catch (error) {
        console.error('Failed to load statistics:', error)
      }
    }
    
    loadStats()
  }, [])

  return (
    <div className="h-screen">
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <UserSidebar variant="inset" />
        <SidebarInset>
          <UserSiteHeaderWrapper />
          <div className="flex flex-1 flex-col h-full">
            <div className="@container/main flex flex-1 flex-col gap-2 h-full">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6 h-full">
                <h2 className="text-2xl font-bold">Booking Statistics</h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Bookings
                      </CardTitle>
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active/Confirmed
                      </CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completed
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Spent
                      </CardTitle>
                      <IconCurrencyPeso className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₱{stats.totalSpent.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
                
                {stats.total === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No statistics available</p>
                      <p className="text-sm text-muted-foreground">
                        Book a room to see your statistics
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
