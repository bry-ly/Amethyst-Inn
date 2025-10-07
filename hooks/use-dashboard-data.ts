import { useApiData } from './use-api-data'

export interface DashboardMetrics {
  totalRevenue: number
  monthlyRevenue: number
  totalBookings: number
  activeBookings: number
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  maintenanceRooms: number
  occupancyRate: number
  totalUsers: number
  guestUsers: number
  staffUsers: number
}

export interface ChartDataPoint {
  date: string
  bookings: number
  revenue: number
}

export interface DashboardData {
  metrics: DashboardMetrics
  chartData: ChartDataPoint[]
}

export function useDashboardData() {
  return useApiData<DashboardData>('/api/dashboard', {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  })
}
