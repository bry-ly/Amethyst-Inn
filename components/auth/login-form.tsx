"use client"
import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { IconEye, IconEyeOff, IconLoader } from "@tabler/icons-react"
import { toast } from "sonner"
import { AuthTokenManager, CookieConsent } from "@/utils/cookies"
import { Turnstile } from "@/components/auth/turnstile"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const debouncedEmail = useDebounce(email, 500)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  
  // Only require Turnstile in production
  const isProduction = process.env.NODE_ENV === "production"

  // Validate email with debounce
  useEffect(() => {
    if (!debouncedEmail) {
      setEmailError(null)
      return
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError(null)
    }
  }, [debouncedEmail])

  // Memoize callbacks to prevent Turnstile re-renders
  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token)
  }, [])

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken(null)
    toast.error("Security verification failed. Please try again.")
  }, [])

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken(null)
    toast.warning("Security verification expired. Please verify again.")
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Validation
      if (!email.trim()) {
        setEmailError('Email is required')
        setLoading(false)
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailError('Please enter a valid email address')
        setLoading(false)
        return
      }
      if (!password) {
        setPasswordError('Password is required')
        setLoading(false)
        return
      }
      if (isProduction && !turnstileToken) {
        toast.error("Please complete the security verification")
        setLoading(false)
        return
      }
      
      // Prepare request body - only include turnstileToken in production
      const requestBody: any = { email, password };
      if (isProduction && turnstileToken) {
        requestBody.turnstileToken = turnstileToken;
      }
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Login failed")
      }
      if (data?.token) {
        try { 
          // Use cookie consent to determine storage method
          const hasConsent = CookieConsent.hasConsent();
          AuthTokenManager.setToken(data.token, hasConsent);
        } catch (error) {
          console.error('Error storing token:', error);
        }
      }
      toast.success("Login successful!")
      const role: string | undefined = data?.user?.role || data?.role
      const nextParam = searchParams.get('next')
      
      // Use window.location.replace() to prevent back button to login page
      if (nextParam) {
        // decode and navigate to next
        try {
          const decoded = decodeURIComponent(nextParam)
          window.location.replace(decoded)
          return
        } catch (e) {
          // fall back to default
        }
      }
      window.location.replace(role === "admin" ? "/dashboard" : "/")
    } catch (err: any) {
      toast.error(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} aria-busy={loading}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                  disabled={loading}
                />
                {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                    disabled={loading}
                  />
                  {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={loading}
                  >
                    {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {isProduction && (
                  <Turnstile
                    siteKey="0x4AAAAAAB5yfAHgiw_rGKsj"
                    onSuccess={handleTurnstileSuccess}
                    onError={handleTurnstileError}
                    onExpire={handleTurnstileExpire}
                    theme="auto"
                    size="compact"
                  />
                )}
                <Button type="submit" className="w-full" disabled={loading || (isProduction && !turnstileToken)}>
                  {loading && <IconLoader className="mr-2 size-4 animate-spin" />}
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
                <Link href="/signup?force=true" className="underline underline-offset-4">
                Sign up
                </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
