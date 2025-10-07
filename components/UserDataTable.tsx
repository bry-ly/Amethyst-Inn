"use client";

import React, { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTable, userSchema } from './data-table';
import { TableLoader } from '@/components/LoadingSpinner';
import { useApiData } from '@/hooks/use-api-data';

type User = z.infer<typeof userSchema>;


// Memoized error component
const ErrorComponent = React.memo(({ error }: { error: string }) => (
  <div className="text-red-600 flex items-center justify-center h-75">
    Error: {error}
  </div>
));

ErrorComponent.displayName = 'ErrorComponent';

// Memoized empty state
const EmptyState = React.memo(() => (
  <div className="flex items-center justify-center h-75">
    No users found.
  </div>
));

EmptyState.displayName = 'EmptyState';

function UserDataTable() {
  const { data: users, loading, error, refetch } = useApiData<User[]>('/api/users', {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });

  // Ensure users is always an array
  const safeUsers = Array.isArray(users) ? users : [];

  // Memoize the data table to prevent unnecessary re-renders
  const memoizedDataTable = useMemo(() => {
    if (!safeUsers || safeUsers.length === 0) return null;
    return <DataTable data={safeUsers} />;
  }, [safeUsers]);

  // Memoize the refetch callback
  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // Show loading state only if we have no data and are loading
  if (loading && !users) {
    return <TableLoader message="Loading users..." />;
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
  if (!safeUsers || safeUsers.length === 0) {
    return <EmptyState />;
  }

  // Show data table
  return (
    <div className="w-full">
      {memoizedDataTable}
    </div>
  );
}

// Export memoized component
export default React.memo(UserDataTable);
