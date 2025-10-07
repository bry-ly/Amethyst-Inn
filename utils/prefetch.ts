import { prefetchData } from '@/hooks/use-api-data';

// Prefetch commonly accessed public data (no auth required)
export function prefetchCommonData() {
  // Prefetch rooms data (commonly accessed and public)
  prefetchData('/api/rooms');
}

// Aggressive prefetching for immediate data availability
export function prefetchAllData() {
  // Prefetch all main data sources
  prefetchData('/api/rooms');
  prefetchData('/api/users');
  prefetchData('/api/bookings');
  
  // Also prefetch auth data
  prefetchData('/api/auth/me');
}

// Prefetch data based on user role and likely navigation patterns
export function prefetchUserSpecificData(userRole?: string) {
  if (userRole === 'admin' || userRole === 'staff') {
    // Admins and staff are likely to access all data
    prefetchData('/api/users');
    prefetchData('/api/bookings');
    prefetchData('/api/rooms');
  } else if (userRole === 'guest') {
    // Guests are likely to access rooms and their own bookings
    prefetchData('/api/rooms');
    prefetchData('/api/bookings/my');
  }
}

// Prefetch data when hovering over navigation links
export function prefetchOnHover(href: string) {
  switch (href) {
    case '/rooms':
      prefetchData('/api/rooms');
      break;
    case '/users':
      prefetchData('/api/users');
      break;
    case '/booking':
      prefetchData('/api/bookings');
      break;
    default:
      break;
  }
}

// Prefetch data when component is about to mount
export function prefetchOnMount(componentName: string) {
  switch (componentName) {
    case 'RoomsList':
      prefetchData('/api/rooms');
      break;
    case 'UsersPageWrapper':
      prefetchData('/api/users');
      break;
    case 'BookingDataTable':
      prefetchData('/api/bookings');
      break;
    default:
      break;
  }
}
