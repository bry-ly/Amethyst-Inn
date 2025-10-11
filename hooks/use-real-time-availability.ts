import { useState, useEffect, useCallback, useRef } from 'react';

export interface AvailabilityStatus {
  isAvailable: boolean;
  nextAvailableDate: string | null;
  timeUntilAvailable: string | null;
  lastUpdated: Date;
}

interface UseRealTimeAvailabilityOptions {
  roomId: string;
  initialAvailable?: boolean;
  initialNextAvailableDate?: string | null;
  refreshInterval?: number; // in milliseconds, default 60000 (1 minute)
}

/**
 * Hook for real-time room availability tracking
 * Updates availability status and countdown timers
 */
export function useRealTimeAvailability({
  roomId,
  initialAvailable = false,
  initialNextAvailableDate = null,
  refreshInterval = 60000, // 1 minute default
}: UseRealTimeAvailabilityOptions) {
  const [status, setStatus] = useState<AvailabilityStatus>({
    isAvailable: initialAvailable,
    nextAvailableDate: initialNextAvailableDate,
    timeUntilAvailable: null,
    lastUpdated: new Date(),
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate time until available
  const calculateTimeUntilAvailable = useCallback((nextDate: string | null): string | null => {
    if (!nextDate) return null;

    const now = new Date();
    const availableDate = new Date(nextDate);
    const diffMs = availableDate.getTime() - now.getTime();

    if (diffMs <= 0) return "Available now";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const remainingHours = diffHours % 24;
    const remainingMinutes = diffMinutes % 60;

    if (diffDays === 0) {
      if (diffHours === 0) {
        if (diffMinutes === 0) return "Available in less than 1 minute";
        if (diffMinutes === 1) return "Available in 1 minute";
        return `Available in ${diffMinutes} minutes`;
      }
      if (diffHours === 1 && remainingMinutes === 0) return "Available in 1 hour";
      if (remainingMinutes === 0) return `Available in ${diffHours} hours`;
      return `Available in ${diffHours}h ${remainingMinutes}m`;
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
  }, []);

  // Update countdown every minute
  const updateCountdown = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      timeUntilAvailable: calculateTimeUntilAvailable(prev.nextAvailableDate),
      lastUpdated: new Date(),
    }));
  }, [calculateTimeUntilAvailable]);

  // Fetch latest availability from API
  const refreshAvailability = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        const roomData = data.data || data;

        setStatus({
          isAvailable: roomData.isAvailable || roomData.status === 'available',
          nextAvailableDate: roomData.nextAvailableDate || null,
          timeUntilAvailable: calculateTimeUntilAvailable(roomData.nextAvailableDate),
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error refreshing availability:', error);
    }
  }, [roomId, calculateTimeUntilAvailable]);

  // Initialize and setup intervals
  useEffect(() => {
    // Initial calculation
    updateCountdown();

    // Update countdown every 60 seconds
    countdownRef.current = setInterval(updateCountdown, 60000);

    // Refresh availability from API at specified interval
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(refreshAvailability, refreshInterval);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [updateCountdown, refreshAvailability, refreshInterval]);

  // Update when props change
  useEffect(() => {
    setStatus(prev => ({
      ...prev,
      isAvailable: initialAvailable,
      nextAvailableDate: initialNextAvailableDate,
      timeUntilAvailable: calculateTimeUntilAvailable(initialNextAvailableDate),
    }));
  }, [initialAvailable, initialNextAvailableDate, calculateTimeUntilAvailable]);

  return {
    ...status,
    refresh: refreshAvailability,
  };
}

/**
 * Format a date for display
 */
export function formatAvailabilityDate(date: string | null | undefined): string {
  if (!date) return 'Not available';

  const availableDate = new Date(date);
  const now = new Date();

  return availableDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    year: availableDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

/**
 * Get availability badge color
 */
export function getAvailabilityColor(isAvailable: boolean, nextAvailableDate: string | null): string {
  if (isAvailable) return 'green';
  
  if (!nextAvailableDate) return 'red';
  
  const now = new Date();
  const availableDate = new Date(nextAvailableDate);
  const diffHours = (availableDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (diffHours <= 24) return 'yellow'; // Available within 24 hours
  if (diffHours <= 72) return 'orange'; // Available within 3 days
  return 'red'; // Available later
}
