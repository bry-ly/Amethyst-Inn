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
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconGripVertical, IconPlus, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  DollarSign, 
  Eye, 
  Mail, 
  User as UserIcon,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Receipt,
  ExternalLink
} from "lucide-react";
import { AuthTokenManager } from "@/utils/cookies";

export const paymentSchema = z.object({
  _id: z.string(),
  booking: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      room: z.union([
        z.string(),
        z.object({
          _id: z.string(),
          roomNumber: z.string().optional(),
          number: z.string().optional(),
          type: z.string().optional(),
        })
      ]).optional(),
      checkInDate: z.string(),
      checkOutDate: z.string(),
    })
  ]),
  guest: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      name: z.string(),
      email: z.string(),
    })
  ]),
  amount: z.number(),
  currency: z.string().optional().default("PHP"),
  paymentMethod: z.enum(["cash", "card", "stripe", "paypal", "bank_transfer"]),
  status: z.enum(["pending", "processing", "succeeded", "failed", "refunded", "cancelled"]),
  stripePaymentIntentId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  stripeChargeId: z.string().optional(),
  transactionId: z.string().optional(),
  paymentDetails: z.object({
    brand: z.string().optional(),
    last4: z.string().optional(),
    country: z.string().optional(),
    expiryMonth: z.number().optional(),
    expiryYear: z.number().optional(),
  }).optional(),
  refundAmount: z.number().optional(),
  refundReason: z.string().optional(),
  refundedAt: z.string().optional(),
  errorMessage: z.string().optional(),
  errorCode: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptEmail: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type Payment = z.infer<typeof paymentSchema>;

function PaymentStatusBadge({ status }: { status: Payment['status'] }) {
  const statusConfig: Record<Payment['status'], string> = {
    succeeded: 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20',
    pending: 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20',
    processing: 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20',
    failed: 'border-red-300 text-red-700 bg-red-50 dark:bg-red-950/20',
    refunded: 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/20',
    cancelled: 'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-950/20',
  };
  
  const statusIcon = {
    succeeded: <CheckCircle className="h-3 w-3" />,
    pending: <AlertCircle className="h-3 w-3" />,
    processing: <RefreshCw className="h-3 w-3 animate-spin" />,
    failed: <XCircle className="h-3 w-3" />,
    refunded: <RefreshCw className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  };

  return (
    <Badge variant="outline" className={`${statusConfig[status]} gap-1`}>
      {statusIcon[status]}
      {status}
    </Badge>
  );
}

function PaymentDetailsDialog({
  payment,
  open,
  onOpenChange,
  onRefund,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund: (payment: Payment) => void;
}) {
  if (!payment) return null;

  const guestInfo = typeof payment.guest === 'object' ? payment.guest : null;
  const bookingInfo = typeof payment.booking === 'object' ? payment.booking : null;
  const roomInfo = bookingInfo && typeof bookingInfo.room === 'object' ? bookingInfo.room : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Payment Details
          </DialogTitle>
          <DialogDescription>
            Payment ID: {payment._id.slice(-8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <PaymentStatusBadge status={payment.status} />
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
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-bold text-lg">
                  {payment.currency === 'PHP' ? '₱' : '$'}{payment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Payment Method:</span>
                <p className="font-medium capitalize">{payment.paymentMethod}</p>
              </div>
              {payment.transactionId && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <p className="font-mono text-xs">{payment.transactionId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card Details */}
          {payment.paymentDetails && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Card Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {payment.paymentDetails.brand && (
                    <div>
                      <span className="text-muted-foreground">Card Brand:</span>
                      <p className="font-medium capitalize">{payment.paymentDetails.brand}</p>
                    </div>
                  )}
                  {payment.paymentDetails.last4 && (
                    <div>
                      <span className="text-muted-foreground">Last 4 Digits:</span>
                      <p className="font-medium">•••• {payment.paymentDetails.last4}</p>
                    </div>
                  )}
                  {payment.paymentDetails.expiryMonth && payment.paymentDetails.expiryYear && (
                    <div>
                      <span className="text-muted-foreground">Expiry:</span>
                      <p className="font-medium">
                        {payment.paymentDetails.expiryMonth}/{payment.paymentDetails.expiryYear}
                      </p>
                    </div>
                  )}
                  {payment.paymentDetails.country && (
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <p className="font-medium">{payment.paymentDetails.country}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Guest Information */}
          {guestInfo && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Guest Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{guestInfo.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {guestInfo.email}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Booking Information */}
          {bookingInfo && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Booking Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {roomInfo && (
                    <div>
                      <span className="text-muted-foreground">Room:</span>
                      <p className="font-medium">
                        {roomInfo.roomNumber || roomInfo.number || 'N/A'}
                        {roomInfo.type && <span className="text-xs text-muted-foreground ml-1">({roomInfo.type})</span>}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Check-in:</span>
                    <p className="font-medium">
                      {new Date(bookingInfo.checkInDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Check-out:</span>
                    <p className="font-medium">
                      {new Date(bookingInfo.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Stripe Information */}
          {payment.stripePaymentIntentId && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Stripe Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Payment Intent ID:</span>
                    <p className="font-mono text-xs">{payment.stripePaymentIntentId}</p>
                  </div>
                  {payment.stripeCustomerId && (
                    <div>
                      <span className="text-muted-foreground">Customer ID:</span>
                      <p className="font-mono text-xs">{payment.stripeCustomerId}</p>
                    </div>
                  )}
                  {payment.stripeChargeId && (
                    <div>
                      <span className="text-muted-foreground">Charge ID:</span>
                      <p className="font-mono text-xs">{payment.stripeChargeId}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Refund Information */}
          {payment.refundAmount && payment.refundAmount > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-purple-600">
                  <RefreshCw className="h-4 w-4" />
                  Refund Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Refund Amount:</span>
                    <p className="font-bold text-purple-600">
                      {payment.currency === 'PHP' ? '₱' : '$'}{payment.refundAmount.toLocaleString()}
                    </p>
                  </div>
                  {payment.refundedAt && (
                    <div>
                      <span className="text-muted-foreground">Refunded At:</span>
                      <p className="font-medium">{new Date(payment.refundedAt).toLocaleString()}</p>
                    </div>
                  )}
                  {payment.refundReason && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Reason:</span>
                      <p className="text-sm">{payment.refundReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Error Information */}
          {payment.errorMessage && (
            <>
              <Separator />
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold mb-2 text-red-700 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Error Details
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">{payment.errorMessage}</p>
                {payment.errorCode && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    Error Code: {payment.errorCode}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Receipt */}
          {payment.receiptUrl && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Receipt
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(payment.receiptUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Receipt
                </Button>
              </div>
            </>
          )}

          {/* Timestamps */}
          {payment.createdAt && (
            <>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Payment created: {new Date(payment.createdAt).toLocaleString()}</p>
                {payment.updatedAt && (
                  <p>Last updated: {new Date(payment.updatedAt).toLocaleString()}</p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {payment.status === 'succeeded' && !payment.refundAmount && (
            <Button
              variant="outline"
              onClick={() => onRefund(payment)}
              className="gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4" />
              Issue Refund
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({
  payment,
  open,
  onOpenChange,
  onConfirm,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentId: string, amount: number | null, reason: string) => Promise<void>;
}) {
  const [amount, setAmount] = React.useState<string>('');
  const [reason, setReason] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const refundAmount = amount ? parseFloat(amount) : null;
      await onConfirm(payment._id, refundAmount, reason);
      onOpenChange(false);
      setAmount('');
      setReason('');
    } catch (error) {
      console.error('Refund error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Issue Refund
          </DialogTitle>
          <DialogDescription>
            Refund payment for {payment.currency === 'PHP' ? '₱' : '$'}{payment.amount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">
              Refund Amount (Leave empty for full refund)
            </Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              min="0"
              max={payment.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Max: ${payment.amount}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Reason *</Label>
            <Select value={reason} onValueChange={setReason} required>
              <SelectTrigger id="refund-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requested_by_customer">Requested by Customer</SelectItem>
                <SelectItem value="duplicate">Duplicate Payment</SelectItem>
                <SelectItem value="fraudulent">Fraudulent</SelectItem>
                <SelectItem value="cancelled">Booking Cancelled</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!reason || isProcessing}>
              {isProcessing ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id });
  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const createColumns = (
  onViewDetails: (payment: Payment) => void
): ColumnDef<Payment>[] => [
  {
    id: 'drag',
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original._id} />,
    enableSorting: false,
    enableHiding: false,
  },
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
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'guest',
    header: 'Guest',
    cell: ({ row }) => {
      const guest = typeof row.original.guest === 'object' ? row.original.guest : null;
      return (
        <div className="w-48">
          <div className="font-medium">{guest?.name || 'Unknown'}</div>
          <div className="text-sm text-muted-foreground">{guest?.email || 'N/A'}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const currency = row.original.currency === 'PHP' ? '₱' : '$';
      return (
        <div className="font-medium">
          {currency}{row.original.amount.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Method',
    cell: ({ row }) => (
      <div className="capitalize">{row.original.paymentMethod}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => {
      if (!row.original.createdAt) return 'N/A';
      return new Date(row.original.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetails(row.original)}
        className="gap-2"
      >
        <Eye className="h-4 w-4" />
        View
      </Button>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];

function DraggableRow({ row }: { row: Row<Payment> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? 'opacity-50' : ''}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function PaymentDataTable() {
  const { data, loading, error, refetch } = useApiData<Payment[] | { data?: Payment[]; payments?: Payment[] }>('/api/payments', {
    staleTime: 60_000,
    cacheTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const rows = React.useMemo<Payment[]>(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const possibleKeys = ['data', 'payments'] as const;
      for (const key of possibleKeys) {
        const value = (data as Record<typeof key, unknown>)[key];
        if (Array.isArray(value)) {
          return value as Payment[];
        }
      }
    }
    return [];
  }, [data]);

  const [rowSelection, setRowSelection] = React.useState({});
  
  // Load column visibility from localStorage on mount
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem('payment-table-column-visibility')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  });
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [methodFilter, setMethodFilter] = React.useState<string>("all");
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = React.useState(false);
  
  // Save column visibility to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem('payment-table-column-visibility', JSON.stringify(columnVisibility))
    } catch (error) {
      console.error('Failed to save column visibility:', error)
    }
  }, [columnVisibility]);

  const handleViewDetails = React.useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleRefundClick = React.useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setIsRefundDialogOpen(true);
  }, []);

  const handleRefundConfirm = React.useCallback(async (
    paymentId: string,
    amount: number | null,
    reason: string
  ) => {
    try {
      const token = AuthTokenManager.getToken();
      const response = await fetch(`/api/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to process refund' }));
        throw new Error(errorData.message || 'Failed to process refund');
      }

      toast.success('Refund processed successfully');
      refetch();
      setIsRefundDialogOpen(false);
    } catch (error) {
      console.error('Refund error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process refund');
    }
  }, [refetch]);

  const columns = React.useMemo(
    () => createColumns(handleViewDetails),
    [handleViewDetails]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Apply filters to rows
  const filteredRows = React.useMemo(() => {
    let filtered = rows;
    
    // Global search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      filtered = filtered.filter(payment => {
        const guestInfo = typeof payment.guest === 'object' ? payment.guest : null;
        const guestName = guestInfo?.name?.toLowerCase() || '';
        const guestEmail = guestInfo?.email?.toLowerCase() || '';
        const bookingId = typeof payment.booking === 'string' ? payment.booking : payment.booking?._id || '';
        
        return guestName.includes(search) ||
          guestEmail.includes(search) ||
          bookingId.toLowerCase().includes(search) ||
          payment._id?.toLowerCase().includes(search) ||
          payment.stripePaymentIntentId?.toLowerCase().includes(search);
      });
    }
    
    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Method filter
    if (methodFilter && methodFilter !== "all") {
      filtered = filtered.filter(payment => payment.paymentMethod === methodFilter);
    }
    
    return filtered;
  }, [rows, globalFilter, statusFilter, methodFilter]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredRows.map((p) => p._id).filter(Boolean),
    [filteredRows]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const bookingId = typeof row.original.booking === 'string' ? row.original.booking : row.original.booking?._id || "";
      return bookingId.toLowerCase().includes(searchValue);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = dataIds.indexOf(active.id);
      const newIndex = dataIds.indexOf(over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        // Just for UI, not persisted
        const newData = arrayMove(rows, oldIndex, newIndex);
      }
    }
  }

  if (loading) {
    return <TableLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="text-red-600">Error: {error}</div>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="w-full flex-col gap-4">
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="text-sm text-muted-foreground">Total payments: 0</div>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No payments found</p>
            <p className="text-sm">Payments will appear here once they are created</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PaymentDetailsDialog
        payment={selectedPayment}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onRefund={handleRefundClick}
      />
      <RefundDialog
        payment={selectedPayment}
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
        onConfirm={handleRefundConfirm}
      />

      <div className="w-full flex-col gap-4">
        {/* Search and Filters Section */}
        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredRows.length} of {rows.length} payment{rows.length !== 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconPlus className="h-4 w-4" />
                    <span className="hidden lg:inline">Columns</span>
                    <IconChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {table
                    .getAllColumns()
                    .filter((col) => typeof col.accessorFn !== 'undefined' && col.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by booking ID or payment ID..."
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
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
            
            {(globalFilter || statusFilter !== "all" || methodFilter !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setGlobalFilter("")
                  setStatusFilter("all")
                  setMethodFilter("all")
                }}
                className="whitespace-nowrap"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border mx-4 mt-4">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-4 mt-4">
          <div className="text-muted-foreground hidden lg:flex flex-1 text-sm">
            {Object.keys(rowSelection).length} of {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger id="rows-per-page" className="w-20">
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
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
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
