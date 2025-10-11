"use client";

import React from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { useApiData } from '@/hooks/use-api-data';
import { TableLoader } from '@/components/common/loading-spinner';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, Row, SortingState, VisibilityState, useReactTable } from "@tanstack/react-table";
import { IconChevronDown, IconChevronsLeft, IconChevronLeft, IconChevronRight, IconChevronsRight, IconGripVertical, IconLayoutColumns } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Eye, Calendar, Users, DollarSign, CreditCard, Mail, User as UserIcon, FileText, ExternalLink, Trash2 } from "lucide-react";
import { AuthTokenManager } from "@/utils/cookies";

export const bookingSchema = z.object({
  _id: z.string(),
  room: z.object({
    _id: z.string().optional(),
    roomNumber: z.string().optional(),
    number: z.string().optional(),
    type: z.string().optional(),
    price: z.number().optional(),
    pricePerNight: z.number().optional(),
  }).nullable().optional(),
  guest: z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guestCount: z.number().optional(),
  totalPrice: z.number(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "checked_in", "checked_out", "no_show"]),
  specialRequests: z.string().optional(),
  identificationDocument: z.union([
    z.object({
      _id: z.string(),
      filename: z.string().optional(),
      originalName: z.string().optional(),
      mimetype: z.string().optional(),
      size: z.number().optional(),
      url: z.string().optional(),
      path: z.string().optional(),
    }),
    z.string()
  ]).optional(),
  isPaid: z.boolean().optional(),
  paidAt: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type Booking = z.infer<typeof bookingSchema>;

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="text-muted-foreground size-7 hover:bg-transparent">
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const statusConfig: Record<string, string> = {
    confirmed: 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20',
    pending: 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20',
    cancelled: 'border-red-300 text-red-700 bg-red-50 dark:bg-red-950/20',
    completed: 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20',
    checked_in: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20',
    checked_out: 'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-950/20',
    no_show: 'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950/20',
  };
  return <Badge variant="outline" className={statusConfig[status] || statusConfig.pending}>{status.replace('_', ' ')}</Badge>;
}

function BookingDetailsDialog({ 
  booking, 
  open, 
  onOpenChange,
  onStatusUpdate 
}: { 
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: () => void;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const identificationDocument = React.useMemo(() => {
    const doc = booking?.identificationDocument;
    if (!doc) return null;
    if (typeof doc === 'string') {
      const backendUrl = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '');
      const normalizedPath = doc.startsWith('http') ? doc : `${backendUrl}/${doc.replace(/^\//, '')}`;
      const filename = doc.split('/').pop() ?? 'document';
      return {
        _id: doc,
        filename,
        originalName: filename,
        mimetype: undefined,
        size: undefined,
        url: normalizedPath,
        path: doc,
      };
    }
    return doc;
  }, [booking?.identificationDocument]);

  if (!booking) return null;

  const handleStatusUpdate = async (newStatus: 'confirmed' | 'cancelled') => {
    setIsUpdating(true);
    try {
      const token = AuthTokenManager.getToken();
      const endpoint = newStatus === 'cancelled' 
        ? `/api/bookings/${booking._id}/cancel`
        : `/api/bookings/${booking._id}`;
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to update booking' }));
        throw new Error(errorData.message || 'Failed to update booking');
      }
      
      const data = await res.json();
      toast.success(`Booking ${newStatus === 'confirmed' ? 'confirmed' : 'rejected'} successfully`);
      onStatusUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    } finally {
      setIsUpdating(false);
    }
  };

  const roomNumber = booking.room?.roomNumber ?? booking.room?.number ?? 'N/A';
  const roomType = booking.room?.type ?? 'Unknown';
  const checkInDate = new Date(booking.checkInDate);
  const checkOutDate = new Date(booking.checkOutDate);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  const identificationDocumentName = identificationDocument?.originalName ?? identificationDocument?.filename ?? 'Document on file';
  const identificationDocumentSize = typeof identificationDocument?.size === 'number'
    ? `${(identificationDocument.size / 1024).toFixed(1)} KB`
    : null;
  const identificationDocumentType = identificationDocument?.mimetype ?? (identificationDocument?.path ? 'Document' : 'Unknown type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Booking Details
          </DialogTitle>
          <DialogDescription>
            Review and manage booking #{booking._id.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <StatusBadge status={booking.status} />
          </div>

          <Separator />

          {/* Guest Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Guest Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{booking.guest.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {booking.guest.email}
                </p>
              </div>
              {booking.guest.phone && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{booking.guest.phone}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Room & Stay Details */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Stay Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Room:</span>
                <p className="font-medium">Room {roomNumber}</p>
                <p className="text-xs text-muted-foreground capitalize">{roomType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <p className="font-medium">{nights} {nights === 1 ? 'Night' : 'Nights'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Check-in:</span>
                <p className="font-medium">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Check-out:</span>
                <p className="font-medium">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              {booking.guestCount && (
                <div className="col-span-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Guests:
                  </span>
                  <p className="font-medium">
                    {booking.guestCount} {booking.guestCount === 1 ? 'Guest' : 'Guests'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <p className="font-bold text-lg">₱{booking.totalPrice.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment Status:</span>
                <p className="font-medium">{booking.isPaid ? '✅ Paid' : '⏳ Unpaid'}</p>
              </div>
              {booking.paymentMethod && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Method:
                  </span>
                  <p className="font-medium capitalize">{booking.paymentMethod.replace('_', ' ')}</p>
                </div>
              )}
              {booking.paymentReference && (
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <p className="font-medium font-mono text-xs">{booking.paymentReference}</p>
                </div>
              )}
            </div>
          </div>

          {booking.specialRequests && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Special Requests</h3>
                <p className="text-sm bg-muted/50 p-3 rounded border">{booking.specialRequests}</p>
              </div>
            </>
          )}

          {identificationDocument && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Identification Document
                </h3>
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  {/* Show thumbnail if image, otherwise file icon */}
                  {identificationDocument?.url && (identificationDocument?.mimetype?.startsWith?.('image') || /\.(jpe?g|png|webp|bmp|gif|tiff)$/i.test(identificationDocument?.url || '')) ? (
                    <button
                      onClick={() => identificationDocument?.url && window.open(identificationDocument.url, '_blank')}
                      className="flex-shrink-0 rounded overflow-hidden border border-slate-200 dark:border-slate-800"
                      aria-label="Open document in new tab"
                    >
                      <img src={identificationDocument.url} alt={identificationDocumentName} className="w-12 h-12 object-cover" />
                    </button>
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Verification Document Uploaded
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      {identificationDocumentName}
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-300">
                      {identificationDocumentSize ? `${identificationDocumentSize} • ${identificationDocumentType}` : identificationDocumentType}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (identificationDocument?.url) {
                        window.open(identificationDocument.url, '_blank');
                      }
                    }}
                    className="gap-2 text-blue-600 hover:text-blue-700 border-blue-300"
                    disabled={!identificationDocument?.url}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </div>
              </div>
            </>
          )}

          {booking.createdAt && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <p>Booking created: {new Date(booking.createdAt).toLocaleString()}</p>
                {booking.updatedAt && <p>Last updated: {new Date(booking.updatedAt).toLocaleString()}</p>}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {booking.status === 'pending' && (
            <>
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={isUpdating}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                {isUpdating ? 'Rejecting...' : 'Reject Booking'}
              </Button>
              <Button
                onClick={() => handleStatusUpdate('confirmed')}
                disabled={isUpdating}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isUpdating ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const createColumns = (
  onViewDetails: (booking: Booking) => void,
  onDelete: (booking: Booking) => void,
  deletingId: string | null
): ColumnDef<Booking>[] => [
  { id: 'drag', header: () => null, cell: ({ row }) => <DragHandle id={row.original._id} /> },
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'guest',
    header: 'Guest',
    cell: ({ row }) => (
      <div className="w-56">
        <div className="font-medium">{row.original.guest?.name ?? 'Unknown guest'}</div>
        <div className="text-sm text-muted-foreground">{row.original.guest?.email ?? 'No email'}</div>
      </div>
    ),
  },
  {
    accessorKey: 'room',
    header: 'Room',
    cell: ({ row }) => {
      const room = row.original.room;
      const roomNumber = room?.roomNumber ?? room?.number ?? 'N/A';
      const roomType = room?.type ?? 'Unknown';
      return (
        <div className="w-44">
          <div className="font-medium">Room {roomNumber}</div>
          <div className="text-sm text-muted-foreground capitalize">{roomType}</div>
        </div>
      );
    },
  },
  { accessorKey: 'checkInDate', header: 'Check-in', cell: ({ row }) => new Date(row.original.checkInDate).toLocaleDateString('en-US') },
  { accessorKey: 'checkOutDate', header: 'Check-out', cell: ({ row }) => new Date(row.original.checkOutDate).toLocaleDateString('en-US') },
  { accessorKey: 'totalPrice', header: 'Total', cell: ({ row }) => `₱${Number(row.original.totalPrice).toLocaleString()}` },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'isPaid', header: 'Payment', cell: ({ row }) => row.original.isPaid ? 'Paid' : 'Unpaid' },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(row.original)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(row.original)}
          disabled={deletingId === row.original._id}
          className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          {deletingId === row.original._id ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

function DraggableRow({ row }: { row: Row<Booking> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original._id });
  return (
    <TableRow data-state={row.getIsSelected() && 'selected'} data-dragging={isDragging} ref={setNodeRef} className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80" style={{ transform: CSS.Transform.toString(transform), transition }}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  );
}

function BookingDataTable() {
  const { data, loading, error, refetch } = useApiData<Booking[] | { data?: Booking[]; bookings?: Booking[] }>("/api/bookings", {
    staleTime: 60_000,
    cacheTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const rows = React.useMemo<Booking[]>(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const possibleArrays = ['data', 'bookings'] as const;
      for (const key of possibleArrays) {
        const value = (data as Record<typeof key, unknown>)[key];
        if (Array.isArray(value)) {
          return value as Booking[];
        }
      }
    }
    return [];
  }, [data]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleViewDetails = React.useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  }, []);

  const handleStatusUpdate = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDeleteBooking = React.useCallback(async (booking: Booking) => {
    const confirmed = window.confirm(`Delete booking ${booking._id.slice(-6)}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(booking._id);
    try {
      const token = AuthTokenManager.getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete booking');
      }

      toast.success('Booking deleted successfully');
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete booking';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }, [refetch]);

  const columns = React.useMemo(
    () => createColumns(handleViewDetails, handleDeleteBooking, deletingId),
    [handleViewDetails, handleDeleteBooking, deletingId]
  );

  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}));
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => rows.map(b => b._id).filter(Boolean), [rows]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility, rowSelection, pagination },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(rows.length / pagination.pageSize),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      // purely UI reorder
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const next = arrayMove(rows, oldIndex, newIndex);
      // Not storing locally since data comes from API; this keeps UI stable
    }
  }

  
  if (error) return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="text-red-600">Error: {error}</div>
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  );
  
  if (!rows.length) {
    return (
      <div className="w-full flex-col gap-4">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="text-sm text-muted-foreground">Total bookings: 0</div>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No bookings found</p>
            <p className="text-sm">Bookings will appear here once they are created</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <BookingDetailsDialog
        booking={selectedBooking}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onStatusUpdate={handleStatusUpdate}
      />
      <div className="w-full flex-col gap-4">
      <div className="flex items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">Total bookings: {rows.length}</div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table.getAllColumns().filter(c => typeof c.accessorFn !== 'undefined' && c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border mx-4 mt-3">
        <DndContext collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd} sensors={sensors}>
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-4 mt-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
            <Select value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default React.memo(BookingDataTable);
