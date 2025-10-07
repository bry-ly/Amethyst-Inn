"use client";
import React from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import BookingDataTable from '@/components/booking/booking-data-table';

export default function BookingPage() {
  React.useEffect(() => {
    document.title = "Amethyst Inn - Bookings";
  }, []);

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
        <div className="mt-4 lg:mt-6">
          <BookingDataTable />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
