"use client"

import { Suspense } from 'react'
import { UserSiteHeader } from './user-site-header'

export function UserSiteHeaderWrapper() {
  return (
    <Suspense fallback={
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      </header>
    }>
      <UserSiteHeader />
    </Suspense>
  )
}
