"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingSheet } from "@/components/booking/booking-sheet";
import { useRouter } from "next/navigation";
import { useAuthCheck } from "@/hooks/use-auth-check";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Wifi,
  Coffee,
  Car,
  Bath,
  Bed,
  CheckCircle,
  XCircle,
  Home,
  Waves,
  Utensils,
  Accessibility,
  Star,
  MapPin,
  Calendar,
  Heart,
  Share2,
  Eye,
  ArrowRight,
  Clock,
  RefreshCw,
} from "lucide-react";

// Define Room interface locally
interface Room {
  _id: string;
  number: string;
  images?: string[];
  type:
    | "single"
    | "double"
    | "suite"
    | "deluxe"
    | "family"
    | "presidential"
    | "standard"
    | "premium";
  pricePerNight: number;
  status:
    | "available"
    | "occupied"
    | "maintenance"
    | "cleaning"
    | "out_of_order";
  description?: string;
  amenities?: string[];
  guestCapacity?: number;
  capacity?: {
    adults: number;
    children: number;
  };
  size?: number;
  floor?: number;
  features?: {
    hasBalcony?: boolean;
    hasSeaView?: boolean;
    hasKitchen?: boolean;
    hasJacuzzi?: boolean;
    isAccessible?: boolean;
  };
  isActive?: boolean;
  isAvailable?: boolean;
  activeBookings?: number;
  nextAvailableDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface RoomCardProps {
  room: Room;
  openBookingId?: string | null;
}

export function RoomCard({ room, openBookingId }: RoomCardProps) {
  const router = useRouter();
  const routerRef = React.useRef(router);
  React.useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Calculate real-time availability status with numeric countdown
  const availabilityStatus = useMemo(() => {
    if (!room.nextAvailableDate) {
      return {
        text: room.isAvailable ? 'Available Now' : 'Not Available',
        countdown: null,
        days: 0,
        hours: 0,
        minutes: 0,
        color: room.isAvailable ? 'green' : 'red',
        urgency: room.isAvailable ? 'low' : 'high' as 'low' | 'medium' | 'high'
      };
    }

    const now = currentTime;
    const availableDate = new Date(room.nextAvailableDate);
    const diffMs = availableDate.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs <= 0) {
      return {
        text: 'Available Now',
        countdown: null,
        days: 0,
        hours: 0,
        minutes: 0,
        color: 'green',
        urgency: 'low' as 'low' | 'medium' | 'high'
      };
    }

    const remainingHours = diffHours % 24;
    const remainingMinutes = diffMinutes % 60;

    let text = 'Available Soon';
    let color = 'red';
    let urgency: 'low' | 'medium' | 'high' = 'high';

    if (diffDays === 0) {
      if (diffHours === 0) {
        text = 'Available Soon';
        color = 'yellow';
        urgency = 'low';
      } else {
        text = 'Available Today';
        color = 'yellow';
        urgency = 'low';
      }
    } else if (diffDays === 1) {
      text = 'Available Tomorrow';
      color = 'orange';
      urgency = 'medium';
    } else if (diffDays < 7) {
      text = `Available in ${diffDays} days`;
      color = 'red';
      urgency = 'high';
    } else {
      text = `Available ${availableDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      color = 'red';
      urgency = 'high';
    }

    return {
      text,
      countdown: { days: diffDays, hours: remainingHours, minutes: remainingMinutes },
      days: diffDays,
      hours: remainingHours,
      minutes: remainingMinutes,
      color,
      urgency
    };
  }, [room.isAvailable, room.nextAvailableDate, currentTime]);

  // Use cached auth check hook to prevent multiple simultaneous API calls
  const { checkAuth: checkAuthenticated } = useAuthCheck();

  const amenityIcons: { [key: string]: React.ReactNode } = {
    WiFi: <Wifi className="h-4 w-4" />,
    "Coffee Machine": <Coffee className="h-4 w-4" />,
    Parking: <Car className="h-4 w-4" />,
    "Private Bathroom": <Bath className="h-4 w-4" />,
    "King Bed": <Bed className="h-4 w-4" />,
    "Queen Bed": <Bed className="h-4 w-4" />,
    "Twin Beds": <Bed className="h-4 w-4" />,
    "Air Conditioning": <Home className="h-4 w-4" />,
    "Sea View": <Waves className="h-4 w-4" />,
    Kitchen: <Utensils className="h-4 w-4" />,
    Jacuzzi: <Waves className="h-4 w-4" />,
    Accessible: <Accessibility className="h-4 w-4" />,
  };

  // Get the primary image or fallback
  const primaryImage =
    room.images && room.images.length > 0
      ? room.images[0]
      : "/placeholder-room.jpg";
  const hasMultipleImages = room.images && room.images.length > 1;

  // Calculate total capacity (prefer guestCapacity if present)
  const totalCapacity = (typeof room.guestCapacity === 'number' && room.guestCapacity > 0)
    ? room.guestCapacity
    : ((room.capacity?.adults || 0) + (room.capacity?.children || 0)) || 2;

  // Format room type for display
  const formatRoomType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ");
  };

  // Format next available date/time
  const formatAvailability = (nextAvailableDate: string | null | undefined) => {
    if (!nextAvailableDate) return null;
    
    const now = new Date();
    const availableDate = new Date(nextAvailableDate);
    const diffMs = availableDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    
    if (diffMs <= 0) return "Available soon";
    
    if (diffDays === 0) {
      if (diffHours === 0) return "Available in less than 1 hour";
      if (diffHours === 1) return "Available in 1 hour";
      return `Available in ${diffHours} hours`;
    }
    
    if (diffDays === 1) {
      if (remainingHours === 0) return "Available in 1 day";
      return `Available in 1 day ${remainingHours}h`;
    }
    
    if (diffDays < 7) {
      if (remainingHours === 0) return `Available in ${diffDays} days`;
      return `Available in ${diffDays} days ${remainingHours}h`;
    }
    
    // For dates more than a week away, show the actual date
    return `Available on ${availableDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: availableDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })}`;
  };

  // Get room features as display items
  const getFeatureItems = () => {
    const features = [];
    if (room.features?.hasBalcony) features.push("Balcony");
    if (room.features?.hasSeaView) features.push("Sea View");
    if (room.features?.hasKitchen) features.push("Kitchen");
    if (room.features?.hasJacuzzi) features.push("Jacuzzi");
    if (room.features?.isAccessible) features.push("Accessible");
    return features;
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `Room ${room.number} - ${formatRoomType(room.type)}`,
        text: room.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // open booking sheet if openBookingId prop matches this room id
  React.useEffect(() => {
    if (openBookingId && openBookingId === room._id) {
      (async () => {
        const ok = await checkAuthenticated();
        if (ok) {
          setShowBookingSheet(true);
        } else {
          routerRef.current.push(
            `/login?next=${encodeURIComponent(`/rooms?book=${room._id}`)}`
          );
        }
      })();
    }
  }, [openBookingId, room._id, checkAuthenticated]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % room.images!.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMultipleImages) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + room.images!.length) % room.images!.length
      );
    }
  };

  return (
    <>
      <Card
        id={`room-${room._id}`}
        className={`group flex flex-col w-full h-full overflow-hidden transition-all duration-500 ${
          room.isAvailable
            ? "hover:shadow-2xl hover:shadow-primary/10 border-primary/20"
            : "opacity-75 bg-gray-50 dark:bg-[hsl(var(--card))]"
        }`}
      >
        {/* Image Section */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex-shrink-0">
          <Image
            key={`${room._id}-${currentImageIndex}`}
            src={room.images?.[currentImageIndex] || primaryImage}
            alt={`Room ${room.number}`}
            fill
            sizes="(max-width: 1024px) 100vw, 360px"
            className="object-cover object-center transition-opacity duration-300"
            style={{ objectPosition: 'center center' }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder-room.jpg";
            }}
            priority={currentImageIndex === 0}
          />

          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg"
                aria-label="Previous image"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-lg"
                aria-label="Next image"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {room.images!.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? "bg-white scale-110" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <Badge 
                className="bg-primary/90 text-white shadow-lg text-xs font-medium"
                style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
              >
                {formatRoomType(room.type)}
              </Badge>
              {room.floor && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-secondary/90 dark:text-primary-foreground"
                  style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Floor {room.floor}
                </Badge>
              )}
            </div>

            {/* Real-Time Availability Status Badge - Top Right */}
            <Badge
              className={`text-xs font-medium shadow-lg whitespace-nowrap ${
                availabilityStatus.color === 'green'
                  ? "bg-green-500/90 text-white"
                  : availabilityStatus.color === 'yellow'
                  ? "bg-yellow-500/90 text-white"
                  : availabilityStatus.color === 'orange'
                  ? "bg-orange-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            >
              {room.isAvailable ? (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 flex-shrink-0 animate-pulse" />
                  <span>Available Now</span>
                </div>
              ) : availabilityStatus.urgency === 'low' ? (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0 animate-pulse" />
                  <span>Soon</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                  <span>Occupied</span>
                </div>
              )}
            </Badge>
          </div>

          {/* Real-Time Availability Banner Overlay with Numeric Countdown */}
          {!room.isAvailable && room.nextAvailableDate && availabilityStatus.countdown && (
            <div 
              className={`absolute bottom-0 left-0 right-0 ${
                availabilityStatus.color === 'yellow' 
                  ? 'bg-yellow-600/80' 
                  : availabilityStatus.color === 'orange'
                  ? 'bg-orange-600/80'
                  : 'bg-red-600/0'
              }`}
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <div className="flex items-center justify-between px-3 py-2.5 text-white">
                {/* Left Side - Calendar Icon & Date Text */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold leading-tight">
                      {availabilityStatus.text}
                    </span>
                    <span className="text-[10px] opacity-80 leading-tight">
                      {new Date(room.nextAvailableDate).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Right Side - Numeric Countdown Timer */}
                <div className="flex items-center gap-1.5">
                  {/* Days */}
                  {availabilityStatus.days > 0 && (
                    <>
                      <div 
                        className="flex flex-col items-center bg-white/25 rounded px-2 py-1 min-w-[32px] shadow-sm"
                        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                      >
                        <span className="text-base font-bold leading-none tabular-nums">{availabilityStatus.days}</span>
                        <span className="text-[8px] uppercase font-semibold opacity-90 leading-tight mt-0.5">
                          {availabilityStatus.days === 1 ? 'DAY' : 'DAYS'}
                        </span>
                      </div>
                      <span className="text-sm font-bold opacity-60">:</span>
                    </>
                  )}
                  
                  {/* Hours */}
                  {(availabilityStatus.days > 0 || availabilityStatus.hours > 0) && (
                    <>
                      <div 
                        className="flex flex-col items-center bg-white/25 rounded px-2 py-1 min-w-[32px] shadow-sm"
                        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                      >
                        <span className="text-base font-bold leading-none tabular-nums">
                          {String(availabilityStatus.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase font-semibold opacity-90 leading-tight mt-0.5">
                          {availabilityStatus.hours === 1 ? 'HOUR' : 'HOURS'}
                        </span>
                      </div>
                      <span className="text-sm font-bold opacity-60">:</span>
                    </>
                  )}
                  
                  {/* Minutes */}
                  <div 
                    className="flex flex-col items-center bg-white/25 rounded px-2 py-1 min-w-[32px] shadow-sm"
                    style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
                  >
                    <span className="text-base font-bold leading-none tabular-nums">
                      {String(availabilityStatus.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] uppercase font-semibold opacity-90 leading-tight mt-0.5">
                      {availabilityStatus.minutes === 1 ? 'MIN' : 'MINS'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-bold mb-2 text-gray-900 dark:text-primary group-hover:text-primary transition-colors">
                Room {room.number}
              </CardTitle>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{totalCapacity} guests</span>
                </div>

                {room.size && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Home className="h-4 w-4" />
                    <span>{room.size} sqm</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-primary mb-1">
                ₱{room.pricePerNight.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">per night</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pt-2 pb-0 flex flex-col flex-1">
          <div className="space-y-3 flex-1">
            {/* Description */}
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
              {room.description}
            </p>

            {/* Features */}
            {getFeatureItems().length > 0 && (
              <div className="flex flex-wrap gap-1">
                {getFeatureItems()
                  .slice(0, 3)
                  .map((feature) => (
                    <Badge
                      key={feature}
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      {feature}
                    </Badge>
                  ))}
                {getFeatureItems().length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{getFeatureItems().length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Amenities */}
            <div className="grid grid-cols-2 gap-2">
              {(room.amenities || []).slice(0, 4).map((amenity: string) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                >
                  <div className="flex-shrink-0 text-primary">
                    {amenityIcons[amenity] || <div className="h-3 w-3" />}
                  </div>
                  <span className="truncate">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 h-10">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Room {room.number} - {formatRoomType(room.type)}
                  </DialogTitle>
                  <DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        className={`text-xs ${
                          availabilityStatus.color === 'green'
                            ? 'bg-green-500 text-white'
                            : availabilityStatus.color === 'yellow'
                            ? 'bg-yellow-500 text-white'
                            : availabilityStatus.color === 'orange'
                            ? 'bg-orange-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {availabilityStatus.text}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated: {currentTime.toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="relative h-56 w-full rounded-md overflow-hidden">
                    <Image
                      src={primaryImage}
                      alt={`Room ${room.number}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover"
                      onError={(event) => {
                        const target = event.currentTarget;
                        target.src = "/placeholder-room.jpg";
                      }}
                    />
                  </div>

                  <DialogDescription className="text-sm text-gray-700 dark:text-gray-300">
                    {room.description ||
                      "A comfortable and well-appointed room designed for your relaxation and convenience."}
                  </DialogDescription>

                  {/* Room Details with Timestamps */}
                  <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
                    <div>
                      <p className="text-muted-foreground text-xs">Capacity</p>
                      <p className="font-semibold">{totalCapacity} guests</p>
                    </div>
                    {room.size && (
                      <div>
                        <p className="text-muted-foreground text-xs">Size</p>
                        <p className="font-semibold">{room.size} sqm</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground text-xs">Price</p>
                      <p className="font-semibold">₱{room.pricePerNight.toLocaleString()}/night</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="font-semibold capitalize">{room.status}</p>
                    </div>
                  </div>

                  {/* Room Metadata */}
                  {(room.createdAt || room.updatedAt) && (
                    <div className="border-t pt-3 space-y-1 text-xs text-muted-foreground">
                      {room.createdAt && (
                        <div className="flex justify-between">
                          <span>Room Added:</span>
                          <span>{new Date(room.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}</span>
                        </div>
                      )}
                      {room.updatedAt && (
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span>{new Date(room.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(room.amenities || []).length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-semibold mb-2">Amenities</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(room.amenities || []).map((amenity: string) => (
                          <Badge
                            key={amenity}
                            variant="secondary"
                            className="text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className=" lg:flex lg:justify-center lg:space-x-2">
                  <DialogClose asChild>
                    <Button>Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {room.isAvailable ? (
              <Button
                className="flex-1 h-10 bg-primary hover:bg-primary/90 text-white font-medium"
                onClick={async () => {
                  // Check session via cookie-aware endpoint, then open sheet or redirect to login
                  const ok = await checkAuthenticated();
                  if (ok) {
                    setShowBookingSheet(true);
                  } else {
                    try {
                      window.dispatchEvent(
                        new CustomEvent("openLoginDialog", {
                          detail: { roomId: room._id },
                        })
                      );
                    } catch (e) {
                      const next = encodeURIComponent(`/rooms?book=${room._id}`);
                      router.push(`/login?next=${next}`);
                    }
                  }
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Now
              </Button>
            ) : (
              <Button
                className="flex-1 h-10 bg-gray-400 text-gray-600 cursor-not-allowed"
                disabled
              >
                Not Available
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Booking Sheet as controlled component */}
      <BookingSheet
        room={room}
        initialOpen={showBookingSheet}
        onOpenChange={setShowBookingSheet}
      >
        <div />
      </BookingSheet>
    </>
  );
}

// Optional: handle global event for opening the sheet (after login)
if (typeof window !== "undefined") {
  window.addEventListener("openBooking", (e: Event) => {
    try {
      const detail = (e as CustomEvent).detail;
      // Optionally dispatch or handle open logic
    } catch (_) {}
  });
}
