'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ReservationPaymentCancelledPage() {
  const router = useRouter();
  const params = useParams();
  const reservationId = params.id;

  return (
    <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <XCircle className="h-12 w-12 text-gray-600 dark:text-gray-400" />
          </div>
          <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-base">
            You cancelled the payment process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm bg-muted/50 p-4 rounded-lg">
            <p className="mb-2">
              Your reservation is still <span className="font-semibold">pending</span> and 
              needs payment confirmation within 48 hours.
            </p>
            <p className="text-muted-foreground">
              You can try paying again or choose a different payment method.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Options:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Try payment again with Stripe</li>
              <li>Contact us to pay via bank transfer</li>
              <li>Visit our office to pay in cash</li>
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
              onClick={() => router.push(`/reservations/${reservationId}`)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
