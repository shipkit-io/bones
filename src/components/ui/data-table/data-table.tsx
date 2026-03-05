"use client";

/*
 * DataTable component built on top of TanStack Table v8
 * Provides a feature-rich data table with:
 * - Global search filtering
 * - Column visibility toggle
 * - Pagination
 * - Row actions (edit, delete, custom actions)
 * - Export functionality
 * - Loading states
 * - Animated row transitions
 */

import { ChevronDownIcon, DotsHorizontalIcon, DownloadIcon, PlusIcon } from "@radix-ui/react-icons";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type ExpandedState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";
import { Loader } from "@/components/primitives/loader";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onAdd?: () => void;
	onEdit?: (row: TData) => void;
	onDelete?: (row: TData) => void;
	onExport?: () => void;
	addButtonLabel?: string;
	searchPlaceholder?: string;
	rowActions?: Array<{
		label: string;
		component: React.ComponentType<{ item: TData }>;
	}>;
	isLoading?: boolean;
	className?: string;
	enableExpanding?: boolean;
	initialExpanded?: ExpandedState;
	enableRowSelection?: boolean;
	onSelectionChange?: (selectedRows: TData[]) => void;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	onAdd,
	onEdit,
	onDelete,
	onExport,
	addButtonLabel = "Add New",
	searchPlaceholder = "Filter...",
	rowActions,
	isLoading = false,
	className,
	enableExpanding = false,
	initialExpanded = {},
	enableRowSelection = false,
	onSelectionChange,
}: DataTableProps<TData, TValue>) {
	const [mounted, setMounted] = React.useState(false);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});
	const [globalFilter, setGlobalFilter] = React.useState("");
	const [expanded, setExpanded] = React.useState<ExpandedState>(initialExpanded);

	// Initialize expanded state only once after mounting
	React.useEffect(() => {
		setMounted(true);
		// if (enableExpanding && Object.keys(initialExpanded).length === 0) {
		// 	// Auto-expand all library groups by default
		// 	const expandedState: ExpandedState = {};
		// 	data.forEach((item: any, index) => {
		// 		if (groupBy.includes("library")) {
		// 			expandedState[index] = true;
		// 		}
		// 	});
		// 	setExpanded(expandedState);
		// }
	}, []);

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter,
			expanded,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		onExpandedChange: setExpanded,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
		enableExpanding,
		enableRowSelection,
		enableMultiRowSelection: true,
		autoResetExpanded: false,
	});

	// Handle selection changes
	React.useEffect(() => {
		if (!mounted || !onSelectionChange) return;

		// Get current selection state
		const selectedRows = table.getSelectedRowModel().rows;
		const selectedData = selectedRows.map((row) => row.original as TData);

		// Only call onSelectionChange if rowSelection state has actually changed
		if (Object.keys(rowSelection).length > 0 || selectedRows.length > 0) {
			onSelectionChange(selectedData);
		}
	}, [mounted, onSelectionChange, rowSelection, table]); // Add proper dependencies

	if (!mounted) {
		return null;
	}

	return (
		<div className={cn("w-full space-y-4", className)}>
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-1 items-center gap-4">
					{enableRowSelection && table.getFilteredSelectedRowModel().rows.length > 0 && (
						<div className="text-sm text-muted-foreground">
							{table.getFilteredSelectedRowModel().rows.length} of{" "}
							{table.getFilteredRowModel().rows.length} row(s) selected
						</div>
					)}
					<Input
						placeholder={searchPlaceholder}
						value={globalFilter ?? ""}
						onChange={(event) => setGlobalFilter(event.target.value)}
						className="max-w-sm"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
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
				<div className="flex items-center gap-2">
					{onExport && (
						<Button onClick={onExport} variant="outline">
							<DownloadIcon className="mr-2 h-4 w-4" />
							Export
						</Button>
					)}
					{onAdd && (
						<Button onClick={onAdd}>
							<PlusIcon className="mr-2 h-4 w-4" /> {addButtonLabel}
						</Button>
					)}
				</div>
			</div>
			<div className="rounded-md border">
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
								{(onEdit || onDelete || rowActions) && (
									<TableHead className="w-[100px]">Actions</TableHead>
								)}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</TableCell>
									))}
									{(onEdit || onDelete || rowActions) && (
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" className="h-8 w-8 p-0">
														<span className="sr-only">Open menu</span>
														<DotsHorizontalIcon className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>Actions</DropdownMenuLabel>
													{onEdit && (
														<DropdownMenuItem onClick={() => onEdit(row.original as TData)}>
															Edit
														</DropdownMenuItem>
													)}
													{rowActions?.map((action) => (
														<DropdownMenuItem key={action.label} asChild>
															<div className="flex items-center w-full">
																<action.component item={row.original as TData} />
															</div>
														</DropdownMenuItem>
													))}
													{onDelete && (
														<>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
																onClick={() => onDelete(row.original as TData)}
															>
																Delete
															</DropdownMenuItem>
														</>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									)}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length + (onEdit || onDelete || rowActions ? 1 : 0)}
									className="h-24 text-center"
								>
									{isLoading ? <Loader /> : "No results."}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between space-x-2 py-4">
				<div className="flex-1 text-sm text-muted-foreground">
					{table.getFilteredSelectedRowModel().rows.length} of{" "}
					{table.getFilteredRowModel().rows.length} row(s) selected.
				</div>
				<div className="flex items-center space-x-2">
					<div className="flex items-center space-x-2">
						<p className="text-sm font-medium">Rows per page</p>
						<select
							value={table.getState().pagination.pageSize}
							onChange={(e) => {
								table.setPageSize(Number(e.target.value));
							}}
							className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<option key={pageSize} value={pageSize}>
									{pageSize}
								</option>
							))}
						</select>
					</div>
					<div className="flex w-[100px] items-center justify-center text-sm font-medium">
						Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
					</div>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to first page</span>
							{"<<"}
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							<span className="sr-only">Go to previous page</span>
							{"<"}
						</Button>
						<Button
							variant="outline"
							className="h-8 w-8 p-0"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to next page</span>
							{">"}
						</Button>
						<Button
							variant="outline"
							className="hidden h-8 w-8 p-0 lg:flex"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							<span className="sr-only">Go to last page</span>
							{">>"}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
