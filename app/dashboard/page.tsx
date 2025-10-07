"use client";

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper"
import { AuthTokenManager } from "@/utils/cookies"
import { PageLoader } from "@/components/common/loading-spinner"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    document.title = "Amethyst Inn - Dashboard";
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const token = AuthTokenManager.getToken()
      
      if (!token) {
        router.push("/login?next=/dashboard")
        return
      }

      const backend = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")
      const res = await fetch(`${backend}/api/auth/me`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
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
