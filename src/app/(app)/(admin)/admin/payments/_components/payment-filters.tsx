"use client";

import { FilterIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function PaymentFilters() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Get the current active filter
	const currentFilter = searchParams?.get("filter") || "all";

	// Function to update the URL with the selected filter
	const setFilter = (filterValue: string) => {
		// Create a new URLSearchParams object
		const params = new URLSearchParams();

		// Copy existing parameters
		if (searchParams) {
			searchParams.forEach((value, key) => {
				params.append(key, value);
			});
		}

		// Update the filter parameter
		if (filterValue === "all") {
			params.delete("filter");
		} else {
			params.set("filter", filterValue);
		}

		router.push(`${pathname}?${params.toString()}`);
	};

	// Get the label for the current filter
	const getFilterLabel = () => {
		switch (currentFilter) {
			case "free":
				return "Free Products";
			case "paid":
				return "Paid Products";
			case "discounted":
				return "Discounted to $0";
			default:
				return "All Products";
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="relative">
					<FilterIcon className="h-4 w-4 mr-2" />
					Filter
					{currentFilter !== "all" && (
						<Badge variant="secondary" className="ml-2 px-1 py-0 h-5">
							{getFilterLabel()}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-[240px]">
				<DropdownMenuLabel>Filter Payments</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className={cn(currentFilter === "all" && "bg-accent")}
						onClick={() => setFilter("all")}
					>
						All Products
					</DropdownMenuItem>
					<DropdownMenuItem
						className={cn(currentFilter === "free" && "bg-accent")}
						onClick={() => setFilter("free")}
					>
						Free Products
					</DropdownMenuItem>
					<DropdownMenuItem
						className={cn(currentFilter === "paid" && "bg-accent")}
						onClick={() => setFilter("paid")}
					>
						Paid Products (&gt; $0)
					</DropdownMenuItem>
					<DropdownMenuItem
						className={cn(currentFilter === "discounted" && "bg-accent")}
						onClick={() => setFilter("discounted")}
					>
						Discounted to $0
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
