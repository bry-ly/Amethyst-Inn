"use client";

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper"
import { AuthTokenManager } from "@/utils/cookies"
import { PageLoader } from "@/components/common/loading-spinner"
import { toast } from "sonner"

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Get URL parameters for dashboard filters
  const period = searchParams.get('period') // e.g., 'today', 'week', 'month', 'year'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const metric = searchParams.get('metric') // e.g., 'revenue', 'bookings', 'occupancy'

  useEffect(() => {
    document.title = "Amethyst Inn - Dashboard";
    checkAuth()
  }, [period, startDate, endDate, metric])

  async function checkAuth() {
    try {
      const token = AuthTokenManager.getToken()
      // Call internal API to leverage httpOnly cookie on the server
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers,
        credentials: 'same-origin',
      })

      if (!res.ok) {
        router.push("/login?next=/dashboard")
        return
      }

      const data = await res.json()
      
      if (data?.role !== "admin") {
        toast.error("Access denied. Admin privileges required.")
        router.push("/")
        return
      }

      setIsAuthorized(true)
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login?next=/dashboard")
    } finally {
      setIsLoading(false)
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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {isLoading ? (
              <PageLoader message="Loading dashboard..." />
            ) : !isAuthorized ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground">Checking authorization...</p>
              </div>
            ) : (
              <DashboardWrapper />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading dashboard..." />}>
      <DashboardContent />
    </Suspense>
  );
}
