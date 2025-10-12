"use client"

import * as React from "react"
import {
  IconCamera,
  
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconBook,
  IconInnerShadowTop,
  IconHome,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconBed,
  IconCurrencyPeso,
  IconDiamond,
  IconReceipt,
  IconCalendar,
  IconBedFlat,
  IconCalendarCheck
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/layout/nav-documents"
import { NavMain } from "@/components/layout/nav-main"
import { NavSecondary } from "@/components/layout/nav-secondary"
import { NavUser } from "@/components/layout/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


const data = {
  user: {
    name: "Amethyst Inn Admin",
    email: "amethystinnadmin@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
    navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "User Management",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Room Management",
      url: "/rooms",
      icon: IconBedFlat,
    },
    {
      title: "Booking Management",
      url: "/booking",
      icon: IconCalendar,
    },
    {
      title: "Reservation Management",
      url: "/reservations",
      icon: IconCalendarCheck,  
    },
    {
      title: "Payment Management",
      url: "/payments",
      icon: IconCurrencyPeso,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    
  ],
  documents: [
    {
      name: "Feedback Management",
      url: "/admin/feedback",
      icon: IconReport,
    },
    {
      name: "Payments Receipt",
      url: "#",
      icon: IconReceipt,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconDiamond className="!size-5" />
                <span className="text-base font-semibold">Amethyst Inn</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
