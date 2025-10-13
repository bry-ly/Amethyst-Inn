"use client"
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { UserSidebar } from '@/components/layout/user-sidebar'
import { UserSiteHeaderWrapper } from '@/components/layout/user-site-header-wrapper'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { UserProfileDashboard } from '@/components/dashboard/user-profile-dashboard-clean'

function ProfileContent() {
  const searchParams = useSearchParams()
  
  // Get URL parameters
  const tab = searchParams.get('tab') // e.g., 'overview', 'bookings', 'settings'
  const edit = searchParams.get('edit') // e.g., 'true' for edit mode
  
  React.useEffect(() => {
    document.title = "Amethyst Inn - Profile";
  }, [tab, edit]);

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
                <UserProfileDashboard />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
