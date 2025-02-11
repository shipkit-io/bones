"use client";

import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { forwardRef, useState } from "react";
import type { Registry, RegistryFilters, RegistryItem } from "../_lib/types";
import { getColor } from "./colors";
import type { StyleMode } from "./types";

export interface BrowserSidebarProps {
	currentStyle: StyleMode;
	currentRegistry?: Registry;
	selectedComponent: RegistryItem | null;
	onClose: () => void;
	onInstall: (component: RegistryItem) => void;
	isInstalled: boolean;
	onOverwriteChange: (value: boolean) => void;
	overwrite: boolean;
	categories: string[];
	types: string[];
	filteredItems: RegistryItem[];
}

export const BrowserSidebar = forwardRef<HTMLDivElement, BrowserSidebarProps>(
	(
		{
			currentStyle,
			currentRegistry: _currentRegistry,
			selectedComponent: _selectedComponent,
			onClose: _onClose,
			onInstall: _onInstall,
			isInstalled: _isInstalled,
			onOverwriteChange: _onOverwriteChange,
			overwrite: _overwrite,
			categories,
			types: _types,
			filteredItems,
		},
		ref
	) => {
		const [searchTerm, setSearchTerm] = useState("");
		const [filters, setFilters] = useState<RegistryFilters>({
			type: "all",
			category: "all",
		});

		// Count components by type
		const componentCount = filteredItems.filter((item) => item.type === "registry:ui").length;
		const blockCount = filteredItems.filter((item) => item.type === "registry:block").length;

		// Count components by category
		const categoryCount = categories.reduce(
			(acc, category) => {
				acc[category] = filteredItems.filter((item) => item.categories?.includes(category)).length;
				return acc;
			},
			{} as Record<string, number>
		);

		return (
			<div
				ref={ref}
				className={cn(
					"w-full border-b bg-card p-4 md:w-80 md:border-b-0 md:border-r",
					currentStyle === "brutalist" ? "border-2 border-primary" : "border border-border"
				)}
			>
				<div className="space-y-4">
					<div className="relative">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search components..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>

					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Type</Label>
							<Select
								value={filters.type}
								onValueChange={(value: "all" | "components" | "blocks") =>
									setFilters({ ...filters, type: value })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									<SelectItem value="components">Components ({componentCount})</SelectItem>
									<SelectItem value="blocks">Blocks ({blockCount})</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Category</Label>
							<Select
								value={filters.category}
								onValueChange={(value) => setFilters({ ...filters, category: value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category} value={category}>
											{category} ({categoryCount[category]})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<Separator />

					<div className="space-y-2">
						<Label>Active Filters</Label>
						<div className="flex flex-wrap gap-2">
							{filters.type !== "all" && (
								<Badge
									variant="outline"
									className={cn(
										"cursor-pointer",
										currentStyle === "brutalist"
											? "rounded-none border-2 border-primary"
											: "rounded-full"
									)}
									onClick={() => setFilters({ ...filters, type: "all" })}
									style={{ backgroundColor: `${getColor("type")}70`, color: "#fff" }}
								>
									{filters.type}
								</Badge>
							)}
							{filters.category !== "all" && (
								<Badge
									variant="outline"
									className={cn(
										"cursor-pointer",
										currentStyle === "brutalist"
											? "rounded-none border-2 border-primary"
											: "rounded-full"
									)}
									onClick={() => setFilters({ ...filters, category: "all" })}
									style={{
										backgroundColor: `${getColor(filters.category ?? "default")}70`,
										color: "#fff",
									}}
								>
									{filters.category}
								</Badge>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}
);

BrowserSidebar.displayName = "BrowserSidebar";
