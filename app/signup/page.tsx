import { SignupForm } from "@/components/auth/signup-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Amethyst Inn - Sign Up",
}

export default function Page() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}








