"use client";

import React, { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ReservationDataTable } from "@/components/reservation/reservation-data-table"
import { AuthTokenManager } from "@/utils/cookies"
import { toast } from "sonner"
import { PageLoader } from "@/components/common/loading-spinner"

function ReservationsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  // Get URL parameters
  const reservationId = searchParams.get('id')
  const status = searchParams.get('status')
  const guestId = searchParams.get('guestId')
  const roomId = searchParams.get('roomId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  useEffect(() => {
    document.title = "Amethyst Inn - Reservations";
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, status, guestId, roomId, startDate, endDate, page, limit])

  useEffect(() => {
    if (isAuthorized) {
      fetchReservations()
    }
  }, [isAuthorized])

  async function checkAuth() {
    try {
      const token = AuthTokenManager.getToken()
      
      if (!token) {
        router.push("/login?next=/reservations")
        return
      }

      // Check if user is admin or staff
      const authRes = await fetch(`/api/auth/me`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store"
      })

      if (!authRes.ok) {
        router.push("/login?next=/reservations")
        return
      }

      const userData = await authRes.json()
      
      if (userData?.role !== "admin" && userData?.role !== "staff") {
        toast.error("Access denied. Admin or staff privileges required.")
        router.push("/")
        return
      }

      setIsAuthorized(true)
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login?next=/reservations")
    }
  }

  async function fetchReservations() {
    try {
      setLoading(true)
      const token = AuthTokenManager.getToken()

      // Build query parameters
      const queryParams = new URLSearchParams()
      if (status) queryParams.append('status', status)
      if (guestId) queryParams.append('guestId', guestId)
      if (roomId) queryParams.append('roomId', roomId)
      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)
      if (page) queryParams.append('page', page)
      if (limit) queryParams.append('limit', limit)
      
      const queryString = queryParams.toString()
      const url = `/api/reservations${queryString ? `?${queryString}` : ''}`

      const res = await fetch(url, {
        headers: {
          authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch reservations: ${res.status}`)
      }

      const data = await res.json()
      console.log('Reservations fetched:', data)
      setReservations(data.data || data.reservations || [])
    } catch (error) {
      console.error("Error fetching reservations:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load reservations")
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="mt-4 lg:mt-6">
          {!isAuthorized ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <PageLoader message="Checking authorization..." />
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <PageLoader message="Loading reservations..." />
            </div>
          ) : (
            <div className="container mx-auto px-4 py-6">
              <ReservationDataTable
                reservations={reservations}
                onUpdate={fetchReservations}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading reservations..." />}>
      <ReservationsContent />
    </Suspense>
  );
}
