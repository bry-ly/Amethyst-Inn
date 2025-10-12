"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ui/mode-toggle"

export function UserSiteHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab")

  // Determine the page title based on pathname
  const getPageTitle = () => {
    if (pathname === "/profile") return "My Profile"
    if (pathname === "/profile/bookings") return "My Bookings"
    if (pathname === "/profile/feedback") return "My Feedback"
    if (pathname === "/profile/statistics") return "My Statistics"
    if (pathname === "/profile/settings") return "Settings"
    if (pathname === "/") return "Home"
    if (pathname === "/rooms") return "Browse Rooms"
    if (pathname === "/testimonials") return "Testimonials"
    
    // Default fallback
    return "Amethyst Inn"
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{getPageTitle()}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
