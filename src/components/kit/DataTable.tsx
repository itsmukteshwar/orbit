"use client";

/**
 * DataTable — TanStack Table engine wearing the exact /visitors table skin:
 * same header stripe, row height, borders, hover, pagination row.
 * Structure ideas (column picker, bulk bar) ported from Vyzor data-tables.html.
 *
 * Server-mode: sorting/pagination state is lifted; pass `total` + `onPageChange`.
 */

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/kit/Dropdown";
import { SkeletonRows } from "@/components/kit/Skeleton";

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  loading?: boolean;
  /** Server-mode totals & paging */
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  /** Sorting (server mode — parent refetches) */
  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;
  /** Row interactions */
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
  /** Bulk selection — when provided, a checkbox column is prepended. */
  enableSelection?: boolean;
  /** Renders inside the bulk action bar when ≥1 row selected. */
  bulkActions?: (selectedIds: string[], clear: () => void) => React.ReactNode;
  /** Show the column visibility picker (top right of header row). */
  enableColumnPicker?: boolean;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
  sorting = [],
  onSortingChange,
  onRowClick,
  getRowId,
  enableSelection,
  bulkActions,
  enableColumnPicker,
  emptyState,
}: DataTableProps<T>) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const allColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!enableSelection) return columns;
    const selectCol: ColumnDef<T, unknown> = {
      id: "__select",
      enableSorting: false,
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Select all rows"
          className="h-4 w-4 rounded border-slate-300 accent-orbit-500"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label="Select row"
          className="h-4 w-4 rounded border-slate-300 accent-orbit-500"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    };
    return [selectCol, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { rowSelection, columnVisibility, sorting },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange?.(next);
    },
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    enableRowSelection: !!enableSelection,
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const totalRows = total ?? data.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div>
      {/* Bulk action bar */}
      {enableSelection && selectedIds.length > 0 && bulkActions && (
        <div className="flex items-center gap-3 border-b border-orbit-100 bg-orbit-50/60 px-5 py-2.5">
          <span className="text-[13px] font-semibold text-orbit-700">{selectedIds.length} selected</span>
          <div className="flex items-center gap-2">{bulkActions(selectedIds, () => setRowSelection({}))}</div>
        </div>
      )}

      {/* Column picker */}
      {enableColumnPicker && (
        <div className="flex justify-end px-5 pb-2">
          <Dropdown
            trigger={() => (
              <button
                type="button"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-600 hover:bg-slate-50"
              >
                <Columns3 className="h-3.5 w-3.5 text-slate-400" /> Columns
              </button>
            )}
            items={table
              .getAllLeafColumns()
              .filter((c) => c.id !== "__select" && c.getCanHide())
              .map((col) => ({
                label: `${col.getIsVisible() ? "✓ " : "   "}${typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}`,
                onSelect: () => col.toggleVisibility(),
              }))}
          />
        </div>
      )}

      {/* Table — canon /visitors skin */}
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="border-y border-slate-100 bg-slate-50/60 text-[11px] tracking-wider text-slate-400 uppercase"
              >
                {hg.headers.map((header, i) => {
                  const canSort = header.column.getCanSort() && !!onSortingChange;
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "py-2.5 font-semibold",
                        i === 0 ? "px-5" : "px-4",
                        i === hg.headers.length - 1 && "px-5",
                      )}
                    >
                      {canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 uppercase tracking-wider hover:text-slate-600"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sortDir === "desc" ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <SkeletonRows columns={visibleColumnCount} rows={8} />
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={visibleColumnCount} className="px-5 py-12">
                  {emptyState ?? (
                    <p className="text-center text-[13px] text-slate-400">No records found</p>
                  )}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    "transition-colors hover:bg-slate-50/60",
                    onRowClick && "cursor-pointer",
                    row.getIsSelected() && "bg-orbit-50/40",
                  )}
                >
                  {row.getVisibleCells().map((cell, i) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "py-3",
                        i === 0 ? "px-5" : "px-4",
                        i === row.getVisibleCells().length - 1 && "px-5",
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — canon /visitors footer */}
      {onPageChange && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4 px-5">
          <span className="text-[13px] text-slate-400">
            Showing {data.length} of {totalRows.toLocaleString("en-IN")} entries
          </span>
          <nav aria-label="Table pagination" className="flex items-center gap-1">
            <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Prev
            </PageButton>
            {pageNumbers(page, pageCount).map((p, i) =>
              p === null ? (
                <PageButton key={`gap-${i}`} disabled>
                  …
                </PageButton>
              ) : (
                <PageButton key={p} active={p === page} onClick={() => onPageChange(p)}>
                  {p}
                </PageButton>
              ),
            )}
            <PageButton disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
              Next
            </PageButton>
          </nav>
        </div>
      )}
    </div>
  );
}

function PageButton({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        active
          ? "h-8 min-w-8 rounded-lg bg-orbit-500 px-2 text-[13px] font-medium text-white"
          : "h-8 min-w-8 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      }
    >
      {children}
    </button>
  );
}

/** 1 … 4 5 [6] 7 8 … 20 */
function pageNumbers(current: number, count: number): Array<number | null> {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const pages = new Set<number>([1, count, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b);
  const out: Array<number | null> = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push(null);
    out.push(p);
    prev = p;
  }
  return out;
}
