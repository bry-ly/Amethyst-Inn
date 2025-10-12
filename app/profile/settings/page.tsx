"use client"
import React from 'react'
import { UserSidebar } from '@/components/layout/user-sidebar'
import { UserSiteHeaderWrapper } from '@/components/layout/user-site-header-wrapper'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { toast } from 'sonner'
import { AuthTokenManager } from '@/utils/cookies'
import { Settings, Bell, Shield, User, ChevronDown, ChevronUp, Cookie } from 'lucide-react'

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
  const [expandedSections, setExpandedSections] = React.useState({
    profile: true,
    password: true,
    notifications: true,
    cookies: true,
    account: true,
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

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
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                  </div>
                  <p className="text-muted-foreground">
                    Manage your account settings and preferences
                  </p>
                </div>

                {/* Profile Information */}
                <section className="space-y-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleSection('profile')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Profile Information</h2>
                        <p className="text-sm text-muted-foreground">
                          Update your personal details and contact information
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedSections.profile ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>

                  {expandedSections.profile && (
                    <form onSubmit={handleUpdateProfile} className="space-y-6 pl-14 animate-in slide-in-from-top-2 duration-300">
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

                      <div className="flex flex-col items-end gap-2 pt-2">
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
                      </div>
                    </form>
                  )}
                </section>

                <Separator />

                {/* Change Password */}
                <section className="space-y-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleSection('password')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                        <Shield className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Security</h2>
                        <p className="text-sm text-muted-foreground">
                          Change your password and secure your account
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedSections.password ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>

                  {expandedSections.password && (
                    <form onSubmit={handleChangePassword} className="space-y-6 pl-14 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-base font-medium">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter current password"
                          className="h-11"
                        />
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-base font-medium">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={formData.newPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Enter new password"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Confirm new password"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 pt-2">
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
                      </div>
                    </form>
                  )}
                </section>

                <Separator />

                {/* Notification Preferences */}
                <section className="space-y-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleSection('notifications')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                        <Bell className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Notifications</h2>
                        <p className="text-sm text-muted-foreground">
                          Manage how you receive updates and alerts
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedSections.notifications ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>

                  {expandedSections.notifications && (
                    <div className="space-y-6 pl-14 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between py-4 border-b">
                        <div className="flex-1 space-y-1">
                          <Label className="text-base font-medium">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive email notifications about your bookings
                          </p>
                        </div>
                        <Toggle
                          pressed={notifications.emailNotifications}
                          onPressedChange={(pressed) =>
                            setNotifications(prev => ({ ...prev, emailNotifications: pressed }))
                          }
                          aria-label="Toggle email notifications"
                          size="lg"
                        >
                          {notifications.emailNotifications ? 'On' : 'Off'}
                        </Toggle>
                      </div>
                      
                      <div className="flex items-center justify-between py-4 border-b">
                        <div className="flex-1 space-y-1">
                          <Label className="text-base font-medium">Booking Reminders</Label>
                          <p className="text-sm text-muted-foreground">
                            Get reminders about upcoming bookings
                          </p>
                        </div>
                        <Toggle
                          pressed={notifications.bookingReminders}
                          onPressedChange={(pressed) =>
                            setNotifications(prev => ({ ...prev, bookingReminders: pressed }))
                          }
                          aria-label="Toggle booking reminders"
                          size="lg"
                        >
                          {notifications.bookingReminders ? 'On' : 'Off'}
                        </Toggle>
                      </div>
                      
                      <div className="flex items-center justify-between py-4 border-b">
                        <div className="flex-1 space-y-1">
                          <Label className="text-base font-medium">Promotional Emails</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive emails about special offers and promotions
                          </p>
                        </div>
                        <Toggle
                          pressed={notifications.promotionalEmails}
                          onPressedChange={(pressed) =>
                            setNotifications(prev => ({ ...prev, promotionalEmails: pressed }))
                          }
                          aria-label="Toggle promotional emails"
                          size="lg"
                        >
                          {notifications.promotionalEmails ? 'On' : 'Off'}
                        </Toggle>
                      </div>

                      <div className="flex flex-col items-end gap-2 pt-2">
                        {cooldownTimers.notifications > 0 && (
                          <p className="text-sm text-destructive font-medium">
                            Please wait {cooldownTimers.notifications}s before trying again
                          </p>
                        )}
                        <Button
                          onClick={() => {
                            if (!checkRateLimit('notifications')) return
                            toast.success('Notification preferences saved')
                          }}
                          size="lg"
                          disabled={loading || cooldownTimers.notifications > 0}
                        >
                          {cooldownTimers.notifications > 0 ? `Wait ${cooldownTimers.notifications}s` : 'Save Preferences'}
                        </Button>
                      </div>
                    </div>
                  )}
                </section>

                <Separator />

                {/* Cookie Preferences */}
                <section className="space-y-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleSection('cookies')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                        <Cookie className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Privacy & Cookies</h2>
                        <p className="text-sm text-muted-foreground">
                          Control how we use cookies and tracking
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedSections.cookies ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>

                  {expandedSections.cookies && (
                    <div className="space-y-6 pl-14 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between py-4 border-b">
                        <div className="flex-1 space-y-1">
                          <Label className="text-base font-medium">Essential Cookies</Label>
                          <p className="text-sm text-muted-foreground">
                            Required for the website to function properly
                          </p>
                        </div>
                        <Toggle
                          pressed={cookies.essentialCookies}
                          disabled
                          aria-label="Essential cookies (always enabled)"
                          size="lg"
                        >
                          Always On
                        </Toggle>
                      </div>
                      
                      <div className="flex items-center justify-between py-4 border-b">
                        <div className="flex-1 space-y-1">
                          <Label className="text-base font-medium">Analytics Cookies</Label>
                          <p className="text-sm text-muted-foreground">
                            Help us improve our website performance
                          </p>
                        </div>
                        <Toggle
                          pressed={cookies.analyticsCookies}
                          onPressedChange={(pressed) =>
                            setCookies(prev => ({ ...prev, analyticsCookies: pressed }))
                          }
                          aria-label="Toggle analytics cookies"
                          size="lg"
                        >
                          {cookies.analyticsCookies ? 'On' : 'Off'}
                        </Toggle>
                      </div>
                      
                      <div className="flex items-center justify-between py-4 border-b">
                        <div className="flex-1 space-y-1">
                          <Label className="text-base font-medium">Marketing Cookies</Label>
                          <p className="text-sm text-muted-foreground">
                            Used to deliver personalized advertisements
                          </p>
                        </div>
                        <Toggle
                          pressed={cookies.marketingCookies}
                          onPressedChange={(pressed) =>
                            setCookies(prev => ({ ...prev, marketingCookies: pressed }))
                          }
                          aria-label="Toggle marketing cookies"
                          size="lg"
                        >
                          {cookies.marketingCookies ? 'On' : 'Off'}
                        </Toggle>
                      </div>

                      <div className="flex flex-col items-end gap-2 pt-2">
                        {cooldownTimers.cookies > 0 && (
                          <p className="text-sm text-destructive font-medium">
                            Please wait {cooldownTimers.cookies}s before trying again
                          </p>
                        )}
                        <Button
                          onClick={() => {
                            if (!checkRateLimit('cookies')) return
                            toast.success('Cookie preferences saved')
                          }}
                          size="lg"
                          disabled={loading || cooldownTimers.cookies > 0}
                        >
                          {cooldownTimers.cookies > 0 ? `Wait ${cooldownTimers.cookies}s` : 'Save Preferences'}
                        </Button>
                      </div>
                    </div>
                  )}
                </section>

                <Separator />

                {/* Account Information */}
                <section className="space-y-6">
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleSection('account')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                        <User className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Account Details</h2>
                        <p className="text-sm text-muted-foreground">
                          View your account status and information
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      {expandedSections.account ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>

                  {expandedSections.account && (
                    <div className="pl-14 space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium text-muted-foreground">Account Type</span>
                          <span className="text-lg font-semibold capitalize">{user?.role || 'Guest'}</span>
                        </div>
                        <div className="flex flex-col gap-2 p-4 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium text-muted-foreground">Member Since</span>
                          <span className="text-lg font-semibold">
                            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
                    
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
