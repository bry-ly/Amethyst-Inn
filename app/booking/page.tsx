"use client";
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import BookingDataTable from '@/components/booking/booking-data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Unauthorized } from '@/components/ui/unauthorized';
import { AuthTokenManager } from '@/utils/cookies';
import { PageLoader } from '@/components/common/loading-spinner';

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Get URL parameters
  const bookingId = searchParams.get('id');
  const status = searchParams.get('status');
  const guestId = searchParams.get('guestId');
  const roomId = searchParams.get('roomId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  
  useEffect(() => {
    document.title = "Amethyst Inn - Bookings";
    checkAuth();
  }, [bookingId, status, guestId, roomId, startDate, endDate, page, limit]);

  async function checkAuth() {
    try {
      const token = AuthTokenManager.getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const authRes = await fetch('/api/auth/me', {
        cache: 'no-store',
        headers,
        credentials: 'same-origin',
      });

      if (!authRes.ok) {
        router.push("/login?next=/booking");
        return;
      }

      const userData = await authRes.json();
      
      if (userData?.role !== "admin") {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/login?next=/booking");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <PageLoader message="Checking authorization..." />;
  }

  if (!isAuthorized) {
    return (
      <Unauthorized
        title="Admin Access Required"
        message="This booking management page is restricted to administrators only. You need admin privileges to view and manage bookings."
      />
    );
  }

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
