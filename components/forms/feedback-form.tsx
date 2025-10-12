"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Star, MessageSquare } from "lucide-react";
import { AuthTokenManager } from "@/utils/cookies";
import { FeedbackCategory } from "@/types/feedback";
import { Checkbox } from "@/components/ui/checkbox";

interface FeedbackFormProps {
  bookingId?: string;
  trigger?: React.ReactNode;
}

export function FeedbackForm({ bookingId, trigger }: FeedbackFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    category: "overall" as FeedbackCategory,
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const token = AuthTokenManager.getToken();
      if (!token) {
        toast.error("Please login to submit feedback");
        return;
      }

      const payload = {
        ...formData,
        rating,
        ...(bookingId && { booking: bookingId }),
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Feedback submitted successfully! It will be reviewed by our team."
        );
        setOpen(false);
        // Reset form
        setRating(0);
        setFormData({
          title: "",
          message: "",
          category: "overall",
          isPublic: true,
        });
      } else {
        toast.error(data.error || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("An error occurred while submitting feedback");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Leave Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Experience</DialogTitle>
          <DialogDescription>
            We'd love to hear about your stay at Amethyst Inn House. Your
            feedback helps us improve our service.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-center block">
              How would you rate your experience? *
            </Label>
            {renderStars()}
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: FeedbackCategory) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overall">Overall Experience</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="cleanliness">Cleanliness</SelectItem>
                <SelectItem value="amenities">Amenities</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="value">Value for Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Great stay with excellent service"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.title.length}/100
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Feedback *</Label>
            <Textarea
              id="message"
              placeholder="Tell us about your experience..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.message.length}/1000
            </p>
          </div>

          {/* Public Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Checkbox
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked: boolean) =>
                setFormData({ ...formData, isPublic: checked })
              }
            />
            <div className="space-y-0.5">
              <Label htmlFor="isPublic" className="cursor-pointer">
                Share publicly
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow this feedback to be displayed as a testimonial (subject to
                approval)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
