"use client";

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import PaymentDataTable from "@/components/payment/payment-data-table"
import { AuthTokenManager } from "@/utils/cookies"
import { toast } from "sonner"
import { PageLoader } from "@/components/common/loading-spinner"

export const metadata = {
  title: "Payments - Amethyst Inn",
  description: "Manage payment transactions and refunds",
}

export default function PaymentsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    document.title = "Amethyst Inn - Payments";
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    try {
      const token = AuthTokenManager.getToken()
      // Check if user is admin/staff using internal API
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const authRes = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers,
        credentials: 'same-origin',
      })

      if (!authRes.ok) {
        router.push("/login?next=/payments")
        return
      }

      const userData = await authRes.json()
      
      if (userData?.role !== "admin" && userData?.role !== "staff") {
        toast.error("Access denied. Admin privileges required.")
        router.push("/")
        return
      }

      setIsAuthorized(true)
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login?next=/payments")
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
        <div className="mt-4 lg:mt-6">
          {isLoading ? (
            <PageLoader message="Loading payments..." />
          ) : !isAuthorized ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">Checking authorization...</p>
            </div>
          ) : (
            <PaymentDataTable />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
