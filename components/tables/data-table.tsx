"use client";

import * as React from "react";
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
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { z } from "zod";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["guest", "staff", "admin"]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type UserRow = z.infer<typeof userSchema>;

type UserTableMeta = {
  updateRow?: (id: string, updates: Partial<UserRow>) => void;
  removeRow?: (id: string) => void;
  reload?: () => void;
};

// Create a separate component for the drag handle
function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

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

const columns: ColumnDef<UserRow>[] = [
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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return <UserCellViewer user={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="w-64">
        <span className="text-sm text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => (
      <Badge 
        variant="outline" 
        className={
          row.original.role === "admin"
            ? "border-red-300 text-red-700  bg-red-50 dark:bg-red-950/20"
            : row.original.role === "staff"
            ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20"
            : "border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-950/20"
        }
      >
        {row.original.role}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
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
    cell: ({ row, table }) => <UserActions user={row.original} table={table} />,
  },
];

// User Actions Component
const UserActions = React.memo(function UserActions({ user, table }: { user: UserRow; table: import("@tanstack/react-table").Table<UserRow> }) {
  const [loading, setLoading] = React.useState(false);
  const meta = table.options.meta as UserTableMeta | undefined;
  
  const handleEdit = async (updatedUser: Partial<z.infer<typeof userSchema>>) => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['authorization'] = `Bearer ${token}`;
      } catch {}
      
      const res = await fetch(`/api/users/${user._id}`, { 
        method: 'PUT', 
        headers, 
        body: JSON.stringify(updatedUser) 
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to update user: ${res.status} ${text}`);
      }
      
      const updated = await res.json();
      meta?.updateRow?.(user._id, updated);
      meta?.reload?.();
      toast.success('User updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const token = localStorage.getItem('token');
        if (token) headers['authorization'] = `Bearer ${token}`;
      } catch {}
      
      const res = await fetch(`/api/users/${user._id}`, { method: 'DELETE', headers });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to delete user: ${res.status} ${text}`);
      }
      
      meta?.removeRow?.(user._id);
      meta?.reload?.();
      toast.success(`User ${user.name} deleted.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

      return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Edit
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit user</DialogTitle>
              <DialogDescription>Update user information and role.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);
                const payload = {
                  name: String(formData.get('name') || user.name),
                  email: String(formData.get('email') || user.email),
                  role: (formData.get('role') as "guest" | "staff" | "admin") || user.role,
                };
                await handleEdit(payload);
              }}
              className='space-y-4'
            >
              <div className='grid gap-2'>
                <Label htmlFor={`name-${user._id}`}>Name</Label>
                <Input id={`name-${user._id}`} name='name' defaultValue={user.name} />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor={`email-${user._id}`}>Email</Label>
                <Input id={`email-${user._id}`} type='email' name='email' defaultValue={user.email} />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor={`role-${user._id}`}>Role</Label>
                <Select name="role" defaultValue={user.role}>
                  <SelectTrigger id={`role-${user._id}`}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type='submit' disabled={loading}>
                  {loading ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {user.role !== 'admin' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem 
                variant="destructive" 
                onSelect={(e) => e.preventDefault()}
              >
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {user.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        </DropdownMenuContent>
      </DropdownMenu>
  );
});

// User Cell Viewer Component
const UserCellViewer = React.memo(function UserCellViewer({ user }: { user: z.infer<typeof userSchema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {user.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{user.name}</DrawerTitle>
          <DrawerDescription>
            User details and information
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <div className="grid gap-2">
            <Label className="font-medium">Email</Label>
            <div className="text-muted-foreground">{user.email}</div>
          </div>
          <div className="grid gap-2">
            <Label className="font-medium">Role</Label>
            <Badge 
              variant="outline"
              className={
                user.role === "admin"
                  ? "border-red-300 text-red-700 bg-red-50 dark:bg-red-950/20"
                  : user.role === "staff"
                  ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20"
                  : "border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-950/20"
              }
            >
              {user.role}
            </Badge>
          </div>
          {user.createdAt && (
            <div className="grid gap-2">
              <Label className="font-medium">Created</Label>
              <div className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-US')}
              </div>
            </div>
          )}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

const DraggableRow = React.memo(function DraggableRow({ row }: { row: Row<z.infer<typeof userSchema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original._id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
});

export function DataTable({
  data: initialData,
  onReload,
}: {
  data: z.infer<typeof userSchema>[];
  onReload?: () => void;
}) {
  // Ensure initialData is always an array
  const safeInitialData = Array.isArray(initialData) ? initialData : [];
  const [data, setData] = React.useState(() => safeInitialData);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  React.useEffect(() => {
    const refreshedData = Array.isArray(initialData) ? initialData : [];
    setData(refreshedData);
    setRowSelection({});
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [initialData]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => {
      if (!Array.isArray(data)) return [];
      return data.map(({ _id }) => _id).filter(Boolean);
    },
    [data]
  );

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row._id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: Math.ceil((Array.isArray(data) ? data.length : 0) / pagination.pageSize),
    meta: {
      updateRow: (id: string, updates: Partial<UserRow>) => {
        setData((current) =>
          Array.isArray(current)
            ? current.map((row) => (row._id === id ? { ...row, ...updates } : row))
            : current
        );
      },
      removeRow: (id: string) => {
        setData((current) =>
          Array.isArray(current) ? current.filter((row) => row._id !== id) : current
        );
      },
      reload: () => {
        onReload?.();
      },
    } satisfies UserTableMeta,
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((currentData) => {
        if (!Array.isArray(currentData)) return [];
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return currentData;
        return arrayMove(currentData, oldIndex, newIndex);
      });
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">All Users</SelectItem>
            <SelectItem value="past-performance">Admins</SelectItem>
            <SelectItem value="key-personnel">Staff</SelectItem>
            <SelectItem value="focus-documents">Guests</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">All Users</TabsTrigger>
          <TabsTrigger value="past-performance">
            Admins <Badge variant="secondary">{data.filter(u => u.role === 'admin').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Staff <Badge variant="secondary">{data.filter(u => u.role === 'staff').length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Guests</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add User</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4 mt-auto">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
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
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
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
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.filter(row => row.original.role === 'admin').length ? (
                  <SortableContext
                    items={dataIds.filter(id => data.find(u => u._id === id)?.role === 'admin')}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.filter(row => row.original.role === 'admin').map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No admin users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </TabsContent>
      <TabsContent value="key-personnel" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.filter(row => row.original.role === 'staff').length ? (
                  <SortableContext
                    items={dataIds.filter(id => data.find(u => u._id === id)?.role === 'staff')}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.filter(row => row.original.role === 'staff').map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No staff users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
  return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.filter(row => row.original.role === 'guest').length ? (
                  <SortableContext
                    items={dataIds.filter(id => data.find(u => u._id === id)?.role === 'guest')}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.filter(row => row.original.role === 'guest').map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No guest users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
            </div>
      </TabsContent>
    </Tabs>
  );
}

