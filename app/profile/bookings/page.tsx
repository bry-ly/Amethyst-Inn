"use client"
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { UserSidebar } from '@/components/layout/user-sidebar'
import { UserSiteHeaderWrapper } from '@/components/layout/user-site-header-wrapper'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { AuthTokenManager } from "@/utils/cookies"
import { 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Ban,
  DollarSign,
  CalendarDays,
} from "lucide-react"

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "checked_in"
  | "checked_out"
  | "no_show"

type BookingGuestInfo = {
  adults?: number
  children?: number
}

type BookingRoomInfo = {
  number?: string
  title?: string
  name?: string
  type?: string
}

type BookingRecord = {
  _id: string
  status?: BookingStatus
  checkInDate?: string
  checkOutDate?: string
  startDate?: string
  endDate?: string
  from?: string
  to?: string
  checkIn?: string
  checkOut?: string
  room?: BookingRoomInfo
  guestCount?: number
  guests?: BookingGuestInfo
  totalPrice?: number
  price?: number
  specialRequests?: string
}

type BookingActionLoading = Record<string, boolean>

type CancellationResponse = {
  error?: string
  message?: string
  data?: {
    refundEligible?: boolean
    refundAmount?: number
  }
}

type BookingsApiResponse = {
  data?: BookingRecord[]
  bookings?: BookingRecord[]
  [key: string]: unknown
}

type StatusIconComponent = React.ComponentType<{ className?: string }>

function getStatusConfig(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: StatusIconComponent }> = {
    pending: { label: "Pending", variant: "secondary", icon: Clock },
    confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
    completed: { label: "Completed", variant: "outline", icon: CheckCircle2 },
    checked_in: { label: "Checked In", variant: "default", icon: CheckCircle2 },
    checked_out: { label: "Checked Out", variant: "outline", icon: CheckCircle2 },
    no_show: { label: "No Show", variant: "destructive", icon: Ban },
  }
  return statusMap[status] || { label: status, variant: "secondary" as const, icon: Clock }
}

function BookingCard({
  booking,
  onCancel,
  onDelete,
  actionLoading,
}: {
  booking: BookingRecord
  onCancel: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  actionLoading: BookingActionLoading
}) {
  const status = getStatusConfig(booking.status || "pending")
  const StatusIcon = status.icon
  
  const checkInDate = new Date(booking.checkInDate || booking.startDate || booking.from || booking.checkIn || new Date().toISOString())
  const checkOutDate = new Date(booking.checkOutDate || booking.endDate || booking.to || booking.checkOut || new Date().toISOString())
  
  const now = new Date()
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const canCancel = hoursUntilCheckIn >= 24 && 
    booking.status !== "cancelled" && 
    booking.status !== "completed" && 
    booking.status !== "checked_out"
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {booking.room?.number ? `Room ${booking.room.number}` : booking.room?.title || booking.room?.name || "Room Booking"}
            </h3>
            {booking.room?.type && (
              <p className="text-sm text-muted-foreground capitalize">{booking.room.type} Room</p>
            )}
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Check-in</span>
            </div>
            <div className="ml-6">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Check-out</span>
            </div>
            <div className="ml-6">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-lg">₱{booking.totalPrice ?? booking.price ?? "0"}</span>
          </div>
          {(booking.guestCount || booking.guests) && (
            <span className="text-muted-foreground">
              {booking.guestCount 
                ? `${booking.guestCount} ${booking.guestCount === 1 ? "Guest" : "Guests"}`
                : `${booking.guests?.adults || 0} ${booking.guests?.adults === 1 ? "Adult" : "Adults"}${(booking.guests?.children || 0) > 0 ? `, ${booking.guests?.children} ${booking.guests?.children === 1 ? "Child" : "Children"}` : ""}`
              }
            </span>
          )}
        </div>
        
        {booking.specialRequests && (
          <div className="text-sm">
            <div className="font-medium text-muted-foreground mb-1">Special Requests</div>
            <div className="text-xs bg-muted/50 p-2 rounded border">{booking.specialRequests}</div>
          </div>
        )}
        
        {!canCancel && hoursUntilCheckIn < 24 && hoursUntilCheckIn > 0 && booking.status !== "cancelled" && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
            ⚠️ Cancellation not available - less than 24 hours until check-in
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-2">
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(booking._id)}
              disabled={!!actionLoading[booking._id]}
              className="flex-1"
            >
              {actionLoading[booking._id] ? "Cancelling..." : (
                <>
                  <Ban className="h-4 w-4 mr-1" />
                  Cancel
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(booking._id)}
            disabled={!!actionLoading[booking._id]}
            className={booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "checked_out" ? "" : "flex-1"}
          >
            {actionLoading[booking._id] ? "Hiding..." : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Hide
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function UserBookingsContent() {
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<BookingActionLoading>({})

  // Get URL parameters
  const bookingId = searchParams.get('id')
  const status = searchParams.get('status')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  React.useEffect(() => {
    document.title = "Amethyst Inn - My Bookings"
  }, [bookingId, status, page, limit])

  const loadBookings = useCallback(async () => {
    setLoading(true)
    try {
      const token = AuthTokenManager.getToken()
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (status) queryParams.append('status', status)
      if (page) queryParams.append('page', page)
      if (limit) queryParams.append('limit', limit)
      
      const queryString = queryParams.toString()
      const url = `/api/bookings${queryString ? `?${queryString}` : ''}`
      
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
        credentials: 'same-origin',
      })
      
      if (!res.ok) {
        throw new Error(`Failed to load bookings: ${res.status}`)
      }
      
      const response = (await res.json()) as BookingsApiResponse | BookingRecord[]
      const bookingsData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.bookings)
            ? response.bookings
            : []
      
      setBookings(bookingsData)
    } catch (error: unknown) {
      console.error("Error loading bookings:", error)
      toast.error("Could not load bookings")
    } finally {
      setLoading(false)
    }
  }, [status, page, limit])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const setAction = (id: string, value: boolean) =>
    setActionLoading((s) => ({ ...s, [id]: value }))

  const handleCancelBooking = useCallback(
    async (id: string) => {
      setAction(id, true)
      try {
        const token = AuthTokenManager.getToken()
        const res = await fetch(`/api/bookings/${id}/cancel`, {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            cancellationReason: "Cancelled by user"
          })
        })
        
        const data = (await res.json()) as CancellationResponse
        
        if (!res.ok) {
          throw new Error(data.error || data.message || "Failed to cancel booking")
        }
        
        toast.success("Booking cancelled successfully", {
          description: data.data?.refundEligible 
            ? `Refund amount: ₱${(data.data.refundAmount ?? 0).toLocaleString()}` 
            : "No refund available",
          duration: 5000,
        })
        await loadBookings()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to cancel booking"
        toast.error("Cancellation Failed", {
          description: message,
          duration: 5000,
        })
      } finally {
        setAction(id, false)
      }
    },
    [loadBookings]
  )

  const handleDeleteBooking = useCallback(
    async (id: string) => {
      if (!confirm("Hide this booking from your view? This won't delete it from the system."))
        return
      setAction(id, true)
      try {
        setBookings((prev) => prev.filter((b) => b._id !== id))
        toast.success("Booking hidden from view")
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to hide booking"
        toast.error(message)
      } finally {
        setAction(id, false)
      }
    },
    []
  )

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
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Bookings</h2>
                  <Button variant="outline" size="sm" onClick={loadBookings} disabled={loading}>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {loading ? (
                  <div className="flex flex-1 items-center justify-center py-12">
                    <Spinner className="size-8 text-primary-foreground" />
                    <span className="ml-3 text-primary-foreground">Loading bookings...</span>
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center space-y-2">
                        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
                        <p className="text-muted-foreground font-medium">No bookings found</p>
                        <p className="text-sm text-muted-foreground">Your booking history will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {bookings.map((b) => (
                      <BookingCard
                        key={b._id}
                        booking={b}
                        onCancel={handleCancelBooking}
                        onDelete={handleDeleteBooking}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default function UserBookingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading bookings...</div>
      </div>
    }>
      <UserBookingsContent />
    </Suspense>
  )
}
