"use client";

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import PaymentDataTable from "@/components/payment/payment-data-table"
import { Unauthorized } from "@/components/ui/unauthorized"
import { AuthTokenManager } from "@/utils/cookies"
import { PageLoader } from "@/components/common/loading-spinner"

function PaymentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Get URL parameters
  const paymentId = searchParams.get('id')
  const status = searchParams.get('status')
  const method = searchParams.get('method')
  const bookingId = searchParams.get('bookingId')
  const guestId = searchParams.get('guestId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  useEffect(() => {
    document.title = "Amethyst Inn - Payments";
    checkAuthAndLoad()
    
    // Re-check auth when user navigates back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuthAndLoad()
      }
    }
    const handleFocus = () => checkAuthAndLoad()
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [paymentId, status, method, bookingId, guestId, startDate, endDate, page, limit])

  async function checkAuthAndLoad() {
    try {
  const token = AuthTokenManager.getToken()
  // Check if user is admin using internal API
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
      
      if (userData?.role !== "admin") {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
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
            <Unauthorized
              title="Admin Access Required"
              message="This payment management page is restricted to administrators only. You need admin privileges to view and manage payments."
            />
          ) : (
            <PaymentDataTable />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading payments..." />}>
      <PaymentsContent />
    </Suspense>
  );
}
