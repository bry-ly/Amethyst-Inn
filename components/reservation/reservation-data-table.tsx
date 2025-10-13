"use client";

import React from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
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
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, Row, SortingState, VisibilityState, ColumnFiltersState, useReactTable } from "@tanstack/react-table";
import { IconChevronDown, IconChevronsLeft, IconChevronLeft, IconChevronRight, IconChevronsRight, IconGripVertical, IconLayoutColumns } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  Users, 
  DollarSign, 
  CreditCard,
  Mail,
  User as UserIcon, 
  FileText, 
  ExternalLink,
  Clock,
  AlertCircle,
  Ban,
  CheckCircle2
} from "lucide-react";
import { AuthTokenManager } from "@/utils/cookies";

export const reservationSchema = z.object({
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
  status: z.enum(["pending", "confirmed", "cancelled", "expired", "converted_to_booking"]),
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
  depositAmount: z.number().optional(),
  depositPaid: z.boolean().optional(),
  depositPaidAt: z.string().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  expiresAt: z.string().optional(),
  confirmedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type Reservation = z.infer<typeof reservationSchema>;

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="text-muted-foreground size-7 hover:bg-transparent">
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

function StatusBadge({ status }: { status: Reservation['status'] }) {
  const statusConfig: Record<string, string> = {
    confirmed: 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20',
    pending: 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20',
    cancelled: 'border-red-300 text-red-700 bg-red-50 dark:bg-red-950/20',
    expired: 'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950/20',
    converted_to_booking: 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20',
  };
  return <Badge variant="outline" className={statusConfig[status] || statusConfig.pending}>{status.replace('_', ' ')}</Badge>;
}

function ReservationDetailsDialog({ 
  reservation, 
  open, 
  onOpenChange,
  onConfirm,
  onCancel
}: { 
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = React.useState(false);

  // Compute values before early return to avoid hook violations
  const identificationDocument = React.useMemo(() => {
    if (!reservation) return null;
    const doc = reservation.identificationDocument;
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
  }, [reservation]);

  // Early return AFTER all hooks
  if (!reservation) return null;

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      const token = AuthTokenManager.getToken();
      const res = await fetch(`/api/reservations/${reservation._id}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ paymentMethod: reservation.paymentMethod || 'cash' }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to confirm reservation' }));
        throw new Error(errorData.message || 'Failed to confirm reservation');
      }

      toast.success('Reservation confirmed successfully!');
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming reservation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to confirm reservation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async () => {
    setIsUpdating(true);
    try {
      const token = AuthTokenManager.getToken();
      const res = await fetch(`/api/reservations/${reservation._id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cancellationReason: 'Cancelled by user' }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to cancel reservation' }));
        throw new Error(errorData.message || 'Failed to cancel reservation');
      }

      toast.success('Reservation cancelled successfully');
      onCancel();
      onOpenChange(false);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel reservation');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    setIsGeneratingPaymentLink(true);
    try {
      const token = AuthTokenManager.getToken();
      const res = await fetch(`/api/reservations/${reservation._id}/payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to generate payment link' }));
        throw new Error(errorData.message || 'Failed to generate payment link');
      }

      const data = await res.json();
      
      // Open payment link in new tab
      window.open(data.data.paymentUrl, '_blank');
      
      toast.success('Payment link generated! Opening in new tab...');
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate payment link');
    } finally {
      setIsGeneratingPaymentLink(false);
    }
  };

  const roomNumber = reservation.room?.roomNumber ?? reservation.room?.number ?? 'N/A';
  const roomType = reservation.room?.type ?? 'Unknown';
  const checkInDate = new Date(reservation.checkInDate);
  const checkOutDate = new Date(reservation.checkOutDate);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const expiresAt = reservation.expiresAt ? new Date(reservation.expiresAt) : null;
  const isExpired = expiresAt && new Date() > expiresAt && reservation.status === 'pending';

  // identificationDocument is already computed above with useMemo before early return
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
            Reservation Details
          </DialogTitle>
          <DialogDescription>
            Review and manage reservation #{reservation._id.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <StatusBadge status={reservation.status} />
          </div>

          {/* Expiration Warning */}
          {reservation.status === 'pending' && expiresAt && (
            <div className={`p-3 rounded-lg border ${
              isExpired 
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-start gap-2">
                <AlertCircle className={`h-5 w-5 mt-0.5 ${
                  isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                }`} />
                <div className="text-sm">
                  <p className={`font-medium ${
                    isExpired ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'
                  }`}>
                    {isExpired ? 'Reservation Expired' : 'Pending Confirmation'}
                  </p>
                  <p className={isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                    {isExpired 
                      ? `Expired on ${expiresAt.toLocaleString()}`
                      : `Expires on ${expiresAt.toLocaleString()}`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

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
                <p className="font-medium">{reservation.guest.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p className="font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {reservation.guest.email}
                </p>
              </div>
              {reservation.guest.phone && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{reservation.guest.phone}</p>
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
              {reservation.guestCount && (
                <div className="col-span-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Guests:
                  </span>
                  <p className="font-medium">
                    {reservation.guestCount} {reservation.guestCount === 1 ? 'Guest' : 'Guests'}
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
                <p className="font-bold text-lg">₱{reservation.totalPrice.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Deposit (20%):</span>
                <p className="font-bold text-lg text-primary">
                  ₱{(reservation.depositAmount || Math.round(reservation.totalPrice * 0.2)).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Deposit Status:</span>
                <p className="font-medium">
                  {reservation.depositPaid ? '✅ Paid' : '⏳ Unpaid'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining Balance:</span>
                <p className="font-medium">
                  ₱{(reservation.totalPrice - (reservation.depositAmount || Math.round(reservation.totalPrice * 0.2))).toLocaleString()}
                </p>
              </div>
              {reservation.paymentMethod && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Method:
                  </span>
                  <p className="font-medium capitalize">{reservation.paymentMethod.replace('_', ' ')}</p>
                </div>
              )}
            </div>
          </div>

          {reservation.specialRequests && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Special Requests</h3>
                <p className="text-sm bg-muted/50 p-3 rounded border">{reservation.specialRequests}</p>
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
                            {/* Lines 420-429 omitted */}
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

          {reservation.createdAt && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <p>Reservation created: {new Date(reservation.createdAt).toLocaleString()}</p>
                {reservation.updatedAt && <p>Last updated: {new Date(reservation.updatedAt).toLocaleString()}</p>}
                {reservation.confirmedAt && <p>Confirmed: {new Date(reservation.confirmedAt).toLocaleString()}</p>}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {reservation.status === 'pending' && !isExpired && (
            <>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isUpdating || isGeneratingPaymentLink}
                className="gap-2"
              >
                <Ban className="h-4 w-4" />
                {isUpdating ? 'Cancelling...' : 'Cancel Reservation'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleGeneratePaymentLink}
                disabled={isUpdating || isGeneratingPaymentLink}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {isGeneratingPaymentLink ? 'Generating...' : 'Pay with Stripe'}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isUpdating || isGeneratingPaymentLink}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isUpdating ? 'Confirming...' : 'Confirm & Pay Cash'}
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

interface DraggableRowProps {
  row: Row<Reservation>;
  onViewDetails: (reservation: Reservation) => void;
}

function DraggableRow({ row, onViewDetails }: DraggableRowProps) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: 'relative',
  };

  const reservation = row.original;
  const roomNumber = reservation.room?.roomNumber ?? reservation.room?.number ?? 'N/A';
  const depositAmount = reservation.depositAmount || Math.round(reservation.totalPrice * 0.2);

  return (
    <TableRow ref={setNodeRef} style={style} data-state={row.getIsSelected() && "selected"}>
      <TableCell>
        <DragHandle id={row.original._id} />
      </TableCell>
      <TableCell>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </TableCell>
      <TableCell className="font-medium">
        Room {roomNumber}
        <div className="text-xs text-muted-foreground capitalize">
          {reservation.room?.type || 'Standard'}
        </div>
      </TableCell>
      <TableCell>
        {reservation.guest.name}
        <div className="text-xs text-muted-foreground">
          {reservation.guest.email}
        </div>
      </TableCell>
      <TableCell>
        {new Date(reservation.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </TableCell>
      <TableCell>
        {new Date(reservation.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </TableCell>
      <TableCell>
        <div className="font-medium">₱{depositAmount.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">
          {reservation.depositPaid ? 'Paid' : 'Unpaid'}
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={reservation.status} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(reservation)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ReservationDataTable({ 
  reservations: initialReservations,
  onUpdate
}: { 
  reservations: Reservation[];
  onUpdate?: () => void;
}) {
  const [reservations, setReservations] = React.useState<Reservation[]>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  
  // Load column visibility from localStorage on mount
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem('reservation-table-column-visibility')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  });
  
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  React.useEffect(() => {
    setReservations(initialReservations);
  }, [initialReservations]);
  
  // Save column visibility to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('reservation-table-column-visibility', JSON.stringify(columnVisibility))
    } catch (error) {
      console.error('Failed to save column visibility:', error)
    }
  }, [columnVisibility]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Apply filters to reservations
  const filteredReservations = React.useMemo(() => {
    let filtered = reservations;
    
    // Global search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      filtered = filtered.filter(res => 
        res.guest.name?.toLowerCase().includes(search) ||
        res.room?.roomNumber?.toLowerCase().includes(search) ||
        res.room?.number?.toLowerCase().includes(search) ||
        res._id?.toLowerCase().includes(search)
      );
    }
    
    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(res => res.status === statusFilter);
    }
    
    return filtered;
  }, [reservations, globalFilter, statusFilter]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredReservations?.map(({ _id }) => _id),
    [filteredReservations]
  );

  const columns = React.useMemo<ColumnDef<Reservation>[]>(
    () => [
      {
        id: "drag-handle",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original._id} />,
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "room",
        header: "Room",
        cell: ({ row }) => {
          const roomNumber = row.original.room?.roomNumber ?? row.original.room?.number ?? 'N/A';
          return (
            <div>
              <div className="font-medium">Room {roomNumber}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {row.original.room?.type || 'Standard'}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "guest",
        header: "Guest",
        cell: ({ row }) => (
          <div>
            <div>{row.original.guest.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.guest.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "checkInDate",
        header: "Check-in",
        cell: ({ row }) => new Date(row.original.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
      {
        accessorKey: "checkOutDate",
        header: "Check-out",
        cell: ({ row }) => new Date(row.original.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
      {
        accessorKey: "depositAmount",
        header: "Deposit",
        cell: ({ row }) => {
          const depositAmount = row.original.depositAmount || Math.round(row.original.totalPrice * 0.2);
          return (
            <div>
              <div className="font-medium">₱{depositAmount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {row.original.depositPaid ? 'Paid' : 'Unpaid'}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(row.original)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredReservations,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      columnFilters,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const guestName = row.original.guest.name?.toLowerCase() || "";
      const roomNumber = row.original.room?.roomNumber?.toLowerCase() || row.original.room?.number?.toLowerCase() || "";
      return guestName.includes(searchValue) || roomNumber.includes(searchValue);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(filteredReservations.length / pagination.pageSize),
    getRowId: (row) => row._id,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setReservations((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDetailsOpen(true);
  };

  const handleUpdate = () => {
    onUpdate?.();
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredReservations.length} of {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto h-8">
                  <IconLayoutColumns className="mr-2 h-4 w-4" />
                  Columns
                  <IconChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                {table
                  .getAllColumns()
                  .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by guest name or room number..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>
          
          {(globalFilter || statusFilter !== "all") && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setGlobalFilter("")
                setStatusFilter("all")
              }}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {(() => {
            try {
              const filteredModel = table.getFilteredRowModel?.();
              const filteredRows = filteredModel?.rows || [];
              const selectedRows = filteredRows.filter(row => row?.getIsSelected?.()) || [];
              return `${selectedRows.length} of ${filteredRows.length} row(s) selected.`;
            } catch (error) {
              return '0 of 0 row(s) selected.';
            }
          })()}
        </div>
      </div>

      <div className="rounded-md border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} onViewDetails={handleViewDetails} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No reservations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ReservationDetailsDialog
        reservation={selectedReservation}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onConfirm={handleUpdate}
        onCancel={handleUpdate}
      />
    </div>
  );
}
