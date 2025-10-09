import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SiteHeader } from '@/components/layout/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { UsersPageWrapper } from '@/components/tables/users-page-wrapper'
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amethyst Inn - Users",
}

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function requireAdmin() {
  const token = (await cookies()).get('auth_token')?.value
  if (!token) redirect('/login?next=/users')
  try {
    // Use internal auth endpoint so the cookie is automatically used (no cross-origin fetch)
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ? '' : ''}/api/auth/me`, {
      cache: 'no-store',
      headers: { authorization: `Bearer ${token}` }
    })
    if (!res.ok) redirect('/login?next=/users')
    const data = await res.json()
    if (data?.role !== 'admin') redirect('/')
  } catch {
    redirect('/login?next=/users')
  }
}

export default async function UsersPage() {
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
                <UsersPageWrapper />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
