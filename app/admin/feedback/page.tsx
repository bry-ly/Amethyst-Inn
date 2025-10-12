"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { FeedbackDataTable } from "@/components/feedback/feedback-data-table";
import { AuthTokenManager } from "@/utils/cookies";
import { toast } from "sonner";
import { PageLoader } from "@/components/common/loading-spinner";

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    document.title = "Amethyst Inn - Feedback Management";
    checkAuthAndFetchFeedback();
  }, []);

  async function checkAuthAndFetchFeedback() {
    try {
      const token = AuthTokenManager.getToken();
      // Check if user is admin/staff using internal API so cookie can be used
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

      if (userData?.role !== "admin" && userData?.role !== "staff") {
        toast.error("Access denied. Admin privileges required.");
        router.push("/");
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
      if (!authToken) return;
      // Use internal API route so the httpOnly auth cookie (if present) is included
      const res = await fetch("/api/feedback", {
        headers: { authorization: `Bearer ${authToken}` },
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!res.ok) {
        console.error("Failed to fetch feedback:", res.status);
        toast.error("Failed to load feedback");
        return;
      }

      const data = await res.json();
      const feedbackData = Array.isArray(data) ? data : data?.data || data?.feedbacks || [];
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
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">Checking authorization...</p>
            </div>
          ) : (
            <FeedbackDataTable data={feedbacks} onFeedbackUpdated={handleFeedbackUpdated} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
