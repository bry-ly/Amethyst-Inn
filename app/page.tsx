"use client"
import Link from "next/link";
import Image from 'next/image'
import { IconDiamond, IconMenu2, IconX, IconUserFilled, IconLogout } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

import { Footer2 } from "@/components/ui/footer2";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AuthTokenManager, CookieConsent } from "@/utils/cookies";
import { CookieConsentToast } from "@/components/cookie-consent-toast";
import { AmenitiesSection } from "@/components/aminitiesdata";
import { RoomsSection } from "@/components/roomsection-new";
import { TestimonialsSection } from "@/components/testimonials";
import { BookingSheet } from "@/components/BookingSheet";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If user is not logged in, show login dialog
    if (!user) {
      setIsLoginDialogOpen(true);
      return;
    }
    
    // If user is logged in, the BookingSheet will handle the booking
    // The sheet will be triggered by the button click
  };

  // Set client state after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check cookie consent and authentication
  useEffect(() => {
    if (!isClient) return; // Don't run on server side
    
    const checkAuth = async () => {
      try {
        // Check cookie consent first
        const hasConsent = CookieConsent.hasConsent();
        setCookieConsent(hasConsent);
        
        // Get token using the new utility
        const token = AuthTokenManager.getToken();
        
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me', { 
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
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

  const handleLogout = async () => {
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
  };

  const handleCookieConsentChange = (consent: boolean) => {
    setCookieConsent(consent);
    // If user just granted consent and is logged in, we might want to store token in cookies
    if (consent && user) {
      const token = AuthTokenManager.getToken();
      if (token) {
        AuthTokenManager.setToken(token, true);
      }
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header - Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-nowrap"
          >
            <IconDiamond className="h-8 w-8" />
            <span>Amethyst Inn</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="relative text-sm font-medium transition-colors hover:text-primary group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#about"
              className="relative text-sm font-medium transition-colors hover:text-primary group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#rooms"
              className="relative text-sm font-medium transition-colors hover:text-primary group"
            >
              Rooms
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#testimonials"
              className="relative text-sm font-medium transition-colors hover:text-primary group"
            >
              Testimonials
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#amenities"
              className="relative text-sm font-medium transition-colors hover:text-primary group"
            >
              Amenities
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link
              href="/#contact"
              className="relative text-sm font-medium transition-colors hover:text-primary group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {isClient && !isLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <IconUserFilled className="h-4 w-4" />
                        <span className="hidden sm:inline">{user.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2"
                        >
                          <IconUserFilled className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="flex items-center gap-2"
                      >
                        <IconLogout className="h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" size="sm">
                        Login
                      </Button>
                    </Link>
                  </>
                )}
                {user ? (
                  <BookingSheet>
                    <Button size="sm">
                      Book Now
                    </Button>
                  </BookingSheet>
                ) : (
                  <Button size="sm" onClick={handleBookingClick}>
                    Book Now
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <IconX className="h-5 w-5" />
              ) : (
                <IconMenu2 className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Desktop Mode Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="container mx-auto px-4 py-4 space-y-4">
              <Link
                href="/"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                href="/#about"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              <Link
                href="/#rooms"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
                onClick={closeMobileMenu}
              >
                Rooms
              </Link>
              <Link
                href="/#testimonials"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
                onClick={closeMobileMenu}
              >
                Testimonials
              </Link>
              <Link
                href="/#amenities"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
                onClick={closeMobileMenu}
              >
                Amenities
              </Link>
              <Link
                href="/#contact"
                className="block py-2 text-sm font-medium transition-colors hover:text-primary hover:underline"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
              <div className="pt-4 border-t space-y-3">
                {isClient && !isLoading && (
                  <>
                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                          <IconUserFilled className="h-6 w-6 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/dashboard"
                          className="block"
                          onClick={closeMobileMenu}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center gap-2"
                          >
                            <IconUserFilled className="h-4 w-4" />
                            Dashboard
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2"
                          onClick={() => {
                            handleLogout();
                            closeMobileMenu();
                          }}
                        >
                          <IconLogout className="h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    ) : (
                      <Link href="/login" className="block">
                        <Button variant="outline" size="sm" className="w-full">
                          Login
                        </Button>
                      </Link>
                    )}
                  </>
                )}
                {user ? (
                  <BookingSheet>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={closeMobileMenu}
                    >
                      Book Now
                    </Button>
                  </BookingSheet>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      handleBookingClick(e);
                      closeMobileMenu();
                    }}
                  >
                    Book Now
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative flex items-center justify-center border-b h-96 sm:h-112 md:h-128 lg:h-screen overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src="/photo-1570129477492-45c003edd2be.avif"
            alt="Hero"
            fill
            className="object-cover opacity-60"
            priority
          />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 text-center">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Welcome to Amethyst Inn
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-base sm:text-lg">
            Experience comfort and tranquility in our beautifully appointed
            guest house. Perfect for business travelers, couples, and families
            seeking a memorable stay.
          </p>
          <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:gap-4">
            {user ? (
              <BookingSheet>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Book Your Stay
                </Button>
              </BookingSheet>
            ) : (
              <Button
                size="lg"
                className="w-full sm:w-auto"
                onClick={handleBookingClick}
              >
                Book Your Stay
              </Button>
            )}
            <Link href="/#rooms">
              <Button variant="outline" size="lg" className="w-full sm:w-auto ">
                View Rooms
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <div className="h-screen">
        <RoomsSection />
      </div>
      <TestimonialsSection />
      {/* Amenities */}
      <AmenitiesSection />

      {/* Contact */}
      <section
        id="contact"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col items-center justify-center"
      >
        <h2 className="text-3xl font-bold text-center">Contact Us</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Have questions or ready to book your stay? Get in touch and we'll be
          happy to assist you.
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-2 w-full">
          <div className="space-y-4">
            <div>
              <div className="font-medium">Phone</div>
              <div className="text-muted-foreground">09197812697</div>
            </div>
            <div>
              <div className="font-medium">Email</div>
              <div className="text-muted-foreground">
                SereneStayInn@gmail.com
              </div>
            </div>
            <div>
              <div className="font-medium">Address</div>
              <div className="text-muted-foreground">
                Purok Kalipay, Gabayan Street, San Manuel, Puerto Princesa City,
                Palawan 5300
              </div>
            </div>
            <div>
              <div className="font-medium">Reception Hours</div>
              <div className="text-muted-foreground">
                24/7 - We're always here to help
              </div>
            </div>
          </div>
          <form className="space-y-4 w-full">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                placeholder="First Name"
                className="h-10 w-full rounded-md border bg-transparent px-3"
              />
              <input
                placeholder="Last Name"
                className="h-10 w-full rounded-md border bg-transparent px-3"
              />
            </div>
            <input
              placeholder="Email Address"
              className="h-10 w-full rounded-md border bg-transparent px-3"
            />
            <input
              placeholder="Phone Number"
              className="h-10 w-full rounded-md border bg-transparent px-3"
            />
            <input
              placeholder="Subject"
              className="h-10 w-full rounded-md border bg-transparent px-3"
            />
            <textarea
              placeholder="Your message..."
              className="min-h-32 w-full rounded-md border bg-transparent p-3"
            />
            <Button className="w-full">Send Message</Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-8 flex items-center gap-2 justify-center">
        <Footer2 />
      </div>

      {/* Login Required Dialog */}
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

      {/* Cookie Consent Toast */}
      <CookieConsentToast onConsentChange={handleCookieConsentChange} />
    </main>
  );
  }