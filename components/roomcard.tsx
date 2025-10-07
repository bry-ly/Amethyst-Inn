import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
// import { BookNowSheet } from "./booking/BookNowSheet";
// import { ImageWithFallback } from "./figma/ImageWithFallback";
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
  // HotTub,
  Accessibility,
} from "lucide-react";
// Define Room interface locally
interface Room {
  _id: string;
  number: string;
  images?: string[];
  type: 'single' | 'double' | 'suite' | 'deluxe' | 'family' | 'presidential' | 'standard' | 'premium';
  pricePerNight: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
  description?: string;
  amenities?: string[];
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
  createdAt?: string;
  updatedAt?: string;
}

interface RoomCardProps {
  room: Room;
}

export function RoomCard({ room }: RoomCardProps) {
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
    "Kitchen": <Utensils className="h-4 w-4" />,
    "Jacuzzi": <Waves className="h-4 w-4" />,
    "Accessible": <Accessibility className="h-4 w-4" />,
  };

  // Get the primary image or fallback
  const primaryImage = room.images && room.images.length > 0 ? room.images[0] : '/placeholder-room.jpg';
  
  // Calculate total capacity
  const totalCapacity = (room.capacity?.adults || 2) + (room.capacity?.children || 0);
  
  // Format room type for display
  const formatRoomType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };
  
  // Get room features as display items
  const getFeatureItems = () => {
    const features = [];
    if (room.features?.hasBalcony) features.push('Balcony');
    if (room.features?.hasSeaView) features.push('Sea View');
    if (room.features?.hasKitchen) features.push('Kitchen');
    if (room.features?.hasJacuzzi) features.push('Jacuzzi');
    if (room.features?.isAccessible) features.push('Accessible');
    return features;
  };

  return (
    <Card
      id={`room-${room._id}`}
      className={`overflow-hidden transition-all duration-300 ${
        room.isAvailable
          ? "hover:shadow-lg"
          : "opacity-75 bg-gray-50 dark:bg-[hsl(var(--card))]"
      }`}
    >
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-64 xl:h-56">
        <img
          src={primaryImage}
          alt={room.number}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-room.jpg';
          }}
        />
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col gap-1 sm:gap-2">
          <Badge className="bg-primary text-white dark:text-white dark:bg-slate-600 shadow-md text-xs">
            {formatRoomType(room.type)}
          </Badge>
          <Badge
            className={`text-xs ${
              room.isAvailable
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {room.isAvailable ? (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Available</span>
                <span className="sm:hidden">Free</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Unavailable</span>
                <span className="sm:hidden">Full</span>
              </div>
            )}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-3 sm:p-4 lg:p-3">
        <div className="flex justify-between items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl lg:text-lg gh-heading mb-1 sm:mb-2">
              Room {room.number}
            </CardTitle>
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1 text-sm sm:text-sm text-gray-600">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{totalCapacity} guests</span>
                {(room.capacity?.children || 0) > 0 && (
                  <span className="text-xs text-gray-500">
                    ({room.capacity?.adults || 2} adults, {room.capacity?.children || 0} children)
                  </span>
                )}
              </div>
              {room.size && (
                <div className="flex items-center gap-1 text-sm sm:text-sm text-gray-600">
                  <span className="font-medium">{room.size} sqm</span>
                </div>
              )}
              {room.floor && (
                <div className="flex items-center gap-1 text-sm sm:text-sm text-gray-600">
                  <span>Floor {room.floor}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl sm:text-2xl lg:text-xl font-bold text-primary mb-0.5 sm:mb-1">
              ₱{room.pricePerNight}
            </div>
            <div className="text-sm sm:text-sm text-gray-500">per night</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 lg:p-3 pt-0">
        <div className="space-y-2 sm:space-y-3 lg:space-y-2">
          <p className="text-sm sm:text-sm text-gray-700 leading-relaxed line-clamp-2">
            {room.description}
          </p>

          {/* Show features if available */}
          {getFeatureItems().length > 0 && (
            <div className="flex flex-wrap gap-1">
              {getFeatureItems().slice(0, 3).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-2">
            {(room.amenities || []).slice(0, 4).map((amenity: string) => (
              <div
                key={amenity}
                className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-sm"
              >
                <div className="flex-shrink-0">
                  {amenityIcons[amenity] || (
                    <div className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                </div>
                <span className="text-gray-600">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 sm:pt-3 lg:pt-2">
          {room.isAvailable ? (
            <Button
              className="w-full h-10 sm:h-11 lg:h-10 text-sm sm:text-base text-white dark:text-black font-medium"
              variant="default"
              onClick={() => {
                // TODO: Implement booking functionality
                console.log('Book room:', room._id);
              }}
            >
              Book Now
            </Button>
          ) : (
            <Button
              className="w-full h-10 sm:h-11 lg:h-10 bg-gray-400 text-gray-950 dark:text-gray-300 cursor-not-allowed text-sm sm:text-base font-medium"
              disabled
            >
              Not Available
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
