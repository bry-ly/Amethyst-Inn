import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amethyst Inn - Login",
}

// Accept searchParams for redirect/next URL
type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    message?: string;
  }>;
}

export default async function Page({ searchParams }: LoginPageProps) {
  const params = await searchParams
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

















