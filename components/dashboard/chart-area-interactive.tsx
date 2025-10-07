"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useDashboardData } from "@/hooks/use-dashboard-data"

export const description = "An interactive area chart showing booking and revenue trends"

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [chartType, setChartType] = React.useState("bookings")
  const { data: dashboardData } = useDashboardData()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Only check mounted state, loading is handled by wrapper
  if (!mounted || !dashboardData) {
    return null
  }

  const { chartData } = dashboardData

  const filteredData = chartData.filter((item: any) => {
    const date = new Date(item.date)
    const today = new Date()
    let daysToSubtract = 30
    if (timeRange === "7d") {
      daysToSubtract = 7
    } else if (timeRange === "90d") {
      daysToSubtract = 90
    }
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const formatValue = (value: number) => {
    if (chartType === "revenue") {
      return `₱${value.toLocaleString()}`
    }
    return value.toString()
  }

  const getChartTitle = () => {
    if (chartType === "revenue") {
      return "Revenue Trends"
    }
    return "Booking Trends"
  }

  const getChartDescription = () => {
    const rangeText = timeRange === "7d" ? "last 7 days" : 
                     timeRange === "30d" ? "last 30 days" : "last 90 days"
    if (chartType === "revenue") {
      return `Daily revenue for the ${rangeText}`
    }
    return `Daily bookings for the ${rangeText}`
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {getChartDescription()}
          </span>
          <span className="@[540px]/card:hidden">
            {timeRange === "7d" ? "Last 7 days" : 
             timeRange === "30d" ? "Last 30 days" : "Last 90 days"}
          </span>
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2 @[540px]/card:flex-row @[540px]/card:items-center">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-full @[540px]/card:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookings">Bookings</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(value) => value && setTimeRange(value)}
              className="justify-start"
            >
              <ToggleGroupItem value="7d" aria-label="7 days">
                7d
              </ToggleGroupItem>
              <ToggleGroupItem value="30d" aria-label="30 days">
                30d
              </ToggleGroupItem>
              <ToggleGroupItem value="90d" aria-label="90 days">
                90d
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardAction>
      </CardHeader>
      <ChartContainer
        config={chartConfig}
        className="h-64 w-full"
      >
        <AreaChart
          accessibilityLayer
          data={filteredData}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                }}
                formatter={(value) => [
                  formatValue(Number(value)),
                  chartType === "revenue" ? "Revenue" : "Bookings",
                ]}
              />
            }
          />
          <Area
            dataKey={chartType}
            type="natural"
            fill="var(--color-bookings)"
            fillOpacity={0.4}
            stroke="var(--color-bookings)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </Card>
  )
}