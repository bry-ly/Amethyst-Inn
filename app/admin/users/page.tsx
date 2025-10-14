"use client";

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { UsersPageWrapper } from '@/components/tables/users-page-wrapper'
import { Unauthorized } from "@/components/ui/unauthorized"
import { AuthTokenManager } from "@/utils/cookies"
import { PageLoader } from "@/components/common/loading-spinner"

function AdminUsersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Track URL parameters so the page responds to filter changes without reloads
  const userId = searchParams.get('id')
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  useEffect(() => {
    document.title = "Amethyst Inn - User Management";
    checkAuth()
  }, [userId, role, status, search, page, limit])

  async function checkAuth() {
    try {
      const token = AuthTokenManager.getToken()
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
      const authRes = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers,
        credentials: 'same-origin',
      })

      if (!authRes.ok) {
        router.push('/login?next=/admin/users')
        return
      }

      const userData = await authRes.json()

      if (userData?.role !== 'admin') {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true)
    } catch (error) {
      console.error('Admin check failed:', error)
      router.push('/login?next=/admin/users')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen">
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col h-full">
            <div className="@container/main flex flex-1 flex-col gap-2 h-full">
              {isLoading ? (
                <PageLoader message="Checking authorization..." />
              ) : !isAuthorized ? (
                <Unauthorized
                  title="Admin Access Required"
                  message="This admin user management page is restricted to system administrators. You need admin privileges to view and manage user accounts."
                />
              ) : (
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-full">
                  <UsersPageWrapper role="admin" />
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading users..." />}>
      <AdminUsersContent />
    </Suspense>
  );
}
