"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Validation
      if (!email.trim()) {
        toast.error("Email is required")
        setLoading(false)
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Please enter a valid email address")
        setLoading(false)
        return
      }
      if (!password) {
        toast.error("Password is required")
        setLoading(false)
        return
      }
      if (!turnstileToken) {
        toast.error("Please complete the security verification")
        setLoading(false)
        return
      }
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken }),
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
      if (nextParam) {
        // decode and navigate to next
        try {
          const decoded = decodeURIComponent(nextParam)
          router.push(decoded)
          return
        } catch (e) {
          // fall back to default
        }
      }
      router.push(role === "admin" ? "/dashboard" : "/")
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
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
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
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
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
              <Turnstile
                siteKey="0x4AAAAAAB5yfAHgiw_rGKsj"
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => {
                  setTurnstileToken(null)
                  toast.error("Security verification failed. Please try again.")
                }}
                onExpire={() => {
                  setTurnstileToken(null)
                  toast.warning("Security verification expired. Please verify again.")
                }}
                theme="auto"
                size="normal"
              />
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading || !turnstileToken}>
                  {loading && <IconLoader className="mr-2 size-4 animate-spin" />}
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
