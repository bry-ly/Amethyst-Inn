"use client"

import * as React from "react"
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive"
import { SectionCards } from "@/components/dashboard/section-cards"
import { GridLoader } from "@/components/common/loading-spinner"
import { useDashboardData } from "@/hooks/use-dashboard-data"

export function DashboardWrapper() {
  const { data: dashboardData, loading, error } = useDashboardData()

  // Show single loader for entire dashboard
  if (loading) {
    return <GridLoader message="Loading dashboard..." />
  }

  // Show error state
  if (error || !dashboardData) {
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
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
    </div>
  )
}
