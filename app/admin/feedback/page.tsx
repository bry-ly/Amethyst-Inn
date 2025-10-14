"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FeedbackDataTable } from "@/components/feedback/feedback-data-table";
import { Unauthorized } from "@/components/ui/unauthorized";
import { AuthTokenManager } from "@/utils/cookies";
import { toast } from "sonner";
import { PageLoader } from "@/components/common/loading-spinner";

function AdminFeedbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Get URL parameters
  const feedbackId = searchParams.get('id');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  useEffect(() => {
    document.title = "Amethyst Inn - Feedback Management";
    checkAuthAndFetchFeedback();
  }, [feedbackId, status, category, page, limit]);

  async function checkAuthAndFetchFeedback() {
    try {
  const token = AuthTokenManager.getToken();
  // Check if user is admin using internal API so cookie can be used
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const authRes = await fetch("/api/auth/me", {
        cache: "no-store",
        headers,
        credentials: "same-origin",
      });

      if (!authRes.ok) {
        router.push("/login?next=/admin/feedback");
        return;
      }

      const userData = await authRes.json();

      if (userData?.role !== "admin") {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      setIsAuthorized(true);

      // Fetch feedback
      await fetchFeedback(token ?? undefined);
    } catch (error) {
      console.error("Auth/fetch error:", error);
      router.push("/login?next=/admin/feedback");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchFeedback(token?: string) {
    try {
      const authToken = token || AuthTokenManager.getToken();
      if (!authToken) {
        console.error("No auth token available");
        return;
      }
      
      console.log("Fetching feedback with token:", authToken ? "present" : "missing");
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('approved', status === 'approved' ? 'true' : 'false');
      if (category) queryParams.append('category', category);
      if (page) queryParams.append('page', page);
      if (limit) queryParams.append('limit', limit);
      
      const queryString = queryParams.toString();
      const url = `/api/feedback${queryString ? `?${queryString}` : ''}`;
      
      // Use internal API route so the httpOnly auth cookie (if present) is included
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${authToken}` },
        cache: "no-store",
        credentials: "same-origin",
      });

      console.log("Feedback response status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch feedback:", res.status, errorText);
        toast.error(`Failed to load feedback: ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("Feedback response data:", data);
      
      const feedbackData = Array.isArray(data) ? data : data?.data || data?.feedbacks || [];
      console.log("Parsed feedback data:", feedbackData.length, "items");
      
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Error loading feedback");
    }
  }

  const handleFeedbackUpdated = () => {
    fetchFeedback();
  };

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
          {isLoading ? (
            <PageLoader message="Loading feedback..." />
          ) : !isAuthorized ? (
            <Unauthorized
              title="Admin Access Required"
              message="This feedback management page is restricted to administrators only. You need admin privileges to view and manage customer feedback."
            />
          ) : (
            <FeedbackDataTable data={feedbacks} onFeedbackUpdated={handleFeedbackUpdated} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={<PageLoader message="Loading feedback..." />}>
      <AdminFeedbackContent />
    </Suspense>
  );
}
