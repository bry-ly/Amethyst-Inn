"use client"
import React from 'react'
import { UserSidebar } from '@/components/layout/user-sidebar'
import { UserSiteHeaderWrapper } from '@/components/layout/user-site-header-wrapper'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { AuthTokenManager } from '@/utils/cookies'
import { Settings, Bell, Shield, User, Cookie, Info, Eye, EyeOff } from 'lucide-react'

// Rate limiting configuration
const RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 60000, // 1 minute
  cooldownMs: 30000, // 30 seconds cooldown after hitting limit
}

type RateLimitAction = 'profile' | 'password' | 'notifications' | 'cookies'

export default function UserSettingsPage() {
  const [loading, setLoading] = React.useState(false)
  const [user, setUser] = React.useState<any>(null)
  const [rateLimitState, setRateLimitState] = React.useState<
    Record<RateLimitAction, { attempts: number; firstAttempt: number; cooldownUntil: number }>
  >({
    profile: { attempts: 0, firstAttempt: 0, cooldownUntil: 0 },
    password: { attempts: 0, firstAttempt: 0, cooldownUntil: 0 },
    notifications: { attempts: 0, firstAttempt: 0, cooldownUntil: 0 },
    cookies: { attempts: 0, firstAttempt: 0, cooldownUntil: 0 },
  })
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [notifications, setNotifications] = React.useState({
    emailNotifications: true,
    bookingReminders: true,
    promotionalEmails: false,
  })
  const [cookies, setCookies] = React.useState({
    essentialCookies: true,
    analyticsCookies: false,
    marketingCookies: false,
  })
  const [passwordVisibility, setPasswordVisibility] = React.useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [cooldownTimers, setCooldownTimers] = React.useState<Record<RateLimitAction, number>>({
    profile: 0,
    password: 0,
    notifications: 0,
    cookies: 0,
  })

  // Update cooldown timers every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setCooldownTimers({
        profile: Math.max(0, Math.ceil((rateLimitState.profile.cooldownUntil - now) / 1000)),
        password: Math.max(0, Math.ceil((rateLimitState.password.cooldownUntil - now) / 1000)),
        notifications: Math.max(0, Math.ceil((rateLimitState.notifications.cooldownUntil - now) / 1000)),
        cookies: Math.max(0, Math.ceil((rateLimitState.cookies.cooldownUntil - now) / 1000)),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [rateLimitState])

  const loadUserData = React.useCallback(async () => {
    try {
      const token = AuthTokenManager.getToken()
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }, [])

  React.useEffect(() => {
    document.title = "Amethyst Inn - Settings"
    loadUserData()
  }, [loadUserData])

  const checkRateLimit = (action: keyof typeof rateLimitState): boolean => {
    const now = Date.now()
    const state = rateLimitState[action]

    // Check if in cooldown period
    if (state.cooldownUntil > now) {
      const remainingSeconds = Math.ceil((state.cooldownUntil - now) / 1000)
      toast.error(`Too many attempts. Please wait ${remainingSeconds} seconds before trying again.`)
      return false
    }

    // Reset if window has passed
    if (now - state.firstAttempt > RATE_LIMIT.windowMs) {
      setRateLimitState(prev => ({
        ...prev,
        [action]: { attempts: 1, firstAttempt: now, cooldownUntil: 0 }
      }))
      return true
    }

    // Check if limit exceeded
    if (state.attempts >= RATE_LIMIT.maxAttempts) {
      const cooldownUntil = now + RATE_LIMIT.cooldownMs
      setRateLimitState(prev => ({
        ...prev,
        [action]: { ...state, cooldownUntil }
      }))
      toast.error(`Too many attempts. Please wait 30 seconds before trying again.`)
      return false
    }

    // Increment attempts
    setRateLimitState(prev => ({
      ...prev,
      [action]: { ...state, attempts: state.attempts + 1 }
    }))
    return true
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!checkRateLimit('profile')) return
    
    setLoading(true)
    try {
      const token = AuthTokenManager.getToken()
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        }),
      })

      if (!res.ok) throw new Error('Failed to update profile')

      toast.success('Profile updated successfully')
      await loadUserData()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!checkRateLimit('password')) return

    setLoading(true)
    try {
      const token = AuthTokenManager.getToken()
      const res = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      if (!res.ok) throw new Error('Failed to change password')

      toast.success('Password changed successfully')
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
    } catch (error) {
      toast.error('Failed to change password. Please check your current password.')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="flex flex-1 flex-col h-full overflow-y-auto">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-8 py-6 md:py-8 px-4 md:px-8 max-w-5xl mx-auto w-full">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                  </div>
                  <p className="text-muted-foreground">
                    Manage your account settings and preferences
                  </p>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                  <TabsList className="w-full flex-wrap justify-start">
                    <TabsTrigger value="profile" className="gap-2">
                      <User className="h-4 w-4" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger value="password" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                      <Bell className="h-4 w-4" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="privacy" className="gap-2">
                      <Cookie className="h-4 w-4" />
                      Privacy
                    </TabsTrigger>
                    <TabsTrigger value="account" className="gap-2">
                      <Info className="h-4 w-4" />
                      Account
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="mt-6">
                    <form onSubmit={handleUpdateProfile}>
                      <Card className="border-border/60">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <User className="h-5 w-5 text-primary" />
                            Profile Information
                          </CardTitle>
                          <CardDescription>
                            Update your personal details and contact information.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-base font-medium">Full Name</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter your full name"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-base font-medium">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Enter your email"
                                className="h-11"
                              />
                            </div>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="phone" className="text-base font-medium">Phone Number</Label>
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter your phone number"
                                className="h-11"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address" className="text-base font-medium">Address</Label>
                              <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter your address"
                                className="h-11"
                              />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-end gap-2">
                          {cooldownTimers.profile > 0 && (
                            <p className="text-sm text-destructive font-medium">
                              Please wait {cooldownTimers.profile}s before trying again
                            </p>
                          )}
                          <Button
                            type="submit"
                            disabled={loading || cooldownTimers.profile > 0}
                            size="lg"
                          >
                            {loading ? 'Saving...' : cooldownTimers.profile > 0 ? `Wait ${cooldownTimers.profile}s` : 'Save Changes'}
                          </Button>
                        </CardFooter>
                      </Card>
                    </form>
                  </TabsContent>

                  <TabsContent value="password" className="mt-6">
                    <form onSubmit={handleChangePassword}>
                      <Card className="border-border/60">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <Shield className="h-5 w-5 text-destructive" />
                            Security
                          </CardTitle>
                          <CardDescription>
                            Change your password and keep your account secure.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-base font-medium">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={passwordVisibility.current ? 'text' : 'password'}
                                value={formData.currentPassword}
                                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                placeholder="Enter current password"
                                className="h-11 pr-12"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1.5 top-1.5 h-8 w-8"
                                onClick={() =>
                                  setPasswordVisibility(prev => ({ ...prev, current: !prev.current }))
                                }
                                aria-label={`${passwordVisibility.current ? 'Hide' : 'Show'} current password`}
                              >
                                {passwordVisibility.current ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="newPassword" className="text-base font-medium">New Password</Label>
                              <div className="relative">
                                <Input
                                  id="newPassword"
                                  type={passwordVisibility.new ? 'text' : 'password'}
                                  value={formData.newPassword}
                                  onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                                  placeholder="Enter new password"
                                  className="h-11 pr-12"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1.5 top-1.5 h-8 w-8"
                                  onClick={() =>
                                    setPasswordVisibility(prev => ({ ...prev, new: !prev.new }))
                                  }
                                  aria-label={`${passwordVisibility.new ? 'Hide' : 'Show'} new password`}
                                >
                                  {passwordVisibility.new ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm Password</Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={passwordVisibility.confirm ? 'text' : 'password'}
                                  value={formData.confirmPassword}
                                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                  placeholder="Confirm new password"
                                  className="h-11 pr-12"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1.5 top-1.5 h-8 w-8"
                                  onClick={() =>
                                    setPasswordVisibility(prev => ({ ...prev, confirm: !prev.confirm }))
                                  }
                                  aria-label={`${passwordVisibility.confirm ? 'Hide' : 'Show'} confirm password`}
                                >
                                  {passwordVisibility.confirm ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col items-end gap-2">
                          {cooldownTimers.password > 0 && (
                            <p className="text-sm text-destructive font-medium">
                              Please wait {cooldownTimers.password}s before trying again
                            </p>
                          )}
                          <Button
                            type="submit"
                            disabled={loading || cooldownTimers.password > 0}
                            size="lg"
                          >
                            {loading ? 'Updating...' : cooldownTimers.password > 0 ? `Wait ${cooldownTimers.password}s` : 'Update Password'}
                          </Button>
                        </CardFooter>
                      </Card>
                    </form>
                  </TabsContent>

                  <TabsContent value="notifications" className="mt-6">
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Bell className="h-5 w-5 text-blue-500" />
                          Notification Preferences
                        </CardTitle>
                        <CardDescription>
                          Choose how you want to stay updated about your reservations.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive email notifications about your bookings.
                            </p>
                          </div>
                          <Toggle
                            pressed={notifications.emailNotifications}
                            onPressedChange={(pressed) =>
                              setNotifications(prev => ({ ...prev, emailNotifications: pressed }))
                            }
                            aria-label="Toggle email notifications"
                            size="lg"
                            className="mt-3 md:mt-0"
                          >
                            {notifications.emailNotifications ? 'On' : 'Off'}
                          </Toggle>
                        </div>

                        <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Booking Reminders</Label>
                            <p className="text-sm text-muted-foreground">
                              Get reminders about upcoming bookings.
                            </p>
                          </div>
                          <Toggle
                            pressed={notifications.bookingReminders}
                            onPressedChange={(pressed) =>
                              setNotifications(prev => ({ ...prev, bookingReminders: pressed }))
                            }
                            aria-label="Toggle booking reminders"
                            size="lg"
                            className="mt-3 md:mt-0"
                          >
                            {notifications.bookingReminders ? 'On' : 'Off'}
                          </Toggle>
                        </div>

                        <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Promotional Emails</Label>
                            <p className="text-sm text-muted-foreground">
                              Receive emails about special offers and promotions.
                            </p>
                          </div>
                          <Toggle
                            pressed={notifications.promotionalEmails}
                            onPressedChange={(pressed) =>
                              setNotifications(prev => ({ ...prev, promotionalEmails: pressed }))
                            }
                            aria-label="Toggle promotional emails"
                            size="lg"
                            className="mt-3 md:mt-0"
                          >
                            {notifications.promotionalEmails ? 'On' : 'Off'}
                          </Toggle>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col items-end gap-2">
                        {cooldownTimers.notifications > 0 && (
                          <p className="text-sm text-destructive font-medium">
                            Please wait {cooldownTimers.notifications}s before trying again
                          </p>
                        )}
                        <Button
                          type="button"
                          size="lg"
                          onClick={() => {
                            if (!checkRateLimit('notifications')) return
                            toast.success('Notification preferences saved')
                          }}
                          disabled={loading || cooldownTimers.notifications > 0}
                        >
                          {cooldownTimers.notifications > 0 ? `Wait ${cooldownTimers.notifications}s` : 'Save Preferences'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>

                  <TabsContent value="privacy" className="mt-6">
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Cookie className="h-5 w-5 text-amber-500" />
                          Privacy & Cookies
                        </CardTitle>
                        <CardDescription>
                          Control how we use cookies and tracking technologies.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Essential Cookies</Label>
                            <p className="text-sm text-muted-foreground">
                              Required for the website to function properly.
                            </p>
                          </div>
                          <Toggle
                            pressed={cookies.essentialCookies}
                            disabled
                            aria-label="Essential cookies (always enabled)"
                            size="lg"
                            className="mt-3 md:mt-0"
                          >
                            Always On
                          </Toggle>
                        </div>

                        <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Analytics Cookies</Label>
                            <p className="text-sm text-muted-foreground">
                              Help us improve our website performance.
                            </p>
                          </div>
                          <Toggle
                            pressed={cookies.analyticsCookies}
                            onPressedChange={(pressed) =>
                              setCookies(prev => ({ ...prev, analyticsCookies: pressed }))
                            }
                            aria-label="Toggle analytics cookies"
                            size="lg"
                            className="mt-3 md:mt-0"
                          >
                            {cookies.analyticsCookies ? 'On' : 'Off'}
                          </Toggle>
                        </div>

                        <div className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/40 p-4 md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1">
                            <Label className="text-base font-medium">Marketing Cookies</Label>
                            <p className="text-sm text-muted-foreground">
                              Used to deliver personalized advertisements.
                            </p>
                          </div>
                          <Toggle
                            pressed={cookies.marketingCookies}
                            onPressedChange={(pressed) =>
                              setCookies(prev => ({ ...prev, marketingCookies: pressed }))
                            }
                            aria-label="Toggle marketing cookies"
                            size="lg"
                            className="mt-3 md:mt-0"
                          >
                            {cookies.marketingCookies ? 'On' : 'Off'}
                          </Toggle>
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col items-end gap-2">
                        {cooldownTimers.cookies > 0 && (
                          <p className="text-sm text-destructive font-medium">
                            Please wait {cooldownTimers.cookies}s before trying again
                          </p>
                        )}
                        <Button
                          type="button"
                          size="lg"
                          onClick={() => {
                            if (!checkRateLimit('cookies')) return
                            toast.success('Cookie preferences saved')
                          }}
                          disabled={loading || cooldownTimers.cookies > 0}
                        >
                          {cooldownTimers.cookies > 0 ? `Wait ${cooldownTimers.cookies}s` : 'Save Preferences'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>

                  <TabsContent value="account" className="mt-6">
                    <Card className="border-border/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Info className="h-5 w-5 text-green-500" />
                          Account Details
                        </CardTitle>
                        <CardDescription>
                          View your membership information and account status.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/40 p-4">
                          <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                          <span className="text-lg font-semibold capitalize">{user?.role || 'Guest'}</span>
                        </div>
                        <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/40 p-4">
                          <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                          <span className="text-lg font-semibold">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'N/A'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
