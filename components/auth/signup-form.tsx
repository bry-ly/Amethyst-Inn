"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { IconEye, IconEyeOff, IconLoader } from "@tabler/icons-react"
import { toast } from "sonner"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Validation
      if (!name.trim()) {
        toast.error("Name is required")
        setLoading(false)
        return
      }
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
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters long")
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match")
        setLoading(false)
        return
      }
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Signup failed")
      }
      toast.success("Account created successfully! Please login to continue.")
      router.push("/login")
    } catch (err: any) {
      toast.error(err?.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details to sign up</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} aria-busy={loading}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="ex. Amethyst"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. amethyst@gmail.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 09123456789"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(s => !s)}
                    disabled={loading}
                  >
                    {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(s => !s)}
                    disabled={loading}
                  >
                    {showConfirm ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <IconLoader className="mr-2 size-4 animate-spin" />}
                  {loading ? "Creating account..." : "Sign up"}
                </Button>
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Sign In
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


