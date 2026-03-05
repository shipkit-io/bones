"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, Eye, Tag } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PaymentData } from "@/server/services/payment-service";
import { PaymentDrawer } from "./payment-drawer";

export const columns: ColumnDef<PaymentData>[] = [
	{
		accessorKey: "userImage",
		header: "",
		cell: ({ row }) => {
			const userImage = row.original.userImage;
			const userName = row.original.userName;

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
		accessorKey: "orderId",
		header: "Order ID",
	},
	{
		accessorKey: "userEmail",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Customer Email
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
	},
	{
		accessorKey: "userName",
		header: "Customer Name",
		cell: ({ row }) => row.getValue("userName") ?? "N/A",
	},
	{
		accessorKey: "productName",
		header: "Product",
		cell: ({ row }) => {
			const productName: string = row.getValue("productName");
			const variantName = row.original.variantName;

			return (
				<div>
					<div className="font-medium">{productName}</div>
					{variantName && (
						<div className="text-xs text-muted-foreground">Variant: {variantName}</div>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: "processor",
		header: "Payment Processor",
		cell: ({ row }) => {
			const processor: string = row.getValue("processor");
			return <Badge variant="outline">{processor ?? "Unknown"}</Badge>;
		},
	},
	{
		accessorKey: "amount",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Amount
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const amount = Number.parseFloat(row.getValue("amount"));
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(amount);

			return <span className="tabular-nums">{formatted}</span>;
		},
	},
	{
		accessorKey: "isFreeProduct",
		header: "Type",
		cell: ({ row }) => {
			const isFreeProduct = row.getValue("isFreeProduct");
			const amount = Number.parseFloat(row.getValue("amount"));

			if (isFreeProduct) {
				return (
					<Badge variant="default" className="flex items-center gap-1">
						<Tag className="h-3 w-3" /> Free
					</Badge>
				);
			}

			if (amount === 0) {
				return (
					<Badge variant="secondary" className="flex items-center gap-1">
						<Tag className="h-3 w-3" /> Discounted
					</Badge>
				);
			}

			return (
				<Badge variant="default" className="flex items-center gap-1">
					<Tag className="h-3 w-3" /> Paid
				</Badge>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status: string = row.getValue("status");
			return (
				<Badge
					variant={
						status === "paid" ? "default" : status === "refunded" ? "destructive" : "secondary"
					}
				>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</Badge>
			);
		},
	},
	{
		accessorKey: "purchaseDate",
		header: ({ column }) => (
			<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
				Purchase Date
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => format(row.getValue("purchaseDate"), "PPP"),
	},
	{
		id: "actions",
		header: "Details",
		cell: ({ row }) => {
			const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
			const payment = row.original;

			return (
				<>
					<Button
						variant="ghost"
						size="sm"
						onClick={(e) => {
							e.stopPropagation();
							setIsPaymentDrawerOpen(true);
						}}
						className="flex items-center"
					>
						<Eye className="h-4 w-4 mr-1" /> View Details
					</Button>
					<PaymentDrawer
						payment={payment}
						open={isPaymentDrawerOpen}
						onClose={() => setIsPaymentDrawerOpen(false)}
					/>
				</>
			);
		},
	},
];
