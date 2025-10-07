"use client";

import React, { useState, FormEvent } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface CheckoutFormProps {
  amount: number;
  bookingId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function CheckoutForm({
  amount,
  bookingId,
  onSuccess,
  onError
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bookings/${bookingId}/payment/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "An error occurred during payment");
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setPaymentSuccess(true);
        
        // Confirm payment on backend
        const token = localStorage.getItem("token");
        const response = await fetch(
          `/api/payments/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
          }
        );

        if (response.ok) {
          onSuccess();
        } else {
          const data = await response.json();
          setErrorMessage(data.message || "Failed to confirm payment");
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      onError(err.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Amount:</span>
          <span className="text-3xl font-bold text-purple-600">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <PaymentElement />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {paymentSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment successful! Processing your booking...
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing || paymentSuccess}
        className="w-full h-12 text-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Payment...
          </>
        ) : paymentSuccess ? (
          <>
            <CheckCircle className="mr-2 h-5 w-5" />
            Payment Complete
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Your payment is secure and encrypted. Powered by Stripe.
      </p>
    </form>
  );
}
