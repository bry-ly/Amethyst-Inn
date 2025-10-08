"use client"

import * as React from "react"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { SectionCards } from "@/components/dashboard/section-cards"
import { GridLoader } from "@/components/common/loading-spinner"
import { useDashboardData, type DashboardData } from "@/hooks/use-dashboard-data"

export function DashboardWrapper() {
  const { data: dashboardData, loading, error, refetch, isStale } = useDashboardData()
  const [cachedData, setCachedData] = React.useState<DashboardData | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const stored = sessionStorage.getItem("dashboard:data")
      return stored ? (JSON.parse(stored) as DashboardData) : null
    } catch {
      return null
    }
  })

  React.useEffect(() => {
    if (dashboardData) {
      setCachedData(dashboardData)
      try {
        sessionStorage.setItem("dashboard:data", JSON.stringify(dashboardData))
      } catch {
        // ignore storage errors
      }
    }
  }, [dashboardData])

  const displayData = dashboardData ?? cachedData

  // Show single loader for entire dashboard
  if (loading && !displayData) {
    return <GridLoader message="Loading dashboard..." />
  }

  // Show error state
  if (error && !displayData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">Unable to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show dashboard content
  if (!displayData) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-muted-foreground text-sm">
          {loading ? "Refreshing..." : isStale ? "Data may be out of date" : "Dashboard overview"}
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm font-medium text-primary hover:underline"
        >
          Refresh
        </button>
      </div>
      <SectionCards dashboardData={displayData} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive dashboardData={displayData} />
      </div>
    </div>
  )
}
