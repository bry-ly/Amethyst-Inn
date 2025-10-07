import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import RoomsListDataTable from "@/components/RoomsListDataTable"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

async function requireAdmin() {
  const token = (await cookies()).get("auth_token")?.value
  if (!token) redirect("/login?next=/rooms")
  const backend = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000").replace(/\/$/, "")
  try {
    const res = await fetch(`${backend}/api/auth/me`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" })
    if (!res.ok) redirect("/login?next=/rooms")
    const data = await res.json()
    if (data?.role !== "admin") redirect("/")
  } catch {
    redirect("/login?next=/rooms")
  }
}

export default async function RoomsPage() {
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
        <div className="mt-4 lg:mt-6">
          <RoomsListDataTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}