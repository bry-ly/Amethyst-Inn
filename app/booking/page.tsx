"use client";
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import BookingDataTable from '@/components/booking/booking-data-table';
import { Skeleton } from '@/components/ui/skeleton';

function BookingContent() {
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const bookingId = searchParams.get('id');
  const status = searchParams.get('status');
  const guestId = searchParams.get('guestId');
  const roomId = searchParams.get('roomId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  
  React.useEffect(() => {
    document.title = "Amethyst Inn - Bookings";
  }, [bookingId, status, guestId, roomId, startDate, endDate, page, limit]);

  return (
    <div className="mt-4 lg:mt-6">
      <BookingDataTable />
    </div>
  );
}

export default function BookingPage() {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <Suspense fallback={
          <div className="mt-4 lg:mt-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }>
          <BookingContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
