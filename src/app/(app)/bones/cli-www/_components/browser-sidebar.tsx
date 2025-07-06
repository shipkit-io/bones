'use client'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { memo, useMemo } from 'react'
import type { RegistryFilters, RegistryItem } from '../_lib/types'
import { getColor } from './colors'
import type { StyleMode, InstallationProgress } from './types'
import { CustomInstallDialog } from './custom-install-dialog'

export interface BrowserSidebarProps {
	currentStyle: StyleMode
	searchTerm: string
	setSearchTerm: (term: string) => void
	filters: RegistryFilters
	setFilters: (filters: RegistryFilters) => void
	categories: string[]
	types: string[]
	filteredItems: RegistryItem[]
	onCustomInstall: (command: string) => void
	installationProgress: InstallationProgress
}

export const BrowserSidebar = memo(({
	currentStyle,
	searchTerm,
	setSearchTerm,
	filters,
	setFilters,
	categories,
	types,
	filteredItems,
	onCustomInstall,
	installationProgress
}: BrowserSidebarProps) => {
	// Memoize expensive computations
	const componentCount = useMemo(() =>
		filteredItems.filter(item => item.type === 'registry:ui').length,
		[filteredItems]
	)

	const blockCount = useMemo(() =>
		filteredItems.filter(item => item.type === 'registry:block').length,
		[filteredItems]
	)

	const categoryCount = useMemo(() =>
		categories.reduce((acc, category) => {
			acc[category] = filteredItems.filter(item => item.categories?.includes(category)).length
			return acc
		}, {} as Record<string, number>),
		[categories, filteredItems]
	)

	return (
		<div className={cn(
			"w-full md:w-72 border-r border-border p-4 flex flex-col",
			currentStyle === 'brutalist' && "border-r-2 border-primary"
		)}>
			<div className="space-y-6">
				<div>
					<div className="flex items-center justify-between mb-2">
						<Label htmlFor="search" className="text-sm font-medium">
							Search
						</Label>
						<Badge variant="secondary" className="font-mono">
							{filteredItems.length} results
						</Badge>
					</div>
					<div className="relative">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							id="search"
							placeholder="Search components..."
							className={cn(
								"pl-8",
								currentStyle === 'brutalist'
									? 'border-2 border-primary rounded-none'
									: 'border rounded-md'
							)}
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value)
								// Reset filters when searching to show all results
								setFilters({
									...filters,
									type: 'all',
									category: 'all'
								})
							}}
						/>
					</div>
				</div>

				<CustomInstallDialog
					onInstall={onCustomInstall}
					installationProgress={installationProgress}
				/>
				<Separator className="my-2" />

				<div>
					<Label htmlFor="type" className="text-sm font-medium mb-2 block">
						Type
					</Label>
					<Select
						value={filters.type}
						onValueChange={(value) => setFilters({ ...filters, type: value as RegistryFilters['type'] })}
					>
						<SelectTrigger
							id="type"
							className={cn(
								currentStyle === 'brutalist'
									? 'border-2 border-primary rounded-none'
									: 'border rounded-md'
							)}
						>
							<SelectValue placeholder="Select type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="components" className="flex items-center justify-between">
								<span>Components</span>
								<Badge variant="secondary" className="ml-2 font-mono">{componentCount}</Badge>
							</SelectItem>
							<SelectItem value="blocks" className="flex items-center justify-between">
								<span>Blocks</span>
								<Badge variant="secondary" className="ml-2 font-mono">{blockCount}</Badge>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div>
					<Label htmlFor="category" className="text-sm font-medium mb-2 block">
						Category
					</Label>
					<Select
						value={filters.category}
						onValueChange={(value) => setFilters({ ...filters, category: value })}
					>
						<SelectTrigger
							id="category"
							className={cn(
								currentStyle === 'brutalist'
									? 'border-2 border-primary rounded-none'
									: 'border rounded-md'
							)}
						>
							<div className="flex items-center gap-2">
								{filters.category && filters.category !== 'all' && (
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: getColor(filters.category) }}
									/>
								)}
								<SelectValue placeholder="Select category" />
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							{categories.map((category) => (
								<SelectItem key={category} value={category} className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: getColor(category) }}
										/>
										{category}
									</div>
									<Badge variant="secondary" className="ml-2 font-mono">
										{categoryCount[category]}
									</Badge>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Separator className="my-4" />

				<div className="text-sm text-muted-foreground space-y-2">
					<div className="flex items-center justify-between">
						<span>Total Components</span>
						<Badge variant="secondary" className="font-mono">{filteredItems.length}</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span>Types</span>
						<Badge variant="secondary" className="font-mono">{types.length}</Badge>
					</div>
					<div className="flex items-center justify-between">
						<span>Categories</span>
						<Badge variant="secondary" className="font-mono">{categories.length}</Badge>
					</div>
				</div>
			</div>
		</div>
	)
})
BrowserSidebar.displayName = 'BrowserSidebar'

