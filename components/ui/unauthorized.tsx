import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

interface UnauthorizedProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

export function Unauthorized({
  title = "Access Denied",
  message = "You don't have permission to access this page. Please contact an administrator if you believe this is an error.",
  showHomeButton = true,
  showBackButton = true,
}: UnauthorizedProps) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/50 shadow-lg">
        <CardContent className="flex flex-col items-center justify-center space-y-6 p-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {message}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            {showBackButton && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}
            {showHomeButton && (
              <Button asChild className="w-full sm:w-auto">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
            )}
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground border">
            <p className="text-center">
              <strong>Need access?</strong> Contact your system administrator to request the appropriate permissions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
