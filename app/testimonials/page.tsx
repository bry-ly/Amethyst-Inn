"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Feedback, FeedbackListResponse } from "@/types/feedback";
import { Star, MessageCircle } from "lucide-react";
import { Footer2 } from "@/components/ui/footer2";
import HeaderSection from "@/components/common/header-section";
import { AuthTokenManager } from "@/utils/cookies";

export default function TestimonialsPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchFeedback();
    checkAuth();
  }, [filter]);

  const checkAuth = async () => {
    try {
      const token = AuthTokenManager.getToken();
      if (token) {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }
  };

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      // Fetch only approved and public feedback
      const queryParams = new URLSearchParams({
        approved: "true",
      });

      if (filter !== "all") {
        queryParams.append("category", filter);
      }

      const response = await fetch(`/api/feedback?${queryParams.toString()}`);
      const data: FeedbackListResponse = await response.json();

      if (data.success) {
        // Sort by rating and date
        const sorted = data.data.sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setFeedbacks(sorted);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const categories = [
    { value: "all", label: "All Feedback" },
    { value: "overall", label: "Overall Experience" },
    { value: "service", label: "Service" },
    { value: "cleanliness", label: "Cleanliness" },
    { value: "amenities", label: "Amenities" },
    { value: "location", label: "Location" },
    { value: "value", label: "Value for Money" },
  ];

  return (
    <main className="min-h-screen bg-background">
      <HeaderSection
        user={user}
        isLoading={false}
        isClient={isClient}
        isMobileMenuOpen={false}
        onToggleMobileMenu={() => {}}
        onCloseMobileMenu={() => {}}
        onBookingClick={() => {}}
        onLogout={async () => {
          AuthTokenManager.clearToken();
          setUser(null);
          window.location.href = "/";
        }}
      />

      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-poppins">
              Guest Testimonials
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-roboto">
              Read what our guests have to say about their experience at Amethyst
              Inn House
            </p>
          </div>

          {/* Filter */}
          <div className="mb-8 flex justify-center">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Testimonials Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">
                No testimonials available yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedbacks.map((feedback) => (
                <Card
                  key={feedback._id}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Rating */}
                    <div className="flex items-center justify-between">
                      {renderStars(feedback.rating)}
                      <Badge variant="outline" className="capitalize">
                        {feedback.category}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-lg font-poppins">
                      {feedback.title}
                    </h3>

                    {/* Message */}
                    <p className="text-muted-foreground font-roboto italic">
                      "{feedback.message}"
                    </p>

                    {/* User Info */}
                    <div className="pt-4 border-t">
                      <p className="font-medium font-poppins">
                        {feedback.user.name}
                      </p>
                      <p className="text-sm text-muted-foreground font-roboto">
                        {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Admin Response */}
                    {feedback.response?.message && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Response from Management:
                        </p>
                        <p className="text-sm font-roboto">
                          {feedback.response.message}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats */}
          {!loading && feedbacks.length > 0 && (
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-8 p-6 bg-muted rounded-lg">
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {feedbacks.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Reviews
                  </p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {(
                      feedbacks.reduce((acc, f) => acc + f.rating, 0) /
                      feedbacks.length
                    ).toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average Rating
                  </p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {Math.round(
                      (feedbacks.filter((f) => f.rating >= 4).length /
                        feedbacks.length) *
                        100
                    )}
                    %
                  </p>
                  <p className="text-sm text-muted-foreground">
                    4+ Star Reviews
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex items-center gap-2 justify-center">
        <Footer2 />
      </div>
    </main>
  );
}
