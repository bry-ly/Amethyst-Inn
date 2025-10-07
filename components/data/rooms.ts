// 🏨 List of Rooms (static data for now, can later come from API)
export const rooms = [
  {
    id: 1,
    name: "Deluxe King Room",
    type: "Deluxe",
    price: 150,
    image:
      "https://images.unsplash.com/photo-1655292912612-bb5b1bda9355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Spacious king room with modern amenities and city view. Perfect for couples or business travelers.",
    capacity: 2,
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "King Bed",
      "Parking",
    ],
    size: "350 sq ft",
    beds: "1 King Bed",
    isAvailable: true,
  },
  {
    id: 2,
    name: "Executive Suite",
    type: "Suite",
    price: 250,
    image:
      "https://images.unsplash.com/photo-1698870157085-11632d2ddef8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Luxurious suite with separate living area, perfect for extended stays and special occasions.",
    capacity: 4,
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "King Bed",
      "Parking",
    ],
    size: "600 sq ft",
    beds: "1 King Bed + Sofa Bed",
    isAvailable: false,
  },
  {
    id: 3,
    name: "Standard Queen Room",
    type: "Standard",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1729605411476-defbdab14c54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Comfortable queen room with all essential amenities for a pleasant stay.",
    capacity: 2,
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "Queen Bed"],
    size: "300 sq ft",
    beds: "1 Queen Bed",
    isAvailable: true,
  },
  {
    id: 4,
    name: "Family Room",
    type: "Family",
    price: 200,
    image:
      "https://images.unsplash.com/photo-1654243397456-73da481a623e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Spacious family room with multiple beds, ideal for families traveling together.",
    capacity: 4,
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "Twin Beds",
      "Parking",
    ],
    size: "450 sq ft",
    beds: "2 Twin Beds + 1 Queen Bed",
    isAvailable: true,
  },
  {
    id: 5,
    name: "Premium King Room",
    type: "Premium",
    price: 180,
    image:
      "https://images.unsplash.com/photo-1678924133506-7508daa13c7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Premium room featuring upgraded amenities and elegant bathroom with modern fixtures.",
    capacity: 2,
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "King Bed",
      "Parking",
    ],
    size: "400 sq ft",
    beds: "1 King Bed",
    isAvailable: false,
  },
  {
    id: 6,
    name: "Garden View Room",
    type: "Standard",
    price: 130,
    image:
      "https://images.unsplash.com/photo-1697535199809-95583d780900?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Peaceful room overlooking our beautiful garden, perfect for relaxation and tranquility.",
    capacity: 2,
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "Queen Bed"],
    size: "320 sq ft",
    beds: "1 Queen Bed",
    isAvailable: true,
  },
  {
    id: 7,
    name: "Cozy Twin Room",
    type: "Standard",
    price: 110,
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Comfortable twin room ideal for friends or colleagues traveling together.",
    capacity: 2,
    amenities: ["WiFi", "Private Bathroom", "Twin Beds", "Parking"],
    size: "300 sq ft",
    beds: "2 Twin Beds",
    isAvailable: false,
  },
  {
    id: 8,
    name: "Ocean Breeze Suite",
    type: "Suite",
    price: 280,
    image:
      "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Spacious suite with lounge area and balcony offering refreshing breezes.",
    capacity: 4,
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "King Bed",
      "Parking",
      "Balcony",
    ],
    size: "650 sq ft",
    beds: "1 King Bed + Sofa Bed",
    isAvailable: true,
  },
  {
    id: 9,
    name: "Premium Queen Room",
    type: "Premium",
    price: 170,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Elegant queen room with premium linens and a workspace for productivity.",
    capacity: 2,
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "Queen Bed",
      "Parking",
      "Work Desk",
    ],
    size: "380 sq ft",
    beds: "1 Queen Bed",
    isAvailable: true,
  },
  {
    id: 10,
    name: "Entertainment Suite",
    type: "Suite",
    price: 10000,
    image:
      "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    description:
      "Suite with large tv with gaming console also have a personal computer",
    capacity: 15,
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "Couch",
      "Tv with gaming console",
    ],
    size: "1000 sq ft",
    beds: "1 king Bed + 2 Sofa Beds",
    isAvailable: true,
  },
];
