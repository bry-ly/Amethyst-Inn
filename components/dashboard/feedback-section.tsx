"use client";

import { useState, useCallback, useEffect } from "react";
import { Star, Send, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AuthTokenManager } from "@/utils/cookies";
import type { Feedback, CreateFeedbackPayload, FeedbackCategory } from "@/types/feedback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FeedbackSectionProps {
  userId?: string;
}

const categoryLabels: Record<FeedbackCategory, string> = {
  service: "Service",
  cleanliness: "Cleanliness",
  amenities: "Amenities",
  location: "Location",
  value: "Value for Money",
  overall: "Overall Experience",
};

function StarRating({ rating, onRatingChange, readOnly = false }: { rating: number; onRatingChange?: (rating: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readOnly && onRatingChange?.(star)}
          disabled={readOnly}
          className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`size-6 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function FeedbackCard({ feedback, onDelete, onEdit }: { feedback: Feedback; onDelete: (feedback: Feedback) => void; onEdit: (feedback: Feedback) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{feedback.title}</CardTitle>
            <div className="flex items-center gap-2">
              <StarRating rating={feedback.rating} readOnly />
              <Badge variant="outline" className="text-xs">
                {categoryLabels[feedback.category]}
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(feedback)}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(feedback)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{feedback.message}</p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
          <Badge variant={feedback.isApproved ? "default" : "secondary"}>
            {feedback.isApproved ? "Approved" : "Pending Review"}
          </Badge>
        </div>
        
        {feedback.response?.message && (
          <div className="border-l-2 border-primary pl-3 space-y-1">
            <p className="text-xs font-medium">Response from {feedback.response.respondedBy?.name || "Staff"}:</p>
            <p className="text-sm">{feedback.response.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FeedbackSection({ userId }: FeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [formData, setFormData] = useState<CreateFeedbackPayload>({
    rating: 5,
    category: "overall",
    title: "",
    message: "",
    isPublic: true,
  });

  const loadFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const token = AuthTokenManager.getToken();
      const queryParams = userId ? `?userId=${userId}` : "";
      
      const res = await fetch(`/api/feedback${queryParams}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to load feedback");
      }

      const data = await res.json();
      setFeedbacks(data.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = AuthTokenManager.getToken();
      if (!token) {
        toast.error("Please log in to submit feedback");
        return;
      }

      const url = editingFeedback 
        ? `/api/feedback/${editingFeedback._id}` 
        : "/api/feedback";
      
      const method = editingFeedback ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to submit feedback");
      }

      toast.success(editingFeedback ? "Feedback updated successfully" : "Feedback submitted successfully. It will be reviewed by our team.");
      setIsDialogOpen(false);
      setEditingFeedback(null);
      setFormData({
        rating: 5,
        category: "overall",
        title: "",
        message: "",
        isPublic: true,
      });
      loadFeedbacks();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      setIsDeleting(true);
      const token = AuthTokenManager.getToken();
      const res = await fetch(`/api/feedback/${deleteTarget._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete feedback");
      }

      toast.success("Feedback deleted successfully");
      loadFeedbacks();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete feedback");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const requestDelete = (feedback: Feedback) => {
    setDeleteTarget(feedback);
  };

  const handleEdit = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setFormData({
      rating: feedback.rating,
      category: feedback.category,
      title: feedback.title,
      message: feedback.message,
      isPublic: feedback.isPublic,
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingFeedback(null);
    setFormData({
      rating: 5,
      category: "overall",
      title: "",
      message: "",
      isPublic: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Feedback & Reviews</h2>
          <p className="text-muted-foreground">
            Share your experience and help us improve our service
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFeedback ? "Edit Feedback" : "Submit Feedback"}</DialogTitle>
              <DialogDescription>
                Share your thoughts about your stay with us. Your feedback helps us improve.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rating">Rating *</Label>
                <StarRating
                  rating={formData.rating}
                  onRatingChange={(rating) => setFormData({ ...formData, rating })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: FeedbackCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your experience"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your Feedback *</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your experience..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  maxLength={1000}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/1000 characters
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFeedback ? "Update" : "Submit"} Feedback
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No feedback yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Share your experience with us!
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Submit Your First Feedback
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {feedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback._id}
              feedback={feedback}
                onDelete={requestDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected feedback will be permanently removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
