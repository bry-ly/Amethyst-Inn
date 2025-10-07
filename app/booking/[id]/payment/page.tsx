// app/bookings/[id]/payment/page.tsx - Example implementation
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StripeProvider from "@/components/providers/StripeProvider";
import CheckoutForm from "@/components/payment/CheckoutForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Amethyst Inn - Payment";
    
    const fetchBookingAndCreateIntent = async () => {
      try {
        const token = localStorage.getItem("token");
        const API_URL = process.env.NEXT_PUBLIC_API_URL;

        // Fetch booking details
        const bookingRes = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!bookingRes.ok) throw new Error("Failed to fetch booking");
        const bookingData = await bookingRes.json();
        setBooking(bookingData);

        // Create payment intent
        const paymentRes = await fetch(`${API_URL}/api/payments/create-payment-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId }),
        });

        if (!paymentRes.ok) throw new Error("Failed to create payment intent");
        const paymentData = await paymentRes.json();
        setClientSecret(paymentData.clientSecret);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndCreateIntent();
  }, [bookingId]);

  const handlePaymentSuccess = () => {
    router.push(`/bookings/${bookingId}/confirmation`);
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>
            Booking #{bookingId.slice(-8).toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {booking && (
            <div className="mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Room:</span>
                <span className="font-medium">{booking.room?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-in:</span>
                <span className="font-medium">
                  {new Date(booking.checkInDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Check-out:</span>
                <span className="font-medium">
                  {new Date(booking.checkOutDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guests:</span>
                <span className="font-medium">
                  {booking.guests?.adults || 0} Adults, {booking.guests?.children || 0} Children
                </span>
              </div>
            </div>
          )}

          {clientSecret && (
            <StripeProvider clientSecret={clientSecret}>
              <CheckoutForm
                amount={booking?.totalPrice || 0}
                bookingId={bookingId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </StripeProvider>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
