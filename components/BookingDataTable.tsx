"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTable, userSchema } from './data-table';
import { TableLoader } from '@/components/LoadingSpinner';
import { useApiData } from '@/hooks/use-api-data';

// Booking schema based on backend model
export const bookingSchema = z.object({
  _id: z.string(),
  room: z.object({
    _id: z.string(),
    roomNumber: z.string(),
    type: z.string(),
    price: z.number(),
  }),
  guest: z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  totalPrice: z.number(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
  isPaid: z.boolean().optional(),
  paidAt: z.string().optional(),
  paymentMethod: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type Booking = z.infer<typeof bookingSchema>;

// Transform the data-table to work with bookings
const bookingColumns: any[] = [
  {
    id: "select",
    header: ({ table }: any) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onChange={(value: any) => table.toggleAllPageRowsSelected(!!value.target.checked)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }: any) => (
      <div className="flex items-center justify-center">
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(value: any) => row.toggleSelected(!!value.target.checked)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "guest.name",
    header: "Guest Name",
    cell: ({ row }: any) => (
      <div className="w-48">
        <span className="font-medium">{row.original.guest.name}</span>
        <div className="text-sm text-muted-foreground">{row.original.guest.email}</div>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "room.roomNumber",
    header: "Room",
    cell: ({ row }: any) => (
      <div className="w-32">
        <span className="font-medium">Room {row.original.room.roomNumber}</span>
        <div className="text-sm text-muted-foreground">{row.original.room.type}</div>
      </div>
    ),
  },
  {
    accessorKey: "checkInDate",
    header: "Check-in",
    cell: ({ row }: any) => (
      <div className="w-32">
        <span className="text-sm">
          {new Date(row.original.checkInDate).toLocaleDateString('en-US')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "checkOutDate",
    header: "Check-out",
    cell: ({ row }: any) => (
      <div className="w-32">
        <span className="text-sm">
          {new Date(row.original.checkOutDate).toLocaleDateString('en-US')}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price",
    cell: ({ row }: any) => (
      <div className="w-24 text-right">
        <span className="font-medium">₱{Number(row.original.totalPrice).toLocaleString()}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: any) => {
      const status = row.original.status;
      const getStatusColor = (status: string) => {
        switch (status) {
          case "confirmed":
            return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
          case "pending":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
          case "cancelled":
            return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
          case "completed":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
          default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
        }
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
    },
  },
  {
    accessorKey: "isPaid",
    header: "Payment",
    cell: ({ row }: any) => (
      <div className="w-20 text-center">
        {row.original.isPaid ? (
          <span className="text-green-600 font-medium">Paid</span>
        ) : (
          <span className="text-red-600 font-medium">Unpaid</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }: any) => (
      <div className="w-32">
        <span className="text-sm text-muted-foreground">
          {row.original.createdAt 
            ? new Date(row.original.createdAt).toLocaleDateString('en-US')
            : "N/A"
          }
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }: any) => <BookingActions booking={row.original} />,
  },
];

// Booking Actions Component
function BookingActions({ booking }: { booking: Booking }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['authorization'] = `Bearer ${token}`;
      } catch {}
      
      const res = await fetch(`/api/bookings/${booking._id}`, { 
        method: 'PUT', 
        headers, 
        body: JSON.stringify({ status: newStatus }) 
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update booking: ${res.status} ${text}`);
      }
      
      const updated = await res.json();
      setBookings((prev) => prev.map(b => b._id === booking._id ? { ...b, ...updated } : b));
      toast.success('Booking status updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['authorization'] = `Bearer ${token}`;
      } catch {}
      
      const res = await fetch(`/api/bookings/${booking._id}/cancel`, { method: 'PUT', headers });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to cancel booking: ${res.status} ${text}`);
      }
      
      const result = await res.json();
      setBookings((prev) => prev.map(b => b._id === booking._id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {booking.status === "pending" && (
        <>
          <button
            onClick={() => handleUpdateStatus("confirmed")}
            disabled={loading}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Confirm'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cancelling...' : 'Cancel'}
          </button>
        </>
      )}
      {booking.status === "confirmed" && (
        <>
          <button
            onClick={() => handleUpdateStatus("completed")}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Complete'}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cancelling...' : 'Cancel'}
          </button>
        </>
      )}
    </div>
  );
}


// Memoized error component
const ErrorComponent = React.memo(({ error }: { error: string }) => (
  <div className="text-red-600 flex items-center justify-center h-75">
    Error: {error}
  </div>
));

ErrorComponent.displayName = 'ErrorComponent';

// Memoized empty state
const EmptyState = React.memo(() => (
  <div className="flex items-center justify-center h-115 text-primary">
    No bookings found.
  </div>
));

EmptyState.displayName = 'EmptyState';

function BookingDataTable() {
  const { data: bookings, loading, error, refetch } = useApiData<Booking[] | { data?: Booking[]; bookings?: Booking[] }>("/api/bookings", {
    staleTime: 1 * 60 * 1000, // 1 minute (bookings change frequently)
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  // Normalize response to an array to avoid runtime errors
  const rows = useMemo<Booking[]>(() => {
    if (Array.isArray(bookings)) return bookings
    // common API shapes
    const anyResp: any = bookings as any
    if (Array.isArray(anyResp?.data)) return anyResp.data
    if (Array.isArray(anyResp?.bookings)) return anyResp.bookings
    return []
  }, [bookings])

  // Memoize the booking table to prevent unnecessary re-renders
  const memoizedBookingTable = useMemo(() => {
    if (!rows.length) return null;
    
    return (
      <div className="w-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Guest</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Room</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Check-in</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Check-out</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Total Price</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Payment</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking._id}>
                  <td className="border border-gray-300 px-4 py-2">
                    <div>
                      <div className="font-medium">{booking.guest.name}</div>
                      <div className="text-sm text-gray-600">{booking.guest.email}</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div>
                      <div className="font-medium">Room {booking.room.roomNumber}</div>
                      <div className="text-sm text-gray-600">{booking.room.type}</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(booking.checkInDate).toLocaleDateString('en-US')}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(booking.checkOutDate).toLocaleDateString('en-US')}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 font-medium">
                    ₱{Number(booking.totalPrice).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                      booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {booking.isPaid ? (
                      <span className="text-green-600 font-medium">Paid</span>
                    ) : (
                      <span className="text-red-600 font-medium">Unpaid</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <BookingActions booking={booking} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }, [rows]);

  // Memoize the refetch callback
  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  // Show loading state only if we have no data and are loading
  if (loading && rows.length === 0) {
    return <TableLoader message="Loading bookings..." />;
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
  if (rows.length === 0) {
    return <EmptyState />;
  }

  // Show booking table
  return memoizedBookingTable;
}

// Export memoized component
export default React.memo(BookingDataTable);
