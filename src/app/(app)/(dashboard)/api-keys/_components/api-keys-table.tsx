"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table/data-table";
import { createApiKey } from "@/server/actions/api-key-actions";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { DeleteApiKeyDialog } from "./delete-api-key-dialog";

// Define the type for our API key data
interface ApiKey {
	id: string;
	key: string;
	name: string;
	description?: string | null;
	createdAt: Date;
	lastUsedAt?: Date | null;
	expiresAt?: Date | null;
	deletedAt?: Date | null;
}

interface ApiKeysTableProps {
	apiKeys: ApiKey[];
	userId: string;
}

// Define the columns for the DataTable
const columns: ColumnDef<ApiKey>[] = [
	{
		accessorKey: "key",
		header: "Key",
		cell: ({ row }) => {
			const key = row.getValue("key") as string;
			return (
				<div className="flex items-center space-x-2">
					<code className="rounded bg-muted px-2 py-1">
						{key.slice(0, 12)}...{key.slice(-4)}
					</code>
				</div>
			);
		},
	},
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => {
			const description = row.original.description;
			return (
				<div className="space-y-1">
					<div className="font-medium">{row.getValue("name")}</div>
					{description && <div className="text-sm text-muted-foreground">{description}</div>}
				</div>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: "Created",
		cell: ({ row }) => {
			return (
				<div className="text-muted-foreground">
					{format(row.getValue("createdAt"), "MMM d, yyyy")}
				</div>
			);
		},
	},
	{
		accessorKey: "lastUsedAt",
		header: "Last Used",
		cell: ({ row }) => {
			const date = row.getValue("lastUsedAt") as Date | null;
			return (
				<div className="text-muted-foreground">{date ? format(date, "MMM d, yyyy") : "Never"}</div>
			);
		},
	},
	{
		accessorKey: "expiresAt",
		header: "Expires",
		cell: ({ row }) => {
			const date = row.getValue("expiresAt") as Date | null;
			return (
				<div className="text-muted-foreground">{date ? format(date, "MMM d, yyyy") : "Never"}</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const expiresAt = row.original.expiresAt;
			const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
			return (
				<Badge variant={isExpired ? "destructive" : "default"} className="capitalize">
					{isExpired ? "Expired" : "Active"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "delete",
		header: "Delete",
		cell: ({ row }) => {
			return <DeleteApiKeyDialog apiKeyId={row.original.id} />;
		},
	},
];

export function ApiKeysTable({ apiKeys, userId }: ApiKeysTableProps) {
	return (
		<div className="relative">
			<DataTable columns={columns} data={apiKeys} searchPlaceholder="Search API keys..." />

			{/* Create dialog with its own trigger button */}
			<div className="absolute right-0 top-[-60px]">
				<CreateApiKeyDialog onSubmit={createApiKey} userId={userId} />
			</div>

			{/* Hidden delete dialogs */}
			<div className="hidden">
				{apiKeys.map((apiKey) => (
					<DeleteApiKeyDialog key={apiKey.id} apiKeyId={apiKey.id} />
				))}
			</div>
		</div>
	);
}
