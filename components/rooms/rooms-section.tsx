"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useSearchParams } from 'next/navigation'
import { RoomCard } from "./room-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Filter,
  SlidersHorizontal,
  X,
  Star,
  TrendingUp,
  Users,
  MapPin
} from "lucide-react";
import { useRooms } from "@/hooks/use-rooms";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function RoomsSection() {
  const searchParams = useSearchParams()
  const bookParam = searchParams ? searchParams.get('book') : null
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showUnavailable, setShowUnavailable] = useState(true);
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);

  // Convert frontend filters to API filters
  const getApiFilters = useCallback(() => {
    const filters: any = {
      page: 1,
      limit: 50, // Get more rooms for better UX
      sort: sortBy,
      order: sortBy === 'price' ? 'asc' : 'desc'
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
  }, [searchTerm, selectedType, priceRange, showUnavailable, sortBy]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (selectedType !== "all") count++;
    if (priceRange !== "all") count++;
    if (!showUnavailable) count++;
    return count;
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
    setSortBy('price');
    // The useRooms hook will automatically refetch when filters change
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    updateFilters(getApiFilters());
  }, [updateFilters, getApiFilters]);

  // Filter rooms locally for additional client-side filtering
  const filteredRooms = rooms.filter((room) => {
    // Additional client-side filtering can be added here if needed
    return true;
  });

  return (
    <section
      id="rooms"
      className="py-8 md:py-12 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[hsl(var(--background))] dark:via-[hsl(var(--card))] dark:to-[hsl(var(--background))] transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-1 w-12 bg-primary rounded-full"></div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Our Rooms
            </h2>
            <div className="h-1 w-12 bg-primary rounded-full"></div>
          </div>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Discover our carefully curated collection of rooms, each designed to provide 
            exceptional comfort and unforgettable experiences for every guest.
          </p>
        </div>

        {/* Stats Cards */}
      

        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 ">
          {/* Search and Filters */}
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search rooms by name, type, or amenities..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
                className="pl-10 h-11 text-sm"
                disabled={loading}
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-11 px-4"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40 h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="createdAt">Newest First</SelectItem>
                <SelectItem value="type">Room Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-6 bg-white/80 dark:bg-[hsl(var(--card))]/80 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Room Type</label>
                  <Select
                    value={selectedType}
                    onValueChange={(value) => {
                      setSelectedType(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
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
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <Select
                    value={priceRange}
                    onValueChange={(value) => {
                      setPriceRange(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="under-150">Under ₱150</SelectItem>
                      <SelectItem value="150-200">₱150 - ₱200</SelectItem>
                      <SelectItem value="over-200">Over ₱200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
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
                  <label htmlFor="showUnavailable" className="text-sm font-medium">
                    Show Unavailable
                  </label>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {/* Loading indicator */}
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Loading Rooms
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Please wait while we fetch the latest room information...
                </p>
              </div>
            </div>

            {/* Skeleton loading */}
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <CarouselItem key={i} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <RoomCardSkeleton viewMode='grid' />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0 -translate-x-1/2" />
              <CarouselNext className="right-0 translate-x-1/2" />
            </Carousel>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {filteredRooms.length} Room{filteredRooms.length !== 1 ? 's' : ''} Found
                </h3>
                {activeFilterCount > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on your current filters
                  </p>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {/* Rooms Display */}
            
            {filteredRooms.length > 0 ? (
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent className="relative h-full items-stretch pb-6">
                  {filteredRooms.map((room) => (
                    <CarouselItem
                      key={room._id}
                      className="flex h-135  basis-full pl-4 sm:basis-1/3 lg:basis-1/3"
                    >
                      <RoomCard room={room} openBookingId={bookParam} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-1" />
                <CarouselNext className="right-1" />
              </Carousel>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No Rooms Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We couldn't find any rooms matching your current filters. 
                    Try adjusting your search criteria or clearing some filters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear All Filters
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setShowFilters(true)}
                      className="flex items-center gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Adjust Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination info */}
            {pagination && pagination.total > pagination.limit && (
              <div className="text-center mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredRooms.length} of {pagination.total} rooms
                </p>
                <div className="mt-2 flex justify-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function RoomCardSkeleton({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-[hsl(var(--card))] rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image skeleton */}
          <Skeleton className="h-48 md:h-32 md:w-48 flex-shrink-0" />
          
          {/* Content skeleton */}
          <div className="p-6 flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/3" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-14" />
            </div>
            
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[hsl(var(--card))] rounded-lg shadow-sm overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full" />

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Header skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>

        {/* Description skeleton */}
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />

        {/* Features skeleton */}
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>

        {/* Amenities skeleton */}
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Button skeleton */}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </div>
  );
}

