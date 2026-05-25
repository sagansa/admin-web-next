import * as React from "react";
import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  rowCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearchChange?: (search: string) => void;
  isLoading?: boolean;
  pageSize?: number;
  filters?: React.ReactNode;
  emptyState?: React.ReactNode;
  hideToolbar?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  rowCount,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  isLoading = false,
  pageSize: externalPageSize,
  filters,
  emptyState,
  hideToolbar = false,
}: DataTableProps<TData>) {
  const [pageSize, setPageSize] = React.useState(externalPageSize || 10);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [search, setSearch] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: false,
    manualSorting: false,
    pageCount: rowCount ? Math.ceil(rowCount / pageSize) : undefined,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: externalPageSize || 10,
      },
      globalFilter: "",
    },
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
      globalFilter: search,
    },
    onPaginationChange: (updater) => {
      const newState = typeof updater === 'function' ? updater(table.getState().pagination) : updater;
      setPageIndex(newState.pageIndex);
      setPageSize(newState.pageSize);
      if (onPageChange) onPageChange(newState.pageIndex + 1);
      if (onPageSizeChange) onPageSizeChange(newState.pageSize);
    },
    onGlobalFilterChange: (updater) => {
      const newSearch = typeof updater === 'function' ? updater(search) : updater;
      setSearch(newSearch);
      setPageIndex(0);
      if (onSearchChange) onSearchChange(newSearch);
    },
  });

  // Enable global filtering on all columns
  React.useEffect(() => {
    table.setGlobalFilter(search);
  }, [search, table]);

  return (
    <div className="w-full">
      {/* Search and Filters */}
      {!hideToolbar && (
        <div className="flex items-center gap-4 py-4">
          {onSearchChange && (
            <input
              placeholder={`Search...`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed"
            />
          )}
          {filters && (
            <div className="flex items-center gap-2">
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState ? emptyState : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            {"<"}
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
}
