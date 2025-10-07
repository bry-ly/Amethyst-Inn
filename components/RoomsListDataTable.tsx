"use client";

import React, { useMemo, useCallback } from 'react';
import { z } from 'zod';
import { RoomDataTable, roomSchema } from '@/components/room-data-table';
import { GridLoader } from '@/components/LoadingSpinner';
import { useApiData } from '@/hooks/use-api-data';

// Memoized error component
const ErrorComponent = React.memo(({ error }: { error: string }) => (
  <div className="text-red-600 flex items-center justify-center text-wrap h-75">Error: {error}</div>
));

ErrorComponent.displayName = 'ErrorComponent';

// Memoized empty state
const EmptyState = React.memo(() => (
  <div className="flex items-center justify-center h-115">
    <div className="text-center text-primary">
      <div className="text-xl font-medium">No rooms found</div>
      <div className="text-sm mt-1">Try adding rooms</div>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

function RoomsListDataTable() {
  const { data: rooms, loading, error, refetch } = useApiData<z.infer<typeof roomSchema>[]>('/api/rooms', {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });

  // Memoize the refetch callback
  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // Show loading state only if we have no data and are loading
  if (loading && !rooms) {
    return <GridLoader message="Loading rooms..." />;
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4">
        <ErrorComponent error={error} />
        <button
          onClick={handleRefetch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show empty state
  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
    return <EmptyState />;
  }

  // Show rooms data table
  return <RoomDataTable data={rooms} onRoomAdded={handleRefetch} />;
}

// Export memoized component
export default React.memo(RoomsListDataTable);
