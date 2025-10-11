import { memo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookingSheet } from '@/components/booking/booking-sheet';

interface HeroSectionProps {
  user: { name: string; email: string; role?: string } | null;
  onBookingClick: (e: React.MouseEvent) => void;
}

// Memoize the component to prevent unnecessary re-renders
const HeroSection = memo(function HeroSection({ user, onBookingClick }: HeroSectionProps) {
  // Memoize the click handler to maintain referential equality
  const handleBookingClick = useCallback((e: React.MouseEvent) => {
    onBookingClick(e);
  }, [onBookingClick]);

  return (
    <section
      id="home"
      className="relative flex items-center justify-center border-b h-96 sm:h-112 md:h-128 lg:h-screen overflow-hidden"
    >
      {/* Lazy load background image after LCP */}
      <div className="absolute inset-0">
        <Image
          src="/photo-1570129477492-45c003edd2be.avif"
          alt="Amethyst Inn luxury hotel room interior"
          fill
          sizes="100vw"
          className="object-cover opacity-60"
          priority
          quality={85}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCgABmX/9k="
        />
      </div>
      
      {/* Content with optimized layout */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          Welcome to Amethyst Inn
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-gray-900 dark:text-gray-200 text-base sm:text-lg">
          Experience comfort and tranquility in our beautifully appointed
          guest house. Perfect for business travelers, couples, and families
          seeking a memorable stay.
        </p>
        
        {/* Optimized button layout with reduced re-renders */}
        <div className="mt-6 flex w-full flex-col items-center justify-center gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:gap-4">
          {user ? (
            <BookingSheet>
              <Button size="lg" className="w-34 sm:w-35 border-primary">
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
          <Link href="/#rooms" prefetch={false}>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto dark:hover:bg-shadow dark:bg-secondary"
            >
              View Rooms
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
});

export default HeroSection;
