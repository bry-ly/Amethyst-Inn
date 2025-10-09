
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar1 } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StripeProvider from "@/components/providers/StripeProvider";
import CheckoutForm from "@/components/payment/CheckoutForm";

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
  guestCapacity?: number;
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
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BookingSheet({ children, room, initialOpen = false, onOpenChange }: BookingSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [currentStep, setCurrentStep] = useState<'form' | 'review' | 'payment'>('form');

  // Sync internal state with prop changes
  React.useEffect(() => {
    setOpen(initialOpen);
  }, [initialOpen]);

  // Notify parent when open state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const [selectedRoomId, setSelectedRoomId] = useState<string>(room?._id || "");
  const [bookingId, setBookingId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [payWithStripe, setPayWithStripe] = useState<boolean>(false);
  const [bookingType, setBookingType] = useState<'booking' | 'reservation'>('booking');
  const [formData, setFormData] = useState({
    checkInDate: "",
    checkInTime: "14:00",
    checkOutDate: "",
    checkOutTime: "11:00",
    guestCount: 1,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
    nationality: "",
    purpose: "",
    paymentMethod: "cash" as 'cash' | 'card' | 'stripe' | 'paypal' | 'bank_transfer',
    paymentReference: "",
    identificationDocument: null as File | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const populateAuthenticatedUser = async () => {
      try {
        const headers: Record<string, string> = {};
        const token =
          (typeof window !== 'undefined' && localStorage.getItem('token')) ||
          (typeof window !== 'undefined' && sessionStorage.getItem('token')) ||
          null;

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers,
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const profile = await response.json();

        if (cancelled) {
          return;
        }

        setFormData((prev) => ({
          ...prev,
          email: prev.email || profile?.email || "",
          phone: prev.phone || profile?.phone || "",
        }));
      } catch (error) {
        console.error('Failed to fetch authenticated user profile for booking form', error);
      }
    };

    populateAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = (field: string, value: string | number | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images and PDFs)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError("Please upload a valid image (JPG, PNG, GIF) or PDF file.");
      toast.error("Invalid File Type", {
        description: "Please upload a valid image (JPG, PNG, GIF) or PDF file.",
        duration: 5000,
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB.");
      toast.error("File Too Large", {
        description: "File size must be less than 5MB.",
        duration: 5000,
      });
      return;
    }

    setUploadError("");
    setUploadedFileName(file.name);
    handleInputChange("identificationDocument", file);
    toast.success("File uploaded successfully!", {
      description: `${file.name} has been attached to your booking.`,
      duration: 3000,
    });
  };

  const removeFile = () => {
    setUploadedFileName("");
    setUploadError("");
    handleInputChange("identificationDocument", null);
    // Reset the file input
    const fileInput = document.getElementById("identificationDocument") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
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

    if (!formData.checkInTime) {
      toast.error("Please select a check-in time");
      return;
    }

    if (!formData.checkOutTime) {
      toast.error("Please select a check-out time");
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

    const guests = Number(formData.guestCount);
    if (!guests || Number.isNaN(guests) || guests < 1) {
      toast.error("Please enter at least 1 guest");
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

    // Validate ID upload
    if (!formData.identificationDocument) {
      setUploadError("Please upload a valid ID or document to verify your identity.");
      toast.error("ID Required", {
        description: "Please upload a valid ID or document to verify your identity.",
        duration: 5000,
      });
      return;
    }

    // Basic payment validation (aligns with backend enum)
    if (!formData.paymentMethod) {
      toast.error("Please select a payment method");
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
      
      // Use actual room price if available, otherwise default
      const roomPrice = room?.pricePerNight || 150;
      const totalPrice = totalNights * roomPrice;

      // Create booking data using FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('roomId', selectedRoomId);
      formDataToSend.append('checkInDate', formData.checkInDate);
      formDataToSend.append('checkInTime', formData.checkInTime);
      formDataToSend.append('checkOutDate', formData.checkOutDate);
      formDataToSend.append('checkOutTime', formData.checkOutTime);
      formDataToSend.append('guestCount', formData.guestCount.toString());
      formDataToSend.append('totalPrice', totalPrice.toString());
      if (formData.specialRequests) {
        formDataToSend.append('specialRequests', formData.specialRequests);
      }
      if (formData.paymentMethod) {
        formDataToSend.append('paymentMethod', formData.paymentMethod);
      }
      if (formData.paymentReference) {
        formDataToSend.append('paymentReference', formData.paymentReference);
      }
      // Append the identification document file
      if (formData.identificationDocument) {
        formDataToSend.append('identificationDocument', formData.identificationDocument);
      }

      // Submit to API
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const apiEndpoint = bookingType === 'reservation' ? '/api/reservations' : '/api/bookings';
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers,
        credentials: 'same-origin',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        const createdBookingId = data._id || data.id || data.booking?._id || data.data?._id;
        setBookingId(createdBookingId);
        
        // If user chose Stripe payment, create payment intent
        if (payWithStripe && createdBookingId) {
          try {
            const paymentResponse = await fetch("/api/payments/create-payment-intent", {
              method: "POST",
              headers,
              credentials: 'same-origin',
              body: JSON.stringify({ bookingId: createdBookingId }),
            });
            
            const paymentData = await paymentResponse.json();
            
            if (paymentResponse.ok) {
              setClientSecret(paymentData.clientSecret);
              setCurrentStep('payment');
              toast.success("Booking created! Proceeding to payment...", {
                duration: 2000,
              });
            } else {
              throw new Error(paymentData.message || "Failed to create payment intent");
            }
          } catch (paymentError: any) {
            toast.error("Booking created but payment failed", {
              description: paymentError.message || "You can pay later from your bookings.",
              duration: 5000,
            });
            handleOpenChange(false);
            setCurrentStep('form');
          }
        } else {
          if (bookingType === 'reservation') {
            const depositAmount = data.depositRequired || Math.round(totalPrice * 0.2);
            toast.success("Reservation created successfully!", {
              description: `Please pay the deposit of ₱${depositAmount.toLocaleString()} within 48 hours to confirm. You have until ${new Date(data.expiresAt).toLocaleString()} to complete payment.`,
              duration: 8000,
            });
          } else {
            toast.success("Booking request submitted successfully!", {
              description: "We will contact you within 24 hours to confirm your reservation.",
              duration: 5000,
            });
          }
          handleOpenChange(false);
          setCurrentStep('form');
          // Reset form
          setFormData({
            checkInDate: "",
            checkInTime: "14:00",
            checkOutDate: "",
            checkOutTime: "11:00",
            guestCount: 1,
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            specialRequests: "",
            nationality: "",
            purpose: "",
            paymentMethod: 'cash',
            paymentReference: "",
            identificationDocument: null,
          });
          setUploadedFileName("");
          setUploadError("");
          setPayWithStripe(false);
        }
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
  const roomPrice = room?.pricePerNight || 150;
  const totalPrice = totalNights * roomPrice;


  // If initialOpen prop is passed via children usage, allow external open
  // Note: We intentionally allow controlled opening via initialOpen on mount
  // by checking the children prop (consumers will pass initialOpen prop inline)
  // open on mount when initialOpen is provided
  React.useEffect(() => {
    if (initialOpen) setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto ml-3.5"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {currentStep === "form" 
              ? (bookingType === 'reservation' ? "Reserve Your Stay" : "Book Your Stay")
              : currentStep === "review" 
              ? (bookingType === 'reservation' ? "Review Your Reservation" : "Review Your Booking")
              : "Complete Payment"}
          </SheetTitle>
          <SheetDescription>
            {currentStep === "form"
              ? (bookingType === 'reservation' 
                  ? "Create a reservation at Amethyst Inn. Pay 10% deposit to secure your room."
                  : "Complete your booking at Amethyst Inn. Fill in your details below.")
              : currentStep === "review"
              ? `Please review your ${bookingType} details before confirming.`
              : `Complete your payment to finalize your ${bookingType}.`
            }
          </SheetDescription>
        </SheetHeader>

        {currentStep === "form" ? (
          <div className="p-6 space-y-6">
            {/* Room Summary */}
            <div className="border-b pb-4">
              <h3 className="text-xl font-semibold">
                Room {room?.number || 'N/A'} - {room?.type ? room.type.charAt(0).toUpperCase() + room.type.slice(1) : 'Standard'}
              </h3>
              <p className="text-muted-foreground">
                {room?.type ? room.type.charAt(0).toUpperCase() + room.type.slice(1) : 'Standard'} • ₱{roomPrice} per night
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Guest capacity details available on request</span>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Booking Type Selection */}
              <div className="space-y-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Select Type <span className="text-red-500 mt-1">*</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingType('booking')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bookingType === 'booking'
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-sm mb-1">Direct Booking</div>
                      <div className="text-xs text-muted-foreground">
                        Immediate confirmation • Full payment required
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('reservation')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bookingType === 'reservation'
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold text-sm mb-1">Reservation</div>
                      <div className="text-xs text-muted-foreground">
                        10% deposit • 48hrs to confirm
                      </div>
                    </div>
                  </button>
                </div>
                {bookingType === 'reservation' && (
                  <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                    !Pay 10% deposit now, remaining balance upon check-in. Reservation expires in 48 hours if not confirmed.
                  </div>
                )}
              </div>

              {/* Dates and Guests */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Stay Details<span className="text-red-500 mt-1">*</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Check-in Date</Label>
                    <Input
                      id="checkInDate"
                      name="checkInDate"
                      type="date"
                      autoComplete="off"
                      min={today}
                      value={formData.checkInDate}
                      onChange={(e) =>
                        handleInputChange("checkInDate", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime">Check-in Time</Label>
                    <Input
                      id="checkInTime"
                      name="checkInTime"
                      type="time"
                      autoComplete="off"
                      value={formData.checkInTime}
                      onChange={(e) =>
                        handleInputChange("checkInTime", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Check-out Date</Label>
                    <Input
                      id="checkOutDate"
                      name="checkOutDate"
                      type="date"
                      autoComplete="off"
                      min={formData.checkInDate || today}
                      value={formData.checkOutDate}
                      onChange={(e) =>
                        handleInputChange("checkOutDate", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutTime">Check-out Time</Label>
                    <Input
                      id="checkOutTime"
                      name="checkOutTime"
                      type="time"
                      autoComplete="off"
                      value={formData.checkOutTime}
                      onChange={(e) =>
                        handleInputChange("checkOutTime", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestCount">Number of Guests</Label>
                  <Input
                    id="guestCount"
                    name="guestCount"
                    type="number"
                    min={1}
                    value={formData.guestCount === 0 ? "" : formData.guestCount}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        handleInputChange("guestCount", 0);
                        return;
                      }

                      const parsed = parseInt(raw, 10);
                      handleInputChange("guestCount", Number.isNaN(parsed) ? 0 : Math.max(1, parsed));
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the total number of guests staying in this room.
                  </p>
                </div>
              </div>

              {/* Guest Information */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Guest Information<span className="text-red-500 mt-1">*</span>
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address<span className="text-red-500 mt-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number<span className="text-red-500 mt-1">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality<span className="text-red-500 mt-1">*</span></Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      autoComplete="country-name"
                      value={formData.nationality}
                      onChange={(e) =>
                        handleInputChange("nationality", e.target.value)
                      }
                      placeholder="e.g., Filipino"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Visit<span className="text-red-500 mt-1">*</span></Label>
                    <Select
                      name="purpose"
                      value={formData.purpose}
                      onValueChange={(value) =>
                        handleInputChange("purpose", value)
                      }
                    >
                      <SelectTrigger id="purpose" aria-label="Purpose of visit">
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

              {/* ID Upload Section */}
              <div className="space-y-4 border-t pt-6">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Identity Verification <span className="text-red-500 mt-1">*</span>
                </h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Please upload a valid ID or document</p>
                        <p className="text-blue-600 dark:text-blue-300">
                          To ensure the security of all our guests, we require a valid government-issued ID 
                          or identification document (Driver&apos;s License, Passport, National ID, etc.)
                        </p>
                        <p className="text-xs mt-2 text-blue-500 dark:text-blue-400">
                          Accepted formats: JPG, PNG, DOCS, PDF • Max size: 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="identificationDocument" className="flex items-center gap-2">
                      Upload ID/Document <span className="text-red-500 mt-1">*</span>
                    </Label>
                    
                    {!uploadedFileName ? (
                      <div className="relative">
                        <Input
                          id="identificationDocument"
                          name="identificationDocument"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                          onChange={handleFileUpload}
                          className="cursor-pointer  file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          required
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                            {uploadedFileName}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            File uploaded successfully
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="h-8 w-8 p-0 text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {uploadError && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {uploadError}
                      </p>
                    )}
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
                    name="specialRequests"
                    autoComplete="off"
                    value={formData.specialRequests}
                    onChange={(e) =>
                      handleInputChange("specialRequests", e.target.value)
                    }
                    placeholder="e.g., Early check-in, late check-out, dietary requirements, accessibility needs..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              {/* Payment Method */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method <span className="text-red-500 mt-1">*</span> 
                </h4>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Choose Method</Label>
                    <Select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onValueChange={(v) =>
                        handleInputChange("paymentMethod", v)
                      }
                    >
                      <SelectTrigger id="paymentMethod" aria-label="Payment method">
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card (POS)</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.paymentMethod === "card" ||
                    formData.paymentMethod === "stripe" ||
                    formData.paymentMethod === "paypal" ||
                    formData.paymentMethod === "bank_transfer") && (
                    <div className="space-y-2">
                      <Label htmlFor="paymentRef">
                        Payment Reference (optional)
                      </Label>
                      <Input
                        id="paymentRef"
                        name="paymentReference"
                        placeholder={
                          formData.paymentMethod === "card"
                            ? "Last 4 digits / POS ref"
                            : formData.paymentMethod === "bank_transfer"
                            ? "Transfer reference"
                            : "Transaction ID"
                        }
                        value={formData.paymentReference}
                        onChange={(e) =>
                          handleInputChange("paymentReference", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
              {/* Price Summary */}
              {totalNights > 0 && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium">Price Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>
                        ₱{roomPrice} × {totalNights} nights
                      </span>
                      <span>₱{totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-medium text-base border-t pt-2">
                      <span>Total</span>
                      <span>₱{totalPrice}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *Final price may include taxes and fees. A booking
                    confirmation will be sent after submission.
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
                  {isSubmitting ? "Submitting..." : "Review Details"}
                </Button>
              </div>
            </form>
          </div>
        ) : currentStep === "review" ? (
          /* Review Step */
          <div className="p-6 space-y-6">
            {/* Booking Summary */}
            <div className="border-b pb-4">
              <h3 className="text-xl font-semibold">
                Room {room?.number || 'N/A'} - {room?.type ? room.type.charAt(0).toUpperCase() + room.type.slice(1) : 'Standard'}
              </h3>
              <p className="text-muted-foreground">
                {room?.type ? room.type.charAt(0).toUpperCase() + room.type.slice(1) : 'Standard'} • ₱{roomPrice} per night
              </p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {formData.guestCount} {formData.guestCount === 1 ? "Guest" : "Guests"}
                </span>
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
                      <p className="font-medium">
                        {formData.checkInDate
                          ? new Date(formData.checkInDate).toLocaleDateString()
                          : "Not selected"}
                        {formData.checkInTime ? ` • ${formData.checkInTime}` : ""}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out:</span>
                      <p className="font-medium">
                        {formData.checkOutDate
                          ? new Date(formData.checkOutDate).toLocaleDateString()
                          : "Not selected"}
                        {formData.checkOutTime ? ` • ${formData.checkOutTime}` : ""}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Guests:</span>
                      <p className="font-medium">
                        {formData.guestCount} {formData.guestCount === 1 ? 'Guest' : 'Guests'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nights:</span>
                      <p className="font-medium">
                        {totalNights} {totalNights === 1 ? "night" : "nights"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Guest Information */}
                <div className="space-y-3">
                  <h5 className="font-medium text-base">Guest Information</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">
                        {formData.firstName} {formData.lastName}
                      </p>
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
                      <span className="text-muted-foreground">
                        Nationality:
                      </span>
                      <p className="font-medium">{formData.nationality}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Purpose:</span>
                      <p className="font-medium capitalize">
                        {formData.purpose}
                      </p>
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
                      <span>
                        ₱{roomPrice} × {totalNights}{" "}
                        {totalNights === 1 ? "night" : "nights"}
                      </span>
                      <span>₱{totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-medium text-base border-t pt-2">
                      <span>Total</span>
                      <span>₱{totalPrice}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *Final price may include taxes and fees. A booking
                    confirmation will be sent after submission.
                  </p>
                </div>
              )}

              {/* Payment Summary */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Payment Options</h4>
                
                {/* Pay with Stripe Checkbox */}
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="payWithStripe"
                      checked={payWithStripe}
                      onChange={(e) => setPayWithStripe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="payWithStripe" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-purple-600" />
                        Pay now with Stripe (Recommended)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Secure payment • Instant confirmation • Multiple payment methods
                      </p>
                    </div>
                  </div>
                  
                  {payWithStripe && (
                    <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                        <div className="text-xs text-purple-800">
                          <p className="font-medium">You'll complete payment after booking confirmation</p>
                          <p className="text-purple-600 mt-1">
                            Pay securely with credit/debit card, Google Pay, or Apple Pay
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!payWithStripe && (
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-gray-700">Pay later options:</p>
                        <p className="mt-1">• Pay at the hotel upon arrival</p>
                        <p>• Bank transfer (details will be sent via email)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep("form")}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Back to Edit
                </Button>
                <Button
                  type="button"
                  onClick={handleBookingSubmit}
                  className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : payWithStripe ? "Continue to Payment" : "Confirm Booking"}
                </Button>
              </div>
            </div>
          </div>
        ) : currentStep === "payment" ? (
          /* Payment Step */
          <div className="p-6 space-y-6">
            {/* Booking Confirmation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900">Booking Created Successfully!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Booking ID: {bookingId.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Complete your payment below to confirm your reservation
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="space-y-3">
              <h4 className="font-medium">Booking Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Room:</span>
                  <p className="font-medium">
                    {room?.number} - {room?.type}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nights:</span>
                  <p className="font-medium">{totalNights}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-in:</span>
                  <p className="font-medium">
                    {new Date(formData.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Check-out:</span>
                  <p className="font-medium">
                    {new Date(formData.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <p className="text-2xl font-bold text-purple-600">₱{totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Stripe Payment Form */}
            {clientSecret ? (
              <div className="border-t pt-4">
                <StripeProvider clientSecret={clientSecret}>
                  <CheckoutForm
                    amount={totalPrice}
                    bookingId={bookingId}
                    onSuccess={() => {
                      toast.success("Payment successful!", {
                        description: "Your booking is confirmed!",
                        duration: 3000,
                      });
                      setTimeout(() => {
                        handleOpenChange(false);
                        setCurrentStep('form');
                        router.push(`/bookings`);
                      }, 2000);
                    }}
                    onError={(error) => {
                      toast.error("Payment failed", {
                        description: error,
                        duration: 5000,
                      });
                    }}
                  />
                </StripeProvider>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading payment form...</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
