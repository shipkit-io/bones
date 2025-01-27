"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loading } from "@/components/ui/loading";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
	AlertCircle,
	ArrowUpDown,
	CheckCircle,
	Info,
	MoreHorizontal,
} from "lucide-react";
import { useEffect, useState } from "react";

type LogLevel = "info" | "warning" | "error" | "success";

interface Log {
	id: number;
	timestamp: Date;
	level: LogLevel;
	prefix: string;
	message: string;
}

const columns: ColumnDef<Log>[] = [
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
		accessorKey: "timestamp",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Timestamp
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const timestamp = row.getValue("timestamp") as Date;
			return timestamp.toLocaleString();
		},
	},
	{
		accessorKey: "level",
		header: "Level",
		cell: ({ row }) => {
			const level = row.getValue("level") as LogLevel;
			return (
				<div className="flex items-center">
					<LogIcon level={level} />
					<span className="ml-2 capitalize">{level}</span>
				</div>
			);
		},
	},
	{
		accessorKey: "prefix",
		header: "Prefix",
	},
	{
		accessorKey: "message",
		header: "Message",
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const log = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() => navigator?.clipboard?.writeText(log.message)}
						>
							Copy message
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View details</DropdownMenuItem>
						<DropdownMenuItem>Delete log</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

const getRandomLogLevel = (): LogLevel => {
	const levels: LogLevel[] = ["info", "warning", "error", "success"];
	return levels[Math.floor(Math.random() * levels.length)] as LogLevel;
};

const getRandomPrefix = (): string => {
	const prefixes = ["APP", "DB", "API", "AUTH", "CACHE", "QUEUE"];
	return prefixes[Math.floor(Math.random() * prefixes.length)] as string;
};

const getRandomLogMessage = (level: LogLevel): string => {
	const messages = {
		info: [
			"User logged in successfully",
			"Data sync completed",
			"Configuration updated",
			"New user registered",
		],
		warning: [
			"High CPU usage detected",
			"Low disk space warning",
			"API rate limit approaching",
			"Outdated dependency found",
		],
		error: [
			"Database connection failed",
			"API request timeout",
			"Uncaught exception in module",
			"Authentication error",
		],
		success: [
			"Backup completed successfully",
			"Payment processed",
			"Email sent successfully",
			"Task completed ahead of schedule",
		],
	};
	return messages[level][Math.floor(Math.random() * messages[level].length)] as string;
};

const LogIcon = ({ level }: { level: LogLevel }) => {
	switch (level) {
		case "info":
			return <Info className="h-4 w-4 text-blue-400" />;
		case "warning":
			return <AlertCircle className="h-4 w-4 text-amber-400" />;
		case "error":
			return <AlertCircle className="h-4 w-4 text-rose-400" />;
		case "success":
			return <CheckCircle className="h-4 w-4 text-emerald-400" />;
	}
};

export function EnhancedLogDatatable() {
	const [logs, setLogs] = useState<Log[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});

	const table = useReactTable({
		data: logs,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	useEffect(() => {
		setIsLoading(true);
		setTimeout(() => {
			setIsLoading(false);
			addLog();
			addLog();
			addLog();
		}, 1500);
	}, []);

	const addLog = () => {
		const level = getRandomLogLevel();
		const newLog: Log = {
			id: Date.now(),
			timestamp: new Date(),
			level: level,
			prefix: getRandomPrefix(),
			message: getRandomLogMessage(level),
		};
		setLogs((prevLogs) => [...prevLogs, newLog]);
	};

	const handleDeleteSelected = () => {
		const selectedIds = Object.keys(rowSelection).map(Number);
		setLogs((prevLogs) =>
			prevLogs.filter((log) => !selectedIds.includes(log.id)),
		);
		setRowSelection({});
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-6xl rounded-lg bg-white p-6 shadow-xl">
			<h1 className="mb-6 text-3xl font-bold text-gray-800">
				Enhanced Log DataTable
			</h1>
			<div className="mb-4 flex items-center justify-between">
				<div className="space-x-2">
					<Button onClick={addLog} size="sm">
						Add Log
					</Button>
					<Button
						onClick={handleDeleteSelected}
						size="sm"
						variant="destructive"
						disabled={Object.keys(rowSelection).length === 0}
					>
						Delete Selected
					</Button>
				</div>
				<div className="text-sm text-gray-500">Total Logs: {logs.length}</div>
			</div>
			<div className="relative min-h-[500px] rounded-lg bg-gray-50 p-4">
				{isLoading ? (
					<Loading />
				) : (
					<div>
						<div className="flex items-center py-4">
							<Input
								placeholder="Filter messages..."
								value={
									(table.getColumn("message")?.getFilterValue() as string) ?? ""
								}
								onChange={(event) =>
									table.getColumn("message")?.setFilterValue(event.target.value)
								}
								className="max-w-sm"
							/>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" className="ml-auto">
										Columns
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									{table
										.getAllColumns()
										.filter((column) => column.getCanHide())
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
						</div>
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
																header.getContext(),
															)}
													</TableHead>
												);
											})}
										</TableRow>
									))}
								</TableHeader>
								<TableBody>
									{table.getRowModel().rows?.length ? (
										table.getRowModel().rows.map((row) => (
											<motion.tr
												key={row.id}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.3 }}
												className={
													row.original.level === "error"
														? "bg-rose-50"
														: row.original.level === "warning"
															? "bg-amber-50"
															: row.original.level === "success"
																? "bg-emerald-50"
																: "bg-white"
												}
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell key={cell.id}>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
											</motion.tr>
										))
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
						</div>
						<div className="flex items-center justify-end space-x-2 py-4">
							<div className="flex-1 text-sm text-muted-foreground">
								{table.getFilteredSelectedRowModel().rows.length} of{" "}
								{table.getFilteredRowModel().rows.length} row(s) selected.
							</div>
							<div className="space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
								>
									Next
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
