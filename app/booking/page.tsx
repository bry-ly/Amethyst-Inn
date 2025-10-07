"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import {
  Calendar,
  Users,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useRooms } from "@/hooks/use-rooms";

export default function BookingPage() {
  const router = useRouter();
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [formData, setFormData] = useState({
    checkInDate: "",
    checkOutDate: "",
    adults: 1,
    children: 0,
    specialRequests: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get rooms data
  const { rooms, loading: roomsLoading } = useRooms();

  const selectedRoom = rooms.find(room => room._id === selectedRoomId);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRoom) {
      toast.error("Please select a room");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total price
      const totalNights = Math.ceil(
        (new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const totalPrice = totalNights * selectedRoom.pricePerNight;

      // Create booking data
      const bookingData = {
        roomId: selectedRoom._id,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        guests: {
          adults: formData.adults,
          children: formData.children,
        },
        totalPrice,
        specialRequests: formData.specialRequests || undefined,
      };

      // Submit to API
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers,
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        toast.success("Booking created successfully!", {
          description: "Your reservation has been confirmed. You will receive a confirmation email shortly.",
          duration: 5000,
        });
        router.push("/dashboard");
      } else {
        throw new Error(data.error || data.message || "Failed to create booking");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Failed to create booking", {
        description: error.message || "Please try again or contact us directly.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const totalNights =
    formData.checkInDate && formData.checkOutDate
      ? Math.ceil(
          (new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      : 0;
  const totalPrice = selectedRoom ? totalNights * selectedRoom.pricePerNight : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Book Your Stay</h1>
          <p className="text-muted-foreground mt-2">
            Complete your reservation at Amethyst Inn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Room Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select Room</h2>
            {roomsLoading ? (
              <div className="text-center py-8">Loading rooms...</div>
            ) : (
              <Select
                value={selectedRoomId}
                onValueChange={setSelectedRoomId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room._id} value={room._id}>
                      Room {room.number} - {room.type} (₱{room.pricePerNight}/night)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Stay Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Stay Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInDate">Check-in Date</Label>
                <Input
                  id="checkInDate"
                  type="date"
                  min={today}
                  value={formData.checkInDate}
                  onChange={(e) => handleInputChange("checkInDate", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkOutDate">Check-out Date</Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  min={formData.checkInDate || today}
                  value={formData.checkOutDate}
                  onChange={(e) => handleInputChange("checkOutDate", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults</Label>
                <Select
                  value={formData.adults.toString()}
                  onValueChange={(value) => handleInputChange("adults", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1} {i + 1 === 1 ? "Adult" : "Adults"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children</Label>
                <Select
                  value={formData.children.toString()}
                  onValueChange={(value) => handleInputChange("children", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 6 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} {i === 1 ? "Child" : "Children"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Special Requests (Optional)
            </h2>
            <div className="space-y-2">
              <Label htmlFor="specialRequests">
                Any special requirements or requests?
              </Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange("specialRequests", e.target.value)}
                placeholder="e.g., Early check-in, late check-out, dietary requirements, accessibility needs..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* Price Summary */}
          {selectedRoom && totalNights > 0 && (
            <div className="border-t pt-6 space-y-4">
              <h2 className="text-xl font-semibold">Price Summary</h2>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Room {selectedRoom.number} ({selectedRoom.type})</span>
                  <span>₱{selectedRoom.pricePerNight}/night</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{totalNights} nights</span>
                  <span>₱{totalPrice}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>₱{totalPrice}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                *Final price may include taxes and fees. A booking confirmation will be sent after submission.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !selectedRoom || !formData.checkInDate || !formData.checkOutDate}
            >
              {isSubmitting ? "Creating Booking..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}