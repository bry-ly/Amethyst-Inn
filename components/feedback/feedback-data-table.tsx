"use client";

import React from "react";
import { z } from "zod";
import { toast } from "sonner";
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
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import { 
  IconChevronDown, 
  IconChevronsLeft, 
  IconChevronLeft, 
  IconChevronRight, 
  IconChevronsRight, 
  IconGripVertical, 
  IconLayoutColumns, 
  IconLoader2, 
  IconEye, 
  IconTrash,
  IconCircleCheck,
  IconCircleX
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export const feedbackSchema = z.object({
  _id: z.string(),
  title: z.string(),
  message: z.string(),
  rating: z.number().min(1).max(5),
  category: z.string(),
  isApproved: z.boolean().optional().default(false),
  isPublic: z.boolean().optional().default(true),
  user: z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
  }),
  response: z.object({
    message: z.string().optional(),
    respondedBy: z.object({
      _id: z.string(),
      name: z.string(),
    }).optional(),
    respondedAt: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

type Feedback = z.infer<typeof feedbackSchema>;

type TableMeta = {
  onView?: (feedback: Feedback) => void;
  onApprove?: (feedback: Feedback) => void;
  onReject?: (feedback: Feedback) => void;
  onDelete?: (feedback: Feedback) => Promise<void>;
  openViewDialog?: (feedback: Feedback) => void;
  openApproveDialog?: (feedback: Feedback) => void;
  openRejectDialog?: (feedback: Feedback) => void;
  openDeleteDialog?: (feedback: Feedback) => void;
  busyId?: string | null;
};

function StatusBadge({ isApproved }: { isApproved: boolean }) {
  const styles = isApproved
    ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20"
    : "border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20";
  return (
    <Badge variant="outline" className={styles}>
      {isApproved ? "Approved" : "Pending"}
    </Badge>
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

function RenderStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

const columns: ColumnDef<Feedback>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original._id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.user.name}</p>
        <p className="text-xs text-muted-foreground">{row.original.user.email}</p>
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.original.title}>
        {row.original.title}
      </div>
    ),
  },
  {
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => <RenderStars rating={row.original.rating} />,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.category}
      </Badge>
    ),
  },
  {
    accessorKey: "isApproved",
    header: "Status",
    cell: ({ row }) => <StatusBadge isApproved={row.original.isApproved ?? false} />,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta | undefined;
      const isBusy = meta?.busyId === row.original._id;
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => meta?.openViewDialog?.(row.original)}
          >
            <IconEye className="mr-1 size-4" />
            View
          </Button>
          {!row.original.isApproved && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:text-green-700"
              onClick={() => meta?.openApproveDialog?.(row.original)}
            >
              <IconCircleCheck className="mr-1 size-4" />
              Approve
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-orange-600 hover:text-orange-700"
            onClick={() => meta?.openRejectDialog?.(row.original)}
          >
            <IconCircleX className="mr-1 size-4" />
            Reject
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isBusy}
            onClick={() => meta?.openDeleteDialog?.(row.original)}
          >
            {isBusy ? (
              <IconLoader2 className="mr-1 size-4 animate-spin" />
            ) : (
              <IconTrash className="mr-1 size-4" />
            )}
            Delete
          </Button>
        </div>
      );
    },
  },
];

function DraggableRow({ row }: { row: Row<Feedback> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id,
  });
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function FeedbackDataTable({
  data,
  onFeedbackUpdated,
}: {
  data: Feedback[];
  onFeedbackUpdated?: () => void;
}) {
  const safeData = Array.isArray(data) ? data : [];
  const [rows, setRows] = React.useState<Feedback[]>(safeData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  
  // Dialog states
  const [viewingFeedback, setViewingFeedback] = React.useState<Feedback | null>(null);
  const [approvingFeedback, setApprovingFeedback] = React.useState<Feedback | null>(null);
  const [rejectingFeedback, setRejectingFeedback] = React.useState<Feedback | null>(null);
  const [deletingFeedback, setDeletingFeedback] = React.useState<Feedback | null>(null);
  const [responseMessage, setResponseMessage] = React.useState("");

  // Sync rows when data prop changes
  React.useEffect(() => {
    setRows(safeData);
  }, [safeData]);

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );
  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => rows.map((r) => r._id).filter(Boolean),
    [rows]
  );

  const openViewDialog = React.useCallback((feedback: Feedback) => {
    setViewingFeedback(feedback);
  }, []);

  const closeViewDialog = React.useCallback(() => {
    setViewingFeedback(null);
  }, []);

  const openApproveDialog = React.useCallback((feedback: Feedback) => {
    setApprovingFeedback(feedback);
    setResponseMessage("");
  }, []);

  const closeApproveDialog = React.useCallback(() => {
    if (busyId && approvingFeedback && busyId === approvingFeedback._id) return;
    setApprovingFeedback(null);
    setResponseMessage("");
  }, [busyId, approvingFeedback]);

  const submitApprove = React.useCallback(async () => {
    if (!approvingFeedback) return;
    try {
      setBusyId(approvingFeedback._id);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const token = localStorage.getItem("token");
        if (token) headers["authorization"] = `Bearer ${token}`;
      } catch {}
      const res = await fetch(`/api/feedback/${approvingFeedback._id}/approve`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          isApproved: true,
          responseMessage: responseMessage || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to approve feedback: ${res.status} ${text}`);
      }
      toast.success("Feedback approved successfully");
      onFeedbackUpdated?.();
      setApprovingFeedback(null);
      setResponseMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve feedback.");
    } finally {
      setBusyId(null);
    }
  }, [approvingFeedback, responseMessage, onFeedbackUpdated]);

  const openRejectDialog = React.useCallback((feedback: Feedback) => {
    setRejectingFeedback(feedback);
    setResponseMessage("");
  }, []);

  const closeRejectDialog = React.useCallback(() => {
    if (busyId && rejectingFeedback && busyId === rejectingFeedback._id) return;
    setRejectingFeedback(null);
    setResponseMessage("");
  }, [busyId, rejectingFeedback]);

  const submitReject = React.useCallback(async () => {
    if (!rejectingFeedback) return;
    try {
      setBusyId(rejectingFeedback._id);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const token = localStorage.getItem("token");
        if (token) headers["authorization"] = `Bearer ${token}`;
      } catch {}
      const res = await fetch(`/api/feedback/${rejectingFeedback._id}/approve`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          isApproved: false,
          responseMessage: responseMessage || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to reject feedback: ${res.status} ${text}`);
      }
      toast.success("Feedback rejected");
      onFeedbackUpdated?.();
      setRejectingFeedback(null);
      setResponseMessage("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject feedback.");
    } finally {
      setBusyId(null);
    }
  }, [rejectingFeedback, responseMessage, onFeedbackUpdated]);

  const openDeleteDialog = React.useCallback((feedback: Feedback) => {
    setDeletingFeedback(feedback);
  }, []);

  const closeDeleteDialog = React.useCallback(() => {
    setDeletingFeedback(null);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!deletingFeedback) return;
    try {
      setBusyId(deletingFeedback._id);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const token = localStorage.getItem("token");
        if (token) headers["authorization"] = `Bearer ${token}`;
      } catch {}
      const res = await fetch(`/api/feedback/${deletingFeedback._id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete feedback: ${res.status} ${text}`);
      }
      setRows((prev) => prev.filter((r) => r._id !== deletingFeedback._id));
      toast.success("Feedback deleted successfully");
      onFeedbackUpdated?.();
      setDeletingFeedback(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete feedback.");
    } finally {
      setBusyId(null);
    }
  }, [deletingFeedback, onFeedbackUpdated]);

  const isDeleting = React.useMemo(
    () => (deletingFeedback ? busyId === deletingFeedback._id : false),
    [deletingFeedback, busyId]
  );

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
    meta: {
      openViewDialog,
      openApproveDialog,
      openRejectDialog,
      openDeleteDialog,
      busyId,
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setRows((current) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return current;
        return arrayMove(current, oldIndex, newIndex);
      });
    }
  }

  return (
    <div className="w-full flex-col gap-4">
      <div className="flex items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">
          Total feedback: {rows.length}
        </div>
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
              {table
                .getAllColumns()
                .filter((c) => typeof c.accessorFn !== "undefined" && c.getCanHide())
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

      <div className="overflow-hidden rounded-lg border mx-4 mt-3">
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
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between px-4 mt-3">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
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
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
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
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
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

      {/* View Dialog */}
      <Dialog open={!!viewingFeedback} onOpenChange={(open) => {
        if (!open) closeViewDialog();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {viewingFeedback && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">User</p>
                <p className="text-lg">{viewingFeedback.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {viewingFeedback.user.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Title</p>
                <p className="text-lg">{viewingFeedback.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rating</p>
                <RenderStars rating={viewingFeedback.rating} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <Badge variant="outline" className="capitalize">
                  {viewingFeedback.category}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="text-base whitespace-pre-wrap">
                  {viewingFeedback.message}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="flex gap-2 items-center">
                  <StatusBadge isApproved={viewingFeedback.isApproved ?? false} />
                  {viewingFeedback.isPublic ? (
                    <Badge variant="outline">Public</Badge>
                  ) : (
                    <Badge variant="outline">Private</Badge>
                  )}
                </div>
              </div>
              {viewingFeedback.response?.message && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Admin Response
                  </p>
                  <p className="text-base">{viewingFeedback.response.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    By {viewingFeedback.response.respondedBy?.name} on{" "}
                    {viewingFeedback.response.respondedAt
                      ? new Date(viewingFeedback.response.respondedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={!!approvingFeedback} onOpenChange={(open) => {
        if (!open) closeApproveDialog();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Feedback</DialogTitle>
            <DialogDescription>
              This feedback will be approved and may be displayed publicly as a
              testimonial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="approve-response" className="text-sm font-medium">
                Response Message (Optional)
              </Label>
              <Textarea
                id="approve-response"
                placeholder="Thank you for your feedback..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeApproveDialog}
              disabled={busyId === approvingFeedback?._id}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitApprove()}
              disabled={busyId === approvingFeedback?._id}
            >
              {busyId === approvingFeedback?._id ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Approve Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingFeedback} onOpenChange={(open) => {
        if (!open) closeRejectDialog();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Feedback</DialogTitle>
            <DialogDescription>
              This feedback will be marked as rejected and will not be displayed
              publicly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-response" className="text-sm font-medium">
                Response Message (Optional)
              </Label>
              <Textarea
                id="reject-response"
                placeholder="Reason for rejection..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRejectDialog}
              disabled={busyId === rejectingFeedback?._id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void submitReject()}
              disabled={busyId === rejectingFeedback?._id}
            >
              {busyId === rejectingFeedback?._id ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Reject Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deletingFeedback}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            closeDeleteDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the feedback
              from "{deletingFeedback?.user.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={closeDeleteDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {isDeleting ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default React.memo(FeedbackDataTable);
