"use client"

import * as React from "react"
import {
  IconUser,
  IconCalendar,
  IconStar,
  IconSettings,
  IconDiamond,
  IconHome,
  IconMessageCircle,
  IconHistory,
} from "@tabler/icons-react"
import { usePathname } from "next/navigation"

import { NavUser } from "@/components/layout/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

interface UserSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function UserSidebar({ user, ...props }: UserSidebarProps) {
  const pathname = usePathname()

  const navItems = [
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
      url: "/profile?tab=bookings",
      icon: IconCalendar,
    },
    {
      title: "Booking History",
      url: "/profile?tab=history",
      icon: IconHistory,
    },
    {
      title: "My Feedback",
      url: "/profile?tab=feedback",
      icon: IconStar,
    },
  ]

  const secondaryItems = [
    {
      title: "Settings",
      url: "/profile?tab=settings",
      icon: IconSettings,
    },
  ]

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
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url || 
                  (item.url.includes('?') && pathname === item.url.split('?')[0])
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <Icon className="!size-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url || 
                  (item.url.includes('?') && pathname === item.url.split('?')[0])
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <Icon className="!size-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        {user && <NavUser user={{ ...user, avatar: user.avatar || "/avatars/default.jpg" }} />}
      </SidebarFooter>
    </Sidebar>
  )
}
