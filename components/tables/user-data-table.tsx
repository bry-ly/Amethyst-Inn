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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/use-debounce";
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

// User schema aligned with backend User model
export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin", "staff", "manager"]),
  isActive: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type User = z.infer<typeof userSchema>;

type TableMeta = {
  onEdit?: (user: User) => void
  onDelete?: (user: User) => Promise<void>
  openEditDialog?: (user: User) => void
  openDeleteDialog?: (user: User) => void
  busyId?: string | null
  canManage?: boolean
}

function RoleBadge({ role }: { role: User["role"] }) {
  const styles =
    role === "admin"
      ? "border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/20"
      : role === "manager"
      ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20"
      : role === "staff"
      ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20"
      : "border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-950/20";
  return (
    <Badge variant="outline" className={styles}>
      {role}
    </Badge>
  );
}

function StatusBadge({ isActive }: { isActive?: boolean }) {
  return (
    <Badge variant="outline" className={isActive !== false ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20" : "border-red-300 text-red-700 bg-red-50 dark:bg-red-950/20"}>
      {isActive !== false ? "Active" : "Inactive"}
    </Badge>
  );
}

// Drag handle component
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({ id })
  return (
    <Button {...attributes} {...listeners} variant="ghost" size="icon" className="text-muted-foreground size-7 hover:bg-transparent">
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

function buildColumns(canManage: boolean): ColumnDef<User>[] {
  const cols: ColumnDef<User>[] = [
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
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => <StatusBadge isActive={row.original.isActive} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        if (!row.original.createdAt) return "-"
        try {
          return new Date(row.original.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        } catch {
          return "-"
        }
      },
    },
  ]

  if (canManage) {
    cols.push({
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row, table }) => {
        const meta = table.options.meta as TableMeta | undefined
        const isBusy = meta?.busyId === row.original._id
        const isAdmin = row.original.role === 'admin'
        return (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => meta?.openEditDialog?.(row.original)}>
              <IconPencil className="mr-1 size-4" />
              Edit
            </Button>
            {!isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                disabled={isBusy}
                onClick={() => meta?.openDeleteDialog?.(row.original)}
              >
                {isBusy ? <IconLoader2 className="mr-1 size-4 animate-spin" /> : <IconTrash className="mr-1 size-4" />}
                Delete
              </Button>
            )}
          </div>
        )
      },
    })
  }

  return cols
}

function DraggableRow({ row }: { row: Row<User> }) {
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

export function UserDataTable({ data, canManage = false, onDataChanged }: { data: User[]; canManage?: boolean; onDataChanged?: () => void; }) {
  const safeData = Array.isArray(data) ? data : []
  const [rows, setRows] = React.useState<User[]>(safeData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [globalFilter, setGlobalFilter] = React.useState("")
  const debouncedGlobalFilter = useDebounce(globalFilter, 300)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [confirmingUser, setConfirmingUser] = React.useState<User | null>(null)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [editData, setEditData] = React.useState({
    name: "",
    email: "",
    role: "user" as User["role"],
    isActive: true,
  })

  // Sync rows when data prop changes
  React.useEffect(() => {
    setRows(safeData)
  }, [safeData])

  const sensors = useSensors(useSensor(MouseSensor, {}), useSensor(TouchSensor, {}), useSensor(KeyboardSensor, {}))
  const dataIds = React.useMemo<UniqueIdentifier[]>(() => rows.map(r => r._id).filter(Boolean), [rows])

  const columns = React.useMemo(() => buildColumns(canManage), [canManage])

  const handleDelete = React.useCallback(async (user: User) => {
    try {
      setBusyId(user._id)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      try { const token = localStorage.getItem('token'); if (token) headers['authorization'] = `Bearer ${token}` } catch {}
      const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE', headers })
      if (!res.ok) { const text = await res.text(); throw new Error(`Failed to delete user: ${res.status} ${text}`) }
      setRows(prev => prev.filter(r => r._id !== user._id))
      toast.success(`User ${user.name} deleted.`)
      onDataChanged?.()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user.')
    } finally {
      setBusyId(null)
    }
  }, [onDataChanged])

  const openEditDialog = React.useCallback((user: User) => {
    setEditingUser(user)
    setEditData({
      name: user.name || "",
      email: user.email || "",
      role: user.role,
      isActive: user.isActive !== false,
    })
  }, [])

  const closeEditDialog = React.useCallback(() => {
    if (busyId && editingUser && busyId === editingUser._id) return
    setEditingUser(null)
  }, [busyId, editingUser])

  const submitEdit = React.useCallback(async () => {
    if (!editingUser) return
    try {
      setBusyId(editingUser._id)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      try { const token = localStorage.getItem('token'); if (token) headers['authorization'] = `Bearer ${token}` } catch {}
      const payload: any = {
        name: editData.name,
        email: editData.email,
        role: editData.role,
        isActive: editData.isActive,
      }
      const res = await fetch(`/api/users/${editingUser._id}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
      if (!res.ok) { const text = await res.text(); throw new Error(`Failed to update user: ${res.status} ${text}`) }
      const updated = await res.json()
      setRows(prev => prev.map(r => r._id === editingUser._id ? { ...r, ...updated } : r))
      toast.success(`User ${editData.name} updated.`)
      onDataChanged?.()
      setEditingUser(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user.')
    } finally {
      setBusyId(null)
    }
  }, [editingUser, editData, onDataChanged])

  const openDeleteDialog = React.useCallback((user: User) => {
    setConfirmingUser(user)
  }, [])

  const closeDeleteDialog = React.useCallback(() => {
    setConfirmingUser(null)
  }, [])

  const confirmDelete = React.useCallback(async () => {
    if (!confirmingUser) return
    await handleDelete(confirmingUser)
    setConfirmingUser(null)
  }, [handleDelete, confirmingUser])

  const isDeleting = React.useMemo(() => confirmingUser ? busyId === confirmingUser._id : false, [confirmingUser, busyId])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility, rowSelection, pagination, globalFilter: debouncedGlobalFilter },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase()
      const name = row.original.name?.toLowerCase() || ""
      const email = row.original.email?.toLowerCase() || ""
      return name.includes(searchValue) || email.includes(searchValue)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      openEditDialog,
      onDelete: handleDelete,
      openDeleteDialog,
      busyId,
      canManage,
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
      <div className="flex items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Input
            placeholder="Search users by name or email..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          <div className="text-sm text-muted-foreground">
            {rows.length} user{rows.length !== 1 ? 's' : ''}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <IconLayoutColumns />
              <span className="hidden lg:inline">Columns</span>
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
                  <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">No results.</TableCell>
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

      <AlertDialog open={!!confirmingUser} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          closeDeleteDialog()
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user {confirmingUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove all associated data.
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

      <Dialog open={!!editingUser} onOpenChange={(open) => {
        if (!open) closeEditDialog()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User {editingUser?.name}</DialogTitle>
            <DialogDescription>Update user details and save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={busyId === editingUser?._id}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editData.email}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={busyId === editingUser?._id}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editData.role} onValueChange={(v) => setEditData(prev => ({ ...prev, role: v as User["role"] }))}>
                  <SelectTrigger id="edit-role" className="capitalize">
                    <SelectValue placeholder="Select role" className="capitalize" />
                  </SelectTrigger>
                  <SelectContent>
                    {['user', 'staff', 'manager', 'admin'].map(r => (
                      <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editData.isActive ? 'active' : 'inactive'} onValueChange={(v) => setEditData(prev => ({ ...prev, isActive: v === 'active' }))}>
                  <SelectTrigger id="edit-status" className="capitalize">
                    <SelectValue placeholder="Select status" className="capitalize" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} disabled={busyId === editingUser?._id}>Cancel</Button>
            <Button onClick={() => void submitEdit()} disabled={busyId === editingUser?._id}>
              {busyId === editingUser?._id ? <IconLoader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default React.memo(UserDataTable);
