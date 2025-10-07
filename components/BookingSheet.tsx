"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar1 } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Calendar,
  CalendarDays,
  Users,
  Phone,
  Mail,
  MessageSquare,
  CreditCard,
  Eye,
  CheckCircle,
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

interface BookingSheetProps {
  children: React.ReactNode;
  room?: Room;
}

export function BookingSheet({ children, room }: BookingSheetProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'review'>('form');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(room?._id || "");
  const [formData, setFormData] = useState({
    checkInDate: "",
    checkOutDate: "",
    adults: 1,
    children: 0,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
    nationality: "",
    purpose: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom validation
    if (!selectedRoomId) {
      toast.error("Please select a room");
      return;
    }
    
    if (!formData.checkInDate) {
      toast.error("Please select a check-in date");
      return;
    }
    
    if (!formData.checkOutDate) {
      toast.error("Please select a check-out date");
      return;
    }
    
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please fill in your name");
      return;
    }
    
    if (!formData.email) {
      toast.error("Please provide your email address");
      return;
    }
    
    if (!formData.phone) {
      toast.error("Please provide your phone number");
      return;
    }
    
    if (!formData.nationality) {
      toast.error("Please provide your nationality");
      return;
    }
    
    if (!formData.purpose) {
      toast.error("Please select the purpose of your visit");
      return;
    }

    // Move to review step
    setCurrentStep('review');
  };

  const handleBookingSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Calculate total price
      const totalNights = Math.ceil(
        (new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      
      // For now, we'll use a default price since we don't have room data in the sheet
      // In a real implementation, you'd fetch the room data or pass it as a prop
      const roomPrice = 150; // Default price
      const totalPrice = totalNights * roomPrice;

      // Create booking data according to the API service interface
      const bookingData = {
        roomId: selectedRoomId, // Room ID for the API service
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        guests: {
          adults: formData.adults,
          children: formData.children,
        },
        totalPrice,
        specialRequests: formData.specialRequests || undefined,
        // Note: The API service will handle the backend schema mapping
        // Guest information (firstName, lastName, email, phone, nationality, purpose) 
        // would typically be stored in the User model and referenced via the guest field
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
        toast.success("Booking request submitted successfully!", {
          description: "We will contact you within 24 hours to confirm your reservation.",
          duration: 5000,
        });
        setOpen(false);
        setCurrentStep('form');
        // Reset form
        setFormData({
          checkInDate: "",
          checkOutDate: "",
          adults: 1,
          children: 0,
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          specialRequests: "",
          nationality: "",
          purpose: "",
        });
      } else {
        throw new Error(data.error || data.message || "Failed to create booking");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Failed to submit booking request", {
        description: "Please try again or contact us directly.",
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
  const roomPrice = 150; // Default price - in real implementation, get from room data
  const totalPrice = totalNights * roomPrice;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto ml-3.5">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {currentStep === 'form' ? 'Book Your Stay' : 'Review Your Booking'}
          </SheetTitle>
          <SheetDescription>
            {currentStep === 'form' 
              ? 'Complete your reservation at Amethyst Inn. Fill in your details below.'
              : 'Please review your booking details before confirming your reservation.'
            }
          </SheetDescription>
        </SheetHeader>

        {currentStep === 'form' ? (
          <div className="p-6 space-y-6">
            {/* Room Summary */}
            <div className="border-b pb-4">
              <h3 className="text-xl font-semibold">Room 101 - Deluxe</h3>
              <p className="text-muted-foreground">Deluxe • ₱150 per night</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Up to 4 guests</span>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
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
                      onChange={(e) => handleInputChange('checkInDate', e.target.value)}
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
                      onChange={(e) => handleInputChange('checkOutDate', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adults">Adults</Label>
                    <Select value={formData.adults.toString()} onValueChange={(value) => handleInputChange('adults', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} {i + 1 === 1 ? 'Adult' : 'Adults'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="children">Children</Label>
                    <Select value={formData.children.toString()} onValueChange={(value) => handleInputChange('children', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 6 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i} {i === 1 ? 'Child' : 'Children'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Guest Information
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      placeholder="e.g., American"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit</Label>
                    <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leisure">Leisure</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="family">Family Visit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                  <Label htmlFor="specialRequests">Any special requirements or requests?</Label>
                  <Textarea
                    id="specialRequests"
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
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
                      <span>₱{roomPrice} × {totalNights} nights</span>
                      <span>₱{totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-medium text-base border-t pt-2">
                      <span>Total</span>
                      <span>₱{totalPrice}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *Final price may include taxes and fees. A booking confirmation will be sent after submission.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
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
                  {isSubmitting ? 'Submitting...' : 'Review Details'}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* Review Step */
          <div className="p-6 space-y-6">
            {/* Booking Summary */}
            <div className="border-b pb-4">
              <h3 className="text-xl font-semibold">Room 101 - Deluxe</h3>
              <p className="text-muted-foreground">Deluxe • ₱150 per night</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{formData.adults + formData.children} {formData.adults + formData.children === 1 ? 'Guest' : 'Guests'}</span>
              </div>
            </div>

            {/* Review Details */}
            <div className="space-y-6">
              <h4 className="font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Booking Details
              </h4>
              
              <div className="bg-muted/30 rounded-lg p-4 space-y-4">
                {/* Stay Details */}
                <div className="space-y-3">
                  <h5 className="font-medium text-base">Stay Details</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Check-in:</span>
                      <p className="font-medium">{formData.checkInDate ? new Date(formData.checkInDate).toLocaleDateString() : 'Not selected'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out:</span>
                      <p className="font-medium">{formData.checkOutDate ? new Date(formData.checkOutDate).toLocaleDateString() : 'Not selected'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adults:</span>
                      <p className="font-medium">{formData.adults} {formData.adults === 1 ? 'Adult' : 'Adults'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Children:</span>
                      <p className="font-medium">{formData.children} {formData.children === 1 ? 'Child' : 'Children'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Guests:</span>
                      <p className="font-medium">{formData.adults + formData.children} {formData.adults + formData.children === 1 ? 'Guest' : 'Guests'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nights:</span>
                      <p className="font-medium">{totalNights} {totalNights === 1 ? 'night' : 'nights'}</p>
                    </div>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="space-y-3">
                  <h5 className="font-medium text-base">Guest Information</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{formData.phone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nationality:</span>
                      <p className="font-medium">{formData.nationality}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Purpose:</span>
                      <p className="font-medium capitalize">{formData.purpose}</p>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {formData.specialRequests && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-base">Special Requests</h5>
                    <p className="text-sm bg-background/50 p-3 rounded-md border">
                      {formData.specialRequests}
                    </p>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              {totalNights > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium">Price Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>₱{roomPrice} × {totalNights} {totalNights === 1 ? 'night' : 'nights'}</span>
                      <span>₱{totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-medium text-base border-t pt-2">
                      <span>Total</span>
                      <span>₱{totalPrice}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *Final price may include taxes and fees. A booking confirmation will be sent after submission.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep('form')} 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back to Edit
                </Button>
                <Button 
                  type="button" 
                  onClick={handleBookingSubmit}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
