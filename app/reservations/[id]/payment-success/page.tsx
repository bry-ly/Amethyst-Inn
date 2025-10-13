'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { AuthTokenManager } from '@/utils/cookies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';

function PaymentSuccessContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const reservationId = params.id;

      if (!sessionId || !reservationId) {
        setError('Missing payment session information');
        setVerifying(false);
        return;
      }

      try {
        const token = AuthTokenManager.getToken();
        const res = await fetch(`/api/reservations/${reservationId}/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId })
        });

        const data = await res.json();
        
        if (data.success) {
          setSuccess(true);
          setReservation(data.data);
        } else {
          setError(data.message || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setError('An error occurred while verifying payment');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [params.id, searchParams]);

  if (verifying) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Verifying Payment</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && reservation) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md border-green-200 dark:border-green-800">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
            <CardDescription className="text-base">
              Your reservation has been confirmed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reservation ID:</span>
                <span className="font-mono text-sm">#{reservation._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">Confirmed</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit Paid:</span>
                <span className="font-semibold">₱{reservation.depositAmount?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Next Steps:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>You'll receive a confirmation email shortly</li>
                <li>Pay the remaining balance at check-in</li>
                <li>Bring a valid ID for verification</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push('/reservations')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View Reservations
              </Button>
              <Button 
                className="flex-1"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-3xl">Verification Failed</CardTitle>
          <CardDescription className="text-base">
            {error || 'We could not verify your payment'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">What to do:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
              <li>Check your email for payment confirmation</li>
              <li>Contact support if payment was deducted</li>
              <li>Try creating a new reservation</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => router.push('/reservations')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reservations
            </Button>
            <Button 
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReservationPaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Please wait</p>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
