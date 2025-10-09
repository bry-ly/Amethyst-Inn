import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { UsersPageWrapper } from '@/components/tables/users-page-wrapper'
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amethyst Inn - User Management",
}

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function requireAdmin() {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) redirect('/login?next=/admin/users')
  
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' })
    if (!res.ok) redirect('/login?next=/admin/users')
    
    const data = await res.json()
    if (data?.role !== 'admin') {
      redirect('/dashboard')
    }
    
    return data
  } catch {
    redirect('/login?next=/admin/users')
  }
}

export default async function AdminUsersPage() {
  await requireAdmin()
  
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
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-full">
                <UsersPageWrapper role="admin" />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
