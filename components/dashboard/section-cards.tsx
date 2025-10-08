"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp, IconBed, IconUsers, IconCalendar, IconCurrencyPeso } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DashboardData } from "@/hooks/use-dashboard-data"

type SectionCardsProps = {
  dashboardData?: DashboardData | null
}

export function SectionCards({ dashboardData }: SectionCardsProps) {
  if (!dashboardData) {
    return null
  }

  const { metrics } = dashboardData

  // Calculate trends (simplified - in real app you'd compare with previous period)
  const revenueTrend = metrics.monthlyRevenue > 0 ? 'up' : 'neutral'
  const bookingTrend = metrics.activeBookings > 0 ? 'up' : 'neutral'
  const occupancyTrend = metrics.occupancyRate > 50 ? 'up' : 'down'
  const userTrend = metrics.guestUsers > 0 ? 'up' : 'neutral'

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <span className="inline-flex items-center gap-1"><IconCurrencyPeso className="size-5" />{metrics.totalRevenue.toLocaleString()}</span>
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="tabular-nums">
              {revenueTrend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              <span className="inline-flex items-baseline gap-1 tabular-nums leading-none whitespace-nowrap">
                <IconCurrencyPeso className="size-4 translate-y-[1px]" />
                {metrics.monthlyRevenue.toLocaleString()}
              </span>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenueTrend === 'up' ? 'Revenue growing' : 'Revenue stable'} 
            {revenueTrend === 'up' ? <IconTrendingUp className="size-4" /> : <IconCurrencyPeso className="size-4 " />}
          </div>
          <div className="text-muted-foreground">
            <span className="inline-flex items-baseline gap-1 tabular-nums leading-none whitespace-nowrap">
              <IconCurrencyPeso className="size-4 translate-y-[1px]" />
              {metrics.monthlyRevenue.toLocaleString()}
            </span>{' '}this month
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Bookings</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.activeBookings}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {bookingTrend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {metrics.totalBookings} total
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {bookingTrend === 'up' ? 'Bookings active' : 'No active bookings'} 
            {bookingTrend === 'up' ? <IconTrendingUp className="size-4" /> : <IconCalendar className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {metrics.totalBookings} total bookings
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Room Occupancy</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.occupancyRate.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {occupancyTrend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {metrics.occupiedRooms}/{metrics.totalRooms}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {occupancyTrend === 'up' ? 'High occupancy' : 'Low occupancy'} 
            {occupancyTrend === 'up' ? <IconTrendingUp className="size-4" /> : <IconBed className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {metrics.availableRooms} rooms available
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Guests</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics.guestUsers}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {userTrend === 'up' ? <IconTrendingUp /> : <IconTrendingDown />}
              {metrics.totalUsers} users
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {userTrend === 'up' ? 'Guest registrations' : 'No guests yet'} 
            {userTrend === 'up' ? <IconTrendingUp className="size-4" /> : <IconUsers className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {metrics.staffUsers} staff members
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}