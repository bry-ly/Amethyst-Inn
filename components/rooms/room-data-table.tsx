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
import { IconChevronDown, IconChevronsLeft, IconChevronLeft, IconChevronRight, IconChevronsRight, IconGripVertical, IconLayoutColumns, IconLoader2, IconPencil, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AddRoomDialog } from "@/components/rooms/add-room-dialog";
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

// Align with backend Room model shape
export const roomSchema = z.object({
  _id: z.string(),
  number: z.string(),
  images: z.array(z.string()).optional(),
  type: z.enum([
    "single",
    "double",
    "suite",
    "deluxe",
    "family",
    "presidential",
    "standard",
    "premium",
  ]),
  pricePerNight: z.number(),
  status: z.enum([
    "available",
    "occupied",
    "maintenance",
    "cleaning",
    "out_of_order",
  ]).optional().default("available"),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  capacity: z.object({
    adults: z.number(),
    children: z.number().optional().default(0),
  }),
  size: z.number().optional(),
  floor: z.number().optional(),
  features: z
    .object({
      hasBalcony: z.boolean().optional(),
      hasSeaView: z.boolean().optional(),
      hasKitchen: z.boolean().optional(),
      hasJacuzzi: z.boolean().optional(),
      isAccessible: z.boolean().optional(),
    })
    .optional(),
  isActive: z.boolean().optional().default(true),
  lastCleaned: z.string().or(z.date()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  guestCapacity: z.number().optional(),
});

type Room = z.infer<typeof roomSchema>;

type TableMeta = {
  onEdit?: (room: Room) => void
  onDelete?: (room: Room) => Promise<void>
  openEditDialog?: (room: Room) => void
  openDeleteDialog?: (room: Room) => void
  busyId?: string | null
}

function StatusBadge({ status }: { status: Room["status"] }) {
  const styles =
    status === "available"
      ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20"
      : status === "occupied"
      ? "border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20"
      : status === "maintenance"
      ? "border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950/20"
      : status === "cleaning"
      ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20"
      : "border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-950/20";
  return (
    <Badge variant="outline" className={styles}>
      {status || "available"}
    </Badge>
  );
}

// Drag handle like users table
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="text-muted-foreground size-7 hover:bg-transparent">
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<Room>[] = [
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
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
    accessorKey: "number",
    header: "Number",
    cell: ({ row }) => (
      <Button variant="link" className="px-0" onClick={() => window.location.assign(`/rooms/${row.original._id}`)}>
        {row.original.number}
      </Button>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <span className="capitalize">{row.original.type}</span>,
  },
  {
    accessorKey: "pricePerNight",
    header: "Price",
    cell: ({ row }) => `₱${Number(row.original.pricePerNight).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status || "available"} />,
  },
  {
    id: "capacity",
    header: "Guests",
    cell: ({ row }) => (
      <span>
        {typeof row.original.guestCapacity === 'number'
          ? row.original.guestCapacity
          : (Number(row.original.capacity?.adults || 0) + Number(row.original.capacity?.children || 0))}
      </span>
    ),
  },
  {
    accessorKey: "floor",
    header: "Floor",
    cell: ({ row }) => row.original.floor ?? "-",
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TableMeta | undefined
      const isBusy = meta?.busyId === row.original._id
      return (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => meta?.openEditDialog?.(row.original)}>
            <IconPencil className="mr-1 size-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isBusy}
            onClick={() => meta?.openDeleteDialog?.(row.original)}
          >
            {isBusy ? <IconLoader2 className="mr-1 size-4 animate-spin" /> : <IconTrash className="mr-1 size-4" />}
            Delete
          </Button>
        </div>
      )
    },
  },
]

function DraggableRow({ row }: { row: Row<Room> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({ id: row.original._id })
  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  )
}

export function RoomDataTable({ data, onRoomAdded }: { data: Room[]; onRoomAdded?: () => void; }) {
  const safeData = Array.isArray(data) ? data : []
  const [rows, setRows] = React.useState<Room[]>(safeData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [confirmingRoom, setConfirmingRoom] = React.useState<Room | null>(null)
  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null)
  const [editData, setEditData] = React.useState({
    number: "",
    type: "standard" as Room["type"],
    pricePerNight: 0,
    status: "available" as Room["status"],
    guestCapacity: 1,
  })
  const router = useRouter()

  // Sync rows when data prop changes
  React.useEffect(() => {
    setRows(safeData)
  }, [safeData])

  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => rows.map(r => r._id).filter(Boolean), [rows])

  const handleEdit = React.useCallback((room: Room) => {
    router.push(`/rooms/${room._id}/edit`)
  }, [router])

  const handleDelete = React.useCallback(async (room: Room) => {
    try {
      setBusyId(room._id)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      try { const token = localStorage.getItem('token'); if (token) headers['authorization'] = `Bearer ${token}` } catch {}
      const res = await fetch(`/api/rooms/${room._id}`, { method: 'DELETE', headers })
      if (!res.ok) { const text = await res.text(); throw new Error(`Failed to delete room: ${res.status} ${text}`) }
      setRows(prev => prev.filter(r => r._id !== room._id))
      toast.success(`Room ${room.number} deleted.`)
      onRoomAdded?.()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete room.')
    } finally {
      setBusyId(null)
    }
  }, [onRoomAdded])

  const openEditDialog = React.useCallback((room: Room) => {
    setEditingRoom(room)
    setEditData({
      number: room.number || "",
      type: room.type,
      pricePerNight: Number(room.pricePerNight) || 0,
      status: (room.status as Room["status"]) || "available",
      guestCapacity: (typeof room.guestCapacity === 'number' && room.guestCapacity > 0)
        ? room.guestCapacity
        : ((room.capacity?.adults ?? 0) + (room.capacity?.children ?? 0)) || 1,
    })
  }, [])

  const closeEditDialog = React.useCallback(() => {
    if (busyId && editingRoom && busyId === editingRoom._id) return
    setEditingRoom(null)
  }, [busyId, editingRoom])

  const submitEdit = React.useCallback(async () => {
    if (!editingRoom) return
    try {
      setBusyId(editingRoom._id)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      try { const token = localStorage.getItem('token'); if (token) headers['authorization'] = `Bearer ${token}` } catch {}
      const payload: any = {
        number: editData.number,
        type: editData.type,
        pricePerNight: Number(editData.pricePerNight) || 0,
        status: editData.status,
        guestCapacity: Number(editData.guestCapacity) || 1,
      }
      const res = await fetch(`/api/rooms/${editingRoom._id}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (!res.ok) { const text = await res.text(); throw new Error(`Failed to update room: ${res.status} ${text}`) }
      const updated = await res.json()
      setRows(prev => prev.map(r => r._id === editingRoom._id ? { ...r, ...updated } : r))
      toast.success(`Room ${editData.number} updated.`)
      onRoomAdded?.()
      setEditingRoom(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update room.')
    } finally {
      setBusyId(null)
    }
  }, [editingRoom, editData, onRoomAdded])

  const openDeleteDialog = React.useCallback((room: Room) => {
    setConfirmingRoom(room)
  }, [])

  const closeDeleteDialog = React.useCallback(() => {
    setConfirmingRoom(null)
  }, [])

  const confirmDelete = React.useCallback(async () => {
    if (!confirmingRoom) return
    await handleDelete(confirmingRoom)
    setConfirmingRoom(null)
  }, [handleDelete, confirmingRoom])

  const isDeleting = React.useMemo(() => confirmingRoom ? busyId === confirmingRoom._id : false, [confirmingRoom, busyId])

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
      onEdit: handleEdit,
      openEditDialog,
      onDelete: handleDelete,
      openDeleteDialog,
      busyId,
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setRows((current) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        if (oldIndex === -1 || newIndex === -1) return current
        return arrayMove(current, oldIndex, newIndex)
      })
    }
  }

  return (
    <div className="w-full flex-col gap-4">
      <div className="flex items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">Total rooms: {rows.length}</div>
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
              {table.getAllColumns().filter((c) => typeof c.accessorFn !== 'undefined' && c.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AddRoomDialog onRoomAdded={onRoomAdded} />
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

      <div className="flex items-center justify-between px-4 mt-3">
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
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
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

      <AlertDialog open={!!confirmingRoom} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          closeDeleteDialog()
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room {confirmingRoom?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room and remove it from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={closeDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
            >
              {isDeleting ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingRoom} onOpenChange={(open) => {
        if (!open) closeEditDialog()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Room {editingRoom?.number}</DialogTitle>
            <DialogDescription>Update room details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-number">Room Number</Label>
                <Input id="edit-number" value={editData.number}
                  onChange={(e) => setEditData(prev => ({ ...prev, number: e.target.value.toUpperCase() }))}
                  disabled={busyId === editingRoom?._id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select value={editData.type} onValueChange={(v) => setEditData(prev => ({ ...prev, type: v as Room["type"] }))}>
                  <SelectTrigger id="edit-type" className="capitalize">
                    <SelectValue placeholder="Select type" className="capitalize" />
                  </SelectTrigger>
                  <SelectContent>
                    {['single','double','suite','deluxe','family','presidential','standard','premium'].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price per Night</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
                  <Input id="edit-price" type="number" min="0" step="0.01" value={editData.pricePerNight}
                    onChange={(e) => setEditData(prev => ({ ...prev, pricePerNight: Number(e.target.value) || 0 }))}
                    disabled={busyId === editingRoom?._id}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editData.status || 'available'} onValueChange={(v) => setEditData(prev => ({ ...prev, status: v as Room["status"] }))}>
                  <SelectTrigger id="edit-status" className="capitalize">
                    <SelectValue placeholder="Select status" className="capitalize" />
                  </SelectTrigger>
                  <SelectContent>
                    {['available','occupied','maintenance','cleaning','out_of_order'].map(s => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-guestcapacity">Guest Capacity</Label>
                <Input id="edit-guestcapacity" type="number" min="1" max={15} value={editData.guestCapacity}
                  onChange={(e) => setEditData(prev => ({ ...prev, guestCapacity: Number(e.target.value) || 1 }))}
                  disabled={busyId === editingRoom?._id}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} disabled={busyId === editingRoom?._id}>Cancel</Button>
            <Button onClick={() => void submitEdit()} disabled={busyId === editingRoom?._id}>
              {busyId === editingRoom?._id ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default React.memo(RoomDataTable);


