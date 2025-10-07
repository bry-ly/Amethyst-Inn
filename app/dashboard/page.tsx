import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { DashboardWrapper } from "@/components/dashboard-wrapper"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function requireAdmin() {
  const token = (await cookies()).get("auth_token")?.value
  if (!token) {
    redirect("/login?next=/dashboard")
  }
  const backend = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")
  try {
    const res = await fetch(`${backend}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) {
      redirect("/login?next=/dashboard")
    }
    const data = await res.json()
    if (data?.role !== "admin") {
      redirect("/")
    }
  } catch {
    redirect("/login?next=/dashboard")
  }
}

export default async function Page() {
  await requireAdmin()
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
            <DashboardWrapper />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
