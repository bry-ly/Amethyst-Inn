"use client";

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ReservationDataTable } from "@/components/reservation/reservation-data-table"
import { AuthTokenManager } from "@/utils/cookies"
import { toast } from "sonner"
import { PageLoader } from "@/components/common/loading-spinner"

export default function ReservationsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = "Amethyst Inn - Reservations";
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      const res = await fetch(`/api/reservations`, {
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
