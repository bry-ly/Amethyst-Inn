"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ContactSection from "@/components/common/contact-section";
import { Footer2 } from "@/components/ui/footer2";
import HeroSection from "@/components/common/hero-section";
import HeaderSection from "@/components/common/header-section";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback, Suspense } from "react";
import { toast } from "sonner";
import { AuthTokenManager, CookieConsent } from "@/utils/cookies";
import { CookieConsentToast } from "@/components/common/cookie-consent-toast";
import { AmenitiesSection } from "@/components/common/amenities-section";
import { RoomsSection } from "@/components/rooms/rooms-section";
import { TestimonialsSection } from "@/components/common/testimonials-section";
import { BookingSheet } from "@/components/booking/booking-sheet";
import About from "@/components/common/about-section";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Memoize callbacks to prevent unnecessary re-renders
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleBookingClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // If user is not logged in, show login dialog
    if (!user) {
      setIsLoginDialogOpen(true);
      return;
    }
    
    // If user is logged in, the BookingSheet will handle the booking
    // The sheet will be triggered by the button click
  }, [user]);

  // Set client state after hydration
  useEffect(() => {
    setIsClient(true);
    document.title = "Amethyst Inn - Home";
  }, []);

  // Check cookie consent and authentication
  useEffect(() => {
    if (!isClient) return; // Don't run on server side
    
    const checkAuth = async () => {
      try {
        // Check cookie consent first
        const hasConsent = CookieConsent.hasConsent();
        setCookieConsent(hasConsent);
        
        // Try to get a token (may be in localStorage). Even if missing, still
        // call /api/auth/me so the server can authenticate via httpOnly cookie.
        const token = AuthTokenManager.getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
          headers,
          // credentials default to 'same-origin' for same-origin requests, which
          // sends cookies; specifying it here for clarity/safety.
          credentials: 'same-origin',
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);

          // If we authenticated via cookie and no token in storage, keep the
          // client in sync by writing the token from response if provided in a
          // header in the future. For now, just leave storage empty to rely on
          // cookie-based auth.
        } else {
          // Token is invalid, remove it
          AuthTokenManager.clearToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        AuthTokenManager.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isClient]);

  // Listen for requests from other components to open the login dialog (e.g., Book Now)
  useEffect(() => {
    function onOpenLogin(e: Event) {
      const detail = (e as CustomEvent)?.detail
      // optionally store or use detail.roomId if needed
      setIsLoginDialogOpen(true)
    }
    window.addEventListener('openLoginDialog', onOpenLogin)
    return () => window.removeEventListener('openLoginDialog', onOpenLogin)
  }, [])

  // Memoize logout handler
  const handleLogout = useCallback(async () => {
    try {
      // Clear token using utility
      AuthTokenManager.clearToken();
      
      // Clear all cached data
      const { clearCache } = await import('@/hooks/use-api-data');
      clearCache();
      
      // Call logout API to clear cookie
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Update user state
      setUser(null);
      
      toast.success("Logged out successfully!");
      
      // Small delay to show toast before reload
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Logout error:', err);
      // Even if API call fails, clear local data
      AuthTokenManager.clearToken();
      setUser(null);
      toast.success("Logged out successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, []);

  // Memoize cookie consent handler
  const handleCookieConsentChange = useCallback((consent: boolean) => {
    setCookieConsent(consent);
    // If user just granted consent and is logged in, we might want to store token in cookies
    if (consent && user) {
      const token = AuthTokenManager.getToken();
      if (token) {
        AuthTokenManager.setToken(token, true);
      }
    }
  }, [user]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <HeaderSection
        user={user}
        isLoading={isLoading}
        isClient={isClient}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={toggleMobileMenu}
        onCloseMobileMenu={closeMobileMenu}
        onBookingClick={handleBookingClick}
        onLogout={handleLogout}
      />
      <HeroSection user={user} onBookingClick={handleBookingClick} />
      <div className=" border-b-primary">
      <About/>
      </div>
        <Suspense fallback={<div className="text-center text-muted-foreground py-8">Loading rooms...</div>}>
          <RoomsSection />
        </Suspense>
        <TestimonialsSection />
      <AmenitiesSection />
      <ContactSection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex items-center gap-2 justify-center">
        <Footer2 />
      </div>
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Login Required</DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Login before you can make a booking. Please Sign in and Create an
              account to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-1 mb-1 !justify-center">
            <Button
              variant="outline"
              onClick={() => setIsLoginDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Link href="/login" className="w-full sm:w-auto">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CookieConsentToast onConsentChange={handleCookieConsentChange} />
    </main>
  );
  }