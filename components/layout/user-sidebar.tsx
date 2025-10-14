"use client"

import * as React from "react"
import {
  IconUser,
  IconCalendar,
  IconStar,
  IconSettings,
  IconDiamond,
  IconHome,
  IconBed,
  IconBook,
  IconChartBar,
} from "@tabler/icons-react"

import { NavUser } from "@/components/layout/nav-user"
import { NavUserMain } from "@/components/layout/nav-user-main"
import { NavUserDocuments } from "@/components/layout/nav-user-documents"
import { NavUserSecondary } from "@/components/layout/nav-user-secondary"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface UserSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

const data = {
  user: {
    name: "Guest",
    email: "",
    avatar: "/avatars/default.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: IconHome,
    },
    {
      title: "My Profile",
      url: "/profile",
      icon: IconUser,
    },
    {
      title: "My Bookings",
      url: "/profile/bookings",
      icon: IconCalendar,
    },
    {
      title: "My Feedback",
      url: "/profile/feedback",
      icon: IconStar,
    },
  ],
  documents: [
    {
      name: "My Statistics",
      url: "/profile/statistics",
      icon: IconChartBar,
    },
    {
      name: "Browse Rooms",
      url: "/#rooms",
      icon: IconBed,
    },
    {
      name: "Testimonials",
      url: "/testimonials",
      icon: IconBook,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/profile/settings",
      icon: IconSettings,
    },
  ],
}

export function UserSidebar({ user, ...props }: UserSidebarProps) {
  const [resolvedUser, setResolvedUser] = React.useState<UserSidebarProps["user"] | null>(() =>
    user
      ? {
          ...user,
          avatar: user.avatar || "/avatars/default.jpg",
        }
      : null,
  )

  React.useEffect(() => {
    if (user) {
      setResolvedUser({
        ...user,
        avatar: user.avatar || "/avatars/default.jpg",
      })
      return
    }

    let mounted = true

    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        if (!response?.ok) return

        const payload = await response.json()

        if (!mounted) return

        setResolvedUser({
          name: payload?.name || data.user.name,
          email: payload?.email || data.user.email,
          avatar: payload?.avatar || "/avatars/default.jpg",
        })
      } catch {
        if (mounted) {
          setResolvedUser(data.user)
        }
      }
    }

    loadUser()

    return () => {
      mounted = false
    }
  }, [user])

  const displayUser = resolvedUser || data.user

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <IconDiamond className="!size-5" />
                <span className="text-base font-semibold">Amethyst Inn</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <NavUserMain items={data.navMain} />
        <NavUserDocuments items={data.documents} />
        <NavUserSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={displayUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
