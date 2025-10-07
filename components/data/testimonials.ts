export interface Testimonial {
  id: number;
  name: string;
  role: string;
  quote: string;
  location?: string;
}

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Emmar G.",
    role: "Business Traveler",
    quote:
      "Quiet rooms, friendly staff, and a very comfortable bed. I slept so well during my trip! The location is perfect for business meetings.",
    location: "Manila",
  },
  {
    id: 2,
    name: "Bryan P.",
    role: "Family Guest",
    quote:
      "Perfect for our family weekend. Clean, safe, and close to everything we needed. The kids loved the garden area!",
    location: "Quezon City",
  },
  {
    id: 3,
    name: "Jared D.",
    role: "Staycation",
    quote:
      "Loved the ambiance and the garden view. Will definitely recommend to friends! Great value for money.",
    location: "Pasig",
  },
  {
    id: 4,
    name: "Louis F.",
    role: "Tourist",
    quote:
      "Amazing hospitality and beautiful rooms. The staff went above and beyond to make our stay memorable. Highly recommended!",
    location: "Cebu",
  },
  {
    id: 5,
    name: "Rhealyn U.",
    role: "Business Traveler",
    quote:
      "Excellent wifi, quiet environment for work calls, and great breakfast. Everything a business traveler needs.",
    location: "Makati",
  },
  {
    id: 6,
    name: "Sarah G.",
    role: "Couple's Retreat",
    quote:
      "Romantic atmosphere, clean facilities, and peaceful surroundings. Perfect for our anniversary getaway!",
    location: "Taguig",
  },
  {
    id: 7,
    name: "Kevin N.",
    role: "Solo Traveler",
    quote:
      "Safe, comfortable, and affordable. The staff made me feel welcome from day one. Great for solo travelers!",
    location: "Davao",
  },
  {
    id: 8,
    name: "Lebron J.",
    role: "Group Stay",
    quote:
      "Booked multiple rooms for our group. Excellent coordination from staff and all rooms were perfectly clean and comfortable.",
    location: "Baguio",
  },
  {
    id: 9,
    name: "Jane C.",
    role: "Weekend Getaway",
    quote:
      "A hidden gem in the city! Beautifully decorated rooms and a serene garden. Perfect for a quick escape from the hustle.",
    location: "Puerto Princesa",
  },
];
