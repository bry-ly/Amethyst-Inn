import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Room {
  _id: string;
  number: string;
  images?: string[];
  type: 'single' | 'double' | 'suite' | 'deluxe' | 'family' | 'presidential' | 'standard' | 'premium';
  pricePerNight: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order';
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
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomFilters {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  floor?: number;
  hasBalcony?: boolean;
  hasSeaView?: boolean;
  hasKitchen?: boolean;
  hasJacuzzi?: boolean;
  isAccessible?: boolean;
  search?: string;
}

export interface UseRoomsOptions {
  filters?: RoomFilters;
  autoFetch?: boolean;
}

export interface UseRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  } | null;
  refetch: () => Promise<void>;
  updateFilters: (newFilters: Partial<RoomFilters>) => void;
}

export function useRooms(options: UseRoomsOptions = {}): UseRoomsReturn {
  const { filters = {}, autoFetch = true } = options;
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    current: number;
    pages: number;
    total: number;
    limit: number;
  } | null>(null);
  const [currentFilters, setCurrentFilters] = useState<RoomFilters>(filters);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/api/rooms?${queryString}` : '/api/rooms';

      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        setRooms(data.data || data);
        setPagination(data.pagination || null);
      } else {
        const errorMessage = data.error || data.message || 'Failed to fetch rooms';
        setError(errorMessage);
        toast.error(errorMessage, { description: 'Unable to load rooms' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching rooms:', err);
      toast.error(errorMessage, { description: 'Unable to load rooms' });
    } finally {
      setLoading(false);
    }
  }, [currentFilters]);

  const updateFilters = useCallback((newFilters: Partial<RoomFilters>) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (autoFetch) {
      fetchRooms();
    }
  }, [fetchRooms, autoFetch]);

  return {
    rooms,
    loading,
    error,
    pagination,
    refetch,
    updateFilters,
  };
}

// Hook for a single room
export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        setRoom(data.data || data);
      } else {
        const errorMessage = data.error || data.message || 'Failed to fetch room';
        setError(errorMessage);
        toast.error(errorMessage, { description: 'Unable to load room' });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching room:', err);
      toast.error(errorMessage, { description: 'Unable to load room' });
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [fetchRoom, roomId]);

  return {
    room,
    loading,
    error,
    refetch: fetchRoom,
  };
}
