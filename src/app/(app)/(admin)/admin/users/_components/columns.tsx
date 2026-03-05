"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserData } from "@/server/services/payment-service";
import { UserDrawer } from "./user-drawer";

const formatDate = (date: Date | null) => {
	return date ? format(date, "MMM d, yyyy") : "N/A";
};

export const columns: ColumnDef<UserData>[] = [
	{
		accessorKey: "image",
		header: "",
		cell: ({ row }) => {
			const userImage = row.original?.image;
			const userName = row.original?.name;

			return (
				<Avatar className="size-8">
					<AvatarImage
						src={userImage || ""}
						alt={userName ? `${userName}'s avatar` : "User avatar"}
						draggable={false}
					/>
					<AvatarFallback>{userName?.[0]?.toUpperCase() || "?"}</AvatarFallback>
				</Avatar>
			);
		},
	},
	{
		accessorKey: "email",
		header: "Email",
		cell: ({ row }) => row.original?.email ?? "N/A",
	},
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => row.original?.name ?? "N/A",
	},
	{
		accessorKey: "createdAt",
		header: "Joined",
		cell: ({ row }) => formatDate(row.original?.createdAt ?? null),
	},
	{
		accessorKey: "hasPaid",
		header: "Payment Status",
		cell: ({ row }) => {
			const hasPaid = Boolean(row.getValue("hasPaid"));

			return (
				<div className="flex flex-col gap-1 items-start justify-center">
					<Badge variant={hasPaid ? "default" : "secondary"}>{hasPaid ? "Paid" : "Not Paid"}</Badge>
				</div>
			);
		},
	},
	{
		accessorKey: "hasActiveSubscription",
		header: "Subscription",
		cell: ({ row }) => {
			const hasActiveSubscription = Boolean(row.getValue("hasActiveSubscription"));
			const hadSubscription = Boolean(row.original.hadSubscription);

			let status = "None";
			let variant: "default" | "outline" | "secondary" = "outline";

			if (hasActiveSubscription) {
				status = "Subscribed";
				variant = "default";
			} else if (hadSubscription) {
				status = "Inactive";
				variant = "secondary";
			}

			return (
				<div className="flex flex-col gap-1 items-start justify-center">
					<Badge variant={variant}>{status}</Badge>
				</div>
			);
		},
	},
	{
		accessorKey: "lastPurchaseDate",
		header: "Last Purchase",
		cell: ({ row }) => formatDate(row.original?.lastPurchaseDate ?? null),
	},
	{
		accessorKey: "totalPurchases",
		header: "Total Purchases",
		cell: ({ row }) => row.original?.totalPurchases ?? 0,
	},
	{
		id: "actions",
		header: "Details",
		cell: ({ row }) => {
			const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
			const user = row.original;

			return (
				<>
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							setIsUserDrawerOpen(true);
						}}
						className="flex items-center"
					>
						<Eye className="h-4 w-4 mr-1" /> View Details
					</Button>
					<UserDrawer
						user={user}
						open={isUserDrawerOpen}
						onClose={() => setIsUserDrawerOpen(false)}
					/>
				</>
			);
		},
	},
];
