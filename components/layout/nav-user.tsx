"use client"
import * as React from "react"
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function NavUser({
  user,
}: {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}) {
  const { isMobile } = useSidebar()
  const [me, setMe] = React.useState<{ name: string; email: string; avatar?: string } | null>(null)
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    // Skip if already loaded or if user prop is provided
    if (hasLoaded || user) {
      if (user && !me) {
        setMe({ name: user.name, email: user.email, avatar: user.avatar })
      }
      return
    }

    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (!res.ok) return
        const data: any = await res.json()
        if (mounted && data) {
          setMe({ 
            name: data.name, 
            email: data.email, 
            avatar: data.avatar
          })
          setHasLoaded(true)
        }
      } catch {}
    }
    load()
    return () => {
      mounted = false
    }
  }, [hasLoaded, user, me])

  const display = me || user || { name: 'User', email: '', avatar: '/avatars/shadcn.jpg' }

  const handleLogout = async () => {
    try {
      // Clear localStorage token
      localStorage.removeItem('token')
      
      // Clear session storage
      sessionStorage.clear()
      
      // Clear all cached data
      if (typeof window !== 'undefined') {
        // Clear any cached data from our API hook
        const { clearCache } = await import('@/hooks/use-api-data')
        clearCache()
      }
      
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      // Clear browser history to prevent back button
      window.history.replaceState(null, '', '/login')
      
      // Force full page reload to clear any cached state
      window.location.replace('/login')
    } catch (err) {
      console.error('Logout error:', err)
      // Even if API call fails, clear local data and redirect
      localStorage.removeItem('token')
      sessionStorage.clear()
      window.location.replace('/login')
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={display.avatar} alt={display.name} />
                <AvatarFallback className="rounded-lg">AM</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{display.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {display.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={display.avatar} alt={display.name} />
                  <AvatarFallback className="rounded-lg">AM</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{display.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {display.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarMenu>
  )
}
