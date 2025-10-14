"use client";

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RoomDataTable } from "@/components/rooms/room-data-table"
import { Unauthorized } from "@/components/ui/unauthorized"
import { AuthTokenManager } from "@/utils/cookies"
import { toast } from "sonner"
import { PageLoader } from "@/components/common/loading-spinner"

function RoomsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rooms, setRooms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Get URL parameters
  const roomId = searchParams.get('id')
  const roomType = searchParams.get('type')
  const status = searchParams.get('status')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  useEffect(() => {
    document.title = "Amethyst Inn - Rooms";
    checkAuthAndFetchRooms()
  }, [roomId, roomType, status, minPrice, maxPrice, page, limit])

  async function checkAuthAndFetchRooms() {
    try {
  const token = AuthTokenManager.getToken()
  // Check if user is admin using internal API so cookie can be used
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const authRes = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers,
        credentials: 'same-origin',
      })

      if (!authRes.ok) {
        router.push("/login?next=/rooms")
        return
      }

      const userData = await authRes.json()
      
      if (userData?.role !== "admin") {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true)

  // Fetch rooms
  await fetchRooms(token ?? undefined)
    } catch (error) {
      console.error("Auth/fetch error:", error)
      router.push("/login?next=/rooms")
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchRooms(token?: string) {
    try {
      const authToken = token || AuthTokenManager.getToken()
      if (!authToken) return
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      if (roomType) queryParams.append('type', roomType)
      if (status) queryParams.append('status', status)
      if (minPrice) queryParams.append('minPrice', minPrice)
      if (maxPrice) queryParams.append('maxPrice', maxPrice)
      if (page) queryParams.append('page', page)
      if (limit) queryParams.append('limit', limit)
      
      const queryString = queryParams.toString()
      const url = `/api/rooms${queryString ? `?${queryString}` : ''}`
      
      // Use internal API route so the httpOnly auth cookie (if present) is included;
      // we still send Authorization for consistency when token is stored locally.
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${authToken}` },
        cache: 'no-store',
        credentials: 'same-origin'
      })

      if (!res.ok) {
        console.error("Failed to fetch rooms:", res.status)
        toast.error("Failed to load rooms")
        return
      }

      const data = await res.json()
      const roomsData = Array.isArray(data) ? data : (data?.data || data?.rooms || [])
      setRooms(roomsData)
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast.error("Error loading rooms")
    }
  }

  const handleRoomAdded = () => {
    fetchRooms()
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
          {isLoading ? (
            <PageLoader message="Loading rooms..." />
          ) : !isAuthorized ? (
            <Unauthorized
              title="Admin Access Required"
              message="This room management page is restricted to administrators only. You need admin privileges to view and manage rooms."
            />
          ) : (
            <RoomDataTable data={rooms} onRoomAdded={handleRoomAdded} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading rooms..." />}>
      <RoomsContent />
    </Suspense>
  );
}