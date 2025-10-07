import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Calendar,
  Users,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

// Define Room interface locally
interface Room {
  _id: string;
  number: string;
  images?: string[];
  type: 'single' | 'double' | 'suite' | 'deluxe' | 'family' | 'presidential' | 'standard' | 'premium';
  pricePerNight: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
  description?: string;
  amenities?: string[];
  capacity?: {
    adults: number;
    children: number;
  };
  size?: number;
  floor?: number;
  features?: {
    hasBalcony?: boolean;
    hasSeaView?: boolean;
    hasKitchen?: boolean;
    hasJacuzzi?: boolean;
    isAccessible?: boolean;
  };
  isActive?: boolean;
  isAvailable?: boolean;
  activeBookings?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BookingFormProps {
  room: Room;
  onClose: () => void;
}

export function BookingForm({ room, onClose }: BookingFormProps) {
  const [formData, setFormData] = useState({
    checkInDate: "",
    checkOutDate: "",
    adults: 1,
    children: 0,
    specialRequests: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Calculate total price
      const totalNights = Math.ceil(
        (new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const totalPrice = totalNights * room.pricePerNight;

      // Create booking data
      const bookingData = {
        roomId: room._id,
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
        onClose();
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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const today = new Date().toISOString().split("T")[0];
  const totalNights =
    formData.checkInDate && formData.checkOutDate
      ? Math.ceil(
          (new Date(formData.checkOutDate).getTime() -
            new Date(formData.checkInDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
  const totalPrice = totalNights * room.pricePerNight;

  return (
    <div className="p-6 space-y-6">
      {/* Room Summary */}
      <div className="border-b pb-4">
        <h3 className="text-xl font-semibold">Room {room.number}</h3>
        <p className="text-muted-foreground">
          {room.type} • ₱{room.pricePerNight} per night
        </p>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Up to {room.capacity ? room.capacity.adults + room.capacity.children : 2} guests ({room.capacity?.adults || 2} adults, {room.capacity?.children || 0} children)</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dates and Guests */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Stay Details
          </h4>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
                  {Array.from({ length: room.capacity?.adults || 2 }, (_, i) => (
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
                  {Array.from({ length: (room.capacity?.children || 0) + 1 }, (_, i) => (
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
          <h4 className="font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Special Requests (Optional)
          </h4>
          <div className="space-y-2">
            <Label htmlFor="specialRequests">
              Any special requirements or requests?
            </Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange("specialRequests", e.target.value)
              }
              placeholder="e.g., Early check-in, late check-out, dietary requirements, accessibility needs..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        {/* Price Summary */}
        {totalNights > 0 && (
          <div className="border-t pt-4 space-y-2">
            <h4 className="font-medium">Price Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>
                  ₱{room.pricePerNight} × {totalNights} nights
                </span>
                <span>₱{totalPrice}</span>
              </div>
              <div className="flex justify-between font-medium text-base border-t pt-2">
                <span>Total</span>
                <span>₱{totalPrice}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              *Final price may include taxes and fees. A booking confirmation
              will be sent after submission.
            </p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Booking Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}