"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Feedback, FeedbackListResponse } from "@/types/feedback";
import { AuthTokenManager } from "@/utils/cookies";
import { Star, CheckCircle, XCircle, Eye, Trash2, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const token = AuthTokenManager.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    fetchFeedback();
  }, [filter, router]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const token = AuthTokenManager.getToken();
      const queryParams = new URLSearchParams();
      
      if (filter === "pending") {
        queryParams.append("approved", "false");
      } else if (filter === "approved") {
        queryParams.append("approved", "true");
      }

      const response = await fetch(`/api/feedback?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: FeedbackListResponse = await response.json();

      if (data.success) {
        setFeedbacks(data.data);
      } else {
        toast.error("Failed to fetch feedback");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("An error occurred while fetching feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveFeedback = async () => {
    if (!selectedFeedback) return;

    setActionLoading(true);
    try {
      const token = AuthTokenManager.getToken();
      const response = await fetch(
        `/api/feedback/${selectedFeedback._id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isApproved: true,
            responseMessage: responseMessage || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Feedback approved successfully");
        setIsApproveDialogOpen(false);
        setResponseMessage("");
        setSelectedFeedback(null);
        fetchFeedback();
      } else {
        toast.error(data.error || "Failed to approve feedback");
      }
    } catch (error) {
      console.error("Error approving feedback:", error);
      toast.error("An error occurred while approving feedback");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFeedback = async () => {
    if (!selectedFeedback) return;

    setActionLoading(true);
    try {
      const token = AuthTokenManager.getToken();
      const response = await fetch(
        `/api/feedback/${selectedFeedback._id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isApproved: false,
            responseMessage: responseMessage || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success("Feedback rejected");
        setIsRejectDialogOpen(false);
        setResponseMessage("");
        setSelectedFeedback(null);
        fetchFeedback();
      } else {
        toast.error(data.error || "Failed to reject feedback");
      }
    } catch (error) {
      console.error("Error rejecting feedback:", error);
      toast.error("An error occurred while rejecting feedback");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const token = AuthTokenManager.getToken();
      const response = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Feedback deleted successfully");
        fetchFeedback();
      } else {
        toast.error(data.error || "Failed to delete feedback");
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error("An error occurred while deleting feedback");
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const matchesSearch =
      feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Feedback Management
          </h1>
          <p className="text-muted-foreground">
            Review and manage guest feedback and testimonials
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <CardTitle>All Feedback</CardTitle>
              <CardDescription>
                {filteredFeedbacks.length} feedback items
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feedback</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeedbacks.map((feedback) => (
                    <TableRow key={feedback._id}>
                      <TableCell className="font-medium">
                        {feedback.user.name}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {feedback.title}
                      </TableCell>
                      <TableCell>{renderStars(feedback.rating)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {feedback.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {feedback.isApproved ? (
                          <Badge className="bg-green-500 hover:bg-green-600">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!feedback.isApproved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFeedback(feedback);
                                setIsApproveDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              setIsRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFeedback(feedback._id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User</p>
                <p className="text-lg">{selectedFeedback.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedFeedback.user.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="text-lg">{selectedFeedback.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rating</p>
                {renderStars(selectedFeedback.rating)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <Badge variant="outline" className="capitalize">
                  {selectedFeedback.category}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="text-base whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex gap-2 items-center">
                  {selectedFeedback.isApproved ? (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                  {selectedFeedback.isPublic ? (
                    <Badge variant="outline">Public</Badge>
                  ) : (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
              </div>
              {selectedFeedback.response?.message && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Admin Response
                  </p>
                  <p className="text-base">{selectedFeedback.response.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    By {selectedFeedback.response.respondedBy?.name} on{" "}
                    {selectedFeedback.response.respondedAt
                      ? new Date(selectedFeedback.response.respondedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Feedback</DialogTitle>
            <DialogDescription>
              This feedback will be approved and may be displayed publicly as a
              testimonial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Response Message (Optional)
              </label>
              <Textarea
                placeholder="Thank you for your feedback..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setResponseMessage("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleApproveFeedback} disabled={actionLoading}>
              {actionLoading ? "Approving..." : "Approve Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Feedback</DialogTitle>
            <DialogDescription>
              This feedback will be marked as rejected and will not be displayed
              publicly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Response Message (Optional)
              </label>
              <Textarea
                placeholder="Reason for rejection..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setResponseMessage("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectFeedback}
              disabled={actionLoading}
            >
              {actionLoading ? "Rejecting..." : "Reject Feedback"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
