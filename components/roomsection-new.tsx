"use client";

import { useState, useCallback } from "react";
import { RoomCard } from "./roomcard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useRooms } from "@/hooks/use-rooms";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "./ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./ui/carousel";
import { Alert, AlertDescription } from "./ui/alert";

export function RoomsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showUnavailable, setShowUnavailable] = useState(true);

  // Convert frontend filters to API filters
  const getApiFilters = useCallback(() => {
    const filters: any = {
      page: 1,
      limit: 50, // Get more rooms for better UX
      sort: 'createdAt',
      order: 'desc'
    };

    // Search filter
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }

    // Type filter
    if (selectedType !== "all") {
      filters.type = selectedType;
    }

    // Price range filter
    if (priceRange !== "all") {
      switch (priceRange) {
        case "under-150":
          filters.maxPrice = 150;
          break;
        case "150-200":
          filters.minPrice = 150;
          filters.maxPrice = 200;
          break;
        case "over-200":
          filters.minPrice = 200;
          break;
      }
    }

    // Availability filter
    if (!showUnavailable) {
      filters.status = 'available';
    }

    return filters;
  }, [searchTerm, selectedType, priceRange, showUnavailable]);

  const { rooms, loading, error, pagination, refetch, updateFilters } = useRooms({
    filters: getApiFilters(),
    autoFetch: true
  });

  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    updateFilters(getApiFilters());
  }, [updateFilters, getApiFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedType("all");
    setPriceRange("all");
    setShowUnavailable(true);
    // The useRooms hook will automatically refetch when filters change
  }, []);

  // Filter rooms locally for additional client-side filtering
  const filteredRooms = rooms.filter((room) => {
    // Additional client-side filtering can be added here if needed
    return true;
  });

  return (
    <section
      id="rooms"
      className="py-16 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-[hsl(var(--background))] dark:via-[hsl(var(--card))] dark:to-[hsl(var(--background))] transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 gh-heading">
            Our Rooms
          </h2>
          <p className="text-lg gh-description max-w-2xl mx-auto">
            Choose from our selection of comfortable and well-appointed rooms,
            each designed to provide you with a memorable stay.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/70 dark:bg-[hsl(var(--card))]/70 border border-gray-300 dark:border-[hsl(var(--border))] backdrop-blur p-3 sm:p-4 md:p-6 rounded-lg shadow-sm mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
                className="pl-10 border border-border text-sm md:text-base min-h-[44px]"
                disabled={loading}
              />
            </div>

            <Select
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
                handleFilterChange();
              }}
              disabled={loading}
            >
              <SelectTrigger className="text-sm md:text-base min-h-[44px]">
                <SelectValue
                  placeholder="Room Type"
                  className="border border-border"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="double">Double</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="presidential">Presidential</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={priceRange}
              onValueChange={(value) => {
                setPriceRange(value);
                handleFilterChange();
              }}
              disabled={loading}
            >
              <SelectTrigger className="text-sm md:text-base min-h-[44px]">
                <SelectValue
                  placeholder="Price Range"
                  className="border border-border"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under-150">Under ₱150</SelectItem>
                <SelectItem value="150-200">₱150 - ₱200</SelectItem>
                <SelectItem value="over-200">Over ₱200</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
              <input
                type="checkbox"
                id="showUnavailable"
                checked={showUnavailable}
                onChange={(e) => {
                  setShowUnavailable(e.target.checked);
                  handleFilterChange();
                }}
                className="rounded border-gray-300 h-4 w-4"
                disabled={loading}
              />
              <label
                htmlFor="showUnavailable"
                className="text-xs md:text-sm font-medium"
              >
                Show Unavailable
              </label>
            </div>

            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full text-sm md:text-base min-h-[44px] sm:col-span-2 lg:col-span-1"
              disabled={loading}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Error State */}
     

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {/* Loading indicator */}
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg text-muted-foreground">
                Loading rooms...
              </span>
            </div>

            {/* Skeleton loading for mobile carousel */}
            <div className="md:hidden">
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="min-w-0 basis-full flex-shrink-0">
                    <RoomCardSkeleton />
                  </div>
                ))}
              </div>
            </div>

            {/* Skeleton loading for desktop grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <RoomCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Carousel (< md) */}
            <MobileRoomsCarousel rooms={filteredRooms} />

            {/* Desktop Carousel (>= md) */}
            <DesktopRoomsCarousel rooms={filteredRooms} />

            {filteredRooms.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  No rooms match your current filters. Please try adjusting your
                  search criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination info */}
            {pagination && pagination.total > pagination.limit && (
              <div className="text-center mt-6 text-sm text-muted-foreground">
                Showing {filteredRooms.length} of {pagination.total} rooms
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function RoomCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="h-64 w-full" />

      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>

        {/* Description skeleton */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />

        {/* Amenities skeleton */}
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Button skeleton */}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function MobileRoomsCarousel({ rooms }: { rooms: any[] }) {
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    skipSnaps: false,
  });

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  if (!rooms.length) return null;

  return (
    <div className="md:hidden">
      <div className="relative">
        <div className="overflow-hidden" ref={viewportRef}>
          <div className="flex gap-4">
            {rooms.map((room) => (
              <div key={room._id} className="min-w-0 basis-full flex-shrink-0">
                <RoomCard room={room} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={scrollPrev}>
            Previous
          </Button>
          <Button variant="outline" onClick={scrollNext}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function DesktopRoomsCarousel({ rooms }: { rooms: any[] }) {
  if (!rooms.length) return null;

  return (
    <div className="hidden md:block">
      <Carousel
        opts={{ align: "start", skipSnaps: false, dragFree: true }}
        className="relative"
      >
        <CarouselContent>
          {rooms.map((room) => (
            <CarouselItem
              key={room._id}
              className="basis-full md:basis-1/2 xl:basis-1/3 2xl:basis-1/3"
            >
              <div className="pr-4">
                <RoomCard room={room} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 lg:-left-6 size-12 lg:size-14 bg-white/80 dark:bg-[hsl(var(--card))]/80 backdrop-blur border border-gray-200 dark:border-[hsl(var(--border))] shadow-md hover:bg-white dark:hover:bg-[hsl(var(--card))]" />
        <CarouselNext className="hidden md:flex -right-4 lg:-right-6 size-12 lg:size-14 bg-white/80 dark:bg-[hsl(var(--card))]/80 backdrop-blur border border-gray-200 dark:border-[hsl(var(--border))] shadow-md hover:bg-white dark:hover:bg-[hsl(var(--card))]" />
      </Carousel>
    </div>
  );
}
