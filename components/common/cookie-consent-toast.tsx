"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CookieConsent } from '@/utils/cookies';
import { toast } from 'sonner';
import { IconCookie, IconCheck, IconX, IconSettings } from '@tabler/icons-react';

interface CookieConsentToastProps {
  onConsentChange?: (consent: boolean) => void;
  autoShow?: boolean;
}

export function CookieConsentToast({ onConsentChange, autoShow = true }: CookieConsentToastProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (autoShow) {
      // Check if user has already given consent
      const hasConsent = CookieConsent.hasConsent();
      if (!hasConsent) {
        // Show consent after a small delay
        const timer = setTimeout(() => {
          setShowConsent(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [autoShow]);

  const handleConsent = async (consent: boolean) => {
    setIsLoading(true);
    
    try {
      const success = await CookieConsent.setConsentComplete(consent);
      
      if (success) {
        setShowConsent(false);
        
        if (consent) {
          toast.success("Cookie consent granted! We'll use cookies to improve your experience.", {
            description: "You can change this anytime in your browser settings.",
            duration: 5000,
          });
        } else {
          toast.info("Cookie consent declined. Some features may not work properly.", {
            description: "You can enable cookies later if needed.",
            duration: 5000,
          });
        }
        
        onConsentChange?.(consent);
      } else {
        toast.error("Failed to save cookie preferences. Please try again.");
      }
    } catch (error) {
      console.error('Error setting cookie consent:', error);
      toast.error("An error occurred while saving your preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAll = () => handleConsent(true);
  const handleDecline = () => handleConsent(false);

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto md:left-auto md:right-4">
      <Card className="border-2 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <IconCookie className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cookie Preferences</CardTitle>
          </div>
          <CardDescription>
            We use cookies to enhance your experience and provide personalized content.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Essential cookies:</strong> Required for basic site functionality
            </p>
            <p>
              <strong>Authentication cookies:</strong> Keep you logged in securely
            </p>
            <p>
              <strong>Preference cookies:</strong> Remember your settings and preferences
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={handleAcceptAll}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              <IconCheck className="h-4 w-4 mr-2" />
              Accept All
            </Button>
            
            <Button
              onClick={handleDecline}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <IconX className="h-4 w-4 mr-2" />
              Decline
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            You can change these settings anytime in your browser preferences.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Compact version for smaller spaces
export function CookieConsentCompact({ onConsentChange }: CookieConsentToastProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hasConsent = CookieConsent.hasConsent();
    if (!hasConsent) {
      const timer = setTimeout(() => {
        setShowConsent(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = async (consent: boolean) => {
    setIsLoading(true);
    
    try {
      const success = await CookieConsent.setConsentComplete(consent);
      
      if (success) {
        setShowConsent(false);
        toast.success(
          consent 
            ? "Cookie consent granted!" 
            : "Cookie consent declined. Some features may not work properly."
        );
        onConsentChange?.(consent);
      } else {
        toast.error("Failed to save preferences. Please try again.");
      }
    } catch (error) {
      console.error('Error setting cookie consent:', error);
      toast.error("An error occurred while saving your preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <IconCookie className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">We use cookies</p>
            <p className="text-xs text-muted-foreground mt-1">
              To provide a better experience and keep you logged in securely.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => handleConsent(true)}
                disabled={isLoading}
                size="sm"
                className="text-xs px-2 py-1 h-7"
              >
                Accept
              </Button>
              <Button
                onClick={() => handleConsent(false)}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-xs px-2 py-1 h-7"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentToast;
