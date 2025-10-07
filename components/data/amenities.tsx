import { Rss, Car, Coffee, Utensils, Waves, Shield, Users,} from "lucide-react";

export interface Amenity {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const amenities: Amenity[] = [
  {
    icon: <Rss className="h-8 w-8" />,
    title: "Free WiFi",
    description: "High-speed internet access throughout the property",
  },
  {
    icon: <Car className="h-8 w-8" />,
    title: "Free Parking",
    description: "Complimentary parking spaces for all guests",
  },
  {
    icon: <Coffee className="h-8 w-8" />,
    title: "Coffee Lounge",
    description: "24/7 coffee and tea service in our comfortable lounge",
  },
  {
    icon: <Utensils className="h-8 w-8" />,
    title: "Breakfast Service",
    description: "Continental breakfast served daily from 7:00 to 10:00 AM",
  },
  {
    icon: <Waves className="h-8 w-8" />,
    title: "Pool Access",
    description: "Pool Access 70:00 AM to 10:00 PM",
  },
  {
    icon: <Waves className="h-8 w-8" />,
    title: "Garden Area",
    description: "Beautiful outdoor space for relaxation and recreation",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "24/7 Security",
    description: "Round-the-clock security for your peace of mind",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Concierge Service",
    description:
      "Personalized assistance with local recommendations and bookings",
  },
];
