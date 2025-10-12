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
import React, { useEffect, useMemo } from 'react'
import { Filter } from 'bad-words'
import type { BannedWordsResponse, RegisterResponse } from '@/types/auth'

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
  const [bannedWords, setBannedWords] = useState<string[]>([])
  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  // Initialize bad-words filter with custom banned words list
  const profanityFilter = useMemo(() => {
    const filter = new Filter()
    // Add custom banned words when they're loaded
    if (bannedWords.length > 0) {
      filter.addWords(...bannedWords)
    }
    return filter
  }, [bannedWords])

  useEffect(() => {
    let mounted = true
    fetch('/api/config/banned-words')
      .then((r) => r.json() as Promise<BannedWordsResponse>)
      .then((j) => {
        if (!mounted) return
        if (j?.success && j.data) {
          const combined = [ ...(j.data.english || []), ...(j.data.filipino || []) ]
          setBannedWords(combined.map((s: string) => String(s).toLowerCase().trim()).filter(Boolean))
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const normalizeForCheck = (input: string) => {
    if (!input) return ''
    let s = input.normalize('NFKC').toLowerCase()
    // basic leet replacements
    const map: Record<string,string> = { '4':'a','@':'a','3':'e','1':'i','!':'i','0':'o','$':'s','5':'s','7':'t' }
    for (const k in map) s = s.replace(new RegExp(k,'g'), map[k])
    // remove punctuation
    s = s.replace(/[\p{P}\p{S}]+/gu, ' ').replace(/\s+/g,' ').trim()
    return s
  }

  // Validate email with stricter regex
  const validateEmail = (email: string): boolean => {
    // RFC 5322 compliant email regex (simplified but strict)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
    
    if (!emailRegex.test(email)) return false
    
    // Additional checks
    const [localPart, domain] = email.split('@')
    
    // Local part checks
    if (!localPart || localPart.length > 64) return false
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false
    if (localPart.includes('..')) return false
    
    // Domain checks
    if (!domain || domain.length > 255) return false
    if (domain.startsWith('-') || domain.endsWith('-')) return false
    if (domain.startsWith('.') || domain.endsWith('.')) return false
    
    // Must have valid TLD (at least 2 chars)
    const tld = domain.split('.').pop()
    if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false
    
    return true
  }

  // Run banned word check on every name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (!value.trim()) {
      setNameError('Name is required')
      return
    }
    
    // Check with bad-words library (catches common profanity)
    if (profanityFilter.isProfane(value)) {
      setNameError('Name contains inappropriate words')
      return
    }
    
    // Also check against normalized custom banned words
    const norm = normalizeForCheck(value)
    for (const bw of bannedWords) {
      if (!bw) continue
      if (norm.includes(bw)) {
        setNameError('Name contains inappropriate words')
        return
      }
    }
    
    setNameError(null)
  }

  // Validate email on change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    
    if (!value.trim()) {
      setEmailError('Email is required')
      return
    }
    
    if (!validateEmail(value)) {
      setEmailError('Please enter a valid email address')
      return
    }
    
    setEmailError(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    // Block submit if any validation errors are present
    if (nameError || emailError) return
    setLoading(true)
    try {
      // clear previous form errors
      setEmailError(null)
      setPasswordError(null)
      setConfirmError(null)

      if (!email.trim()) {
        setEmailError('Email is required')
        setLoading(false)
        return
      }
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address')
        setLoading(false)
        return
      }
      if (!password) {
        setPasswordError('Password is required')
        setLoading(false)
        return
      }
      if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters long')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setConfirmError('Passwords do not match')
        setLoading(false)
        return
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      })
      const data = await res.json() as RegisterResponse
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Signup failed")
      }
      toast.success("Account created successfully! Please login to continue.")
      router.push('/login?force=1')
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
                  onChange={handleNameChange}
                  disabled={loading}
                />
                {nameError && <p className="text-sm text-red-600 mt-1">{nameError}</p>}
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
                  onChange={handleEmailChange}
                  disabled={loading}
                />
                {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
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
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); if (confirmError) setConfirmError(null); }}
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
                    onChange={(e) => { setConfirmPassword(e.target.value); if (confirmError) setConfirmError(null); }}
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
              {passwordError && <p className="text-sm text-red-600 mt-1">{passwordError}</p>}
              {confirmError && <p className="text-sm text-red-600 mt-1">{confirmError}</p>}
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


