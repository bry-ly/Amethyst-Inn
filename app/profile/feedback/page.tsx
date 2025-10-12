"use client"
import React from 'react'
import { UserSidebar } from '@/components/layout/user-sidebar'
import { UserSiteHeaderWrapper } from '@/components/layout/user-site-header-wrapper'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { FeedbackSection } from '@/components/dashboard/feedback-section'

export default function UserFeedbackPage() {
  const [userId, setUserId] = React.useState<string | undefined>()

  React.useEffect(() => {
    document.title = "Amethyst Inn - My Feedback"
    
    // Load user data to get userId
    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setUserId(data._id)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }
    
    loadUser()
  }, [])

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
                <FeedbackSection userId={userId} />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
