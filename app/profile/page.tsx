"use client"
import { SiteHeader } from '@/components/layout/site-header'
import UserProfileDashboard from '@/components/dashboard/user-profile-dashboard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'

export default function ProfilePage() {
  React.useEffect(() => {
    document.title = "Amethyst Inn - Profile";
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>
        <UserProfileDashboard />
      </div>
    </main>
  )
}
