"use client";

import { DataTable } from '@/components/tables/data-table';
import { useApiData } from '@/hooks/use-api-data';
import { TableLoader } from '@/components/common/loading-spinner';

export function UsersPageWrapper({ role, initialUsers }: { role?: string; initialUsers?: any[] }) {
  const shouldFetch = role === 'admin' && !initialUsers;
  const { data, loading, error, refetch } = useApiData('/api/users', {
    staleTime: 60_000,
    cacheTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: shouldFetch,
  });

  const effectiveData = initialUsers && role === 'admin' ? initialUsers : data;

  if (shouldFetch && loading && !effectiveData) {
    return <TableLoader />;
  }

  if (role === 'admin' && error && !effectiveData) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-red-600">Error: {error}</div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const users = Array.isArray(effectiveData) ? effectiveData : [];

  return <DataTable data={users} onReload={refetch} canManage={role === 'admin'} />;
}
