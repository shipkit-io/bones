'use client'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons'
import { Palette, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Registry } from '../_lib/types'
import { AddRegistryDialog } from './add-registry-dialog'
import { getColor } from './colors'
import type { StyleMode } from './types'

export interface BrowserHeaderProps {
	currentStyle: StyleMode
	registries: Registry[]
	currentRegistry?: Registry | null
	onRegistryChange: (registry: Registry | null) => void
	overwrite: boolean
	onOverwriteChange: (value: boolean) => void
	onAddRegistry: (registry: Registry) => Promise<void>
	onRemoveRegistry: (name: string) => void
	onStyleChange?: () => void
}

export function BrowserHeader({
	currentStyle,
	registries,
	currentRegistry,
	onRegistryChange,
	overwrite,
	onOverwriteChange,
	onAddRegistry,
	onRemoveRegistry,
	onStyleChange,
}: BrowserHeaderProps) {
	const [open, setOpen] = useState(false)

	const handleRegistryChange = (registry: Registry | null) => {
		onRegistryChange(registry)
		setOpen(false)
	}

	return (
		<div className={cn(
			"flex items-center justify-between gap-4 p-4 border-b",
			currentStyle === 'brutalist' ? 'border-b-2 border-primary' : 'border-border'
		)}>
			<h1 className="text-2xl font-bold">Component Browser</h1>

			<div className="flex items-center gap-4">
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							aria-expanded={open}
							className={cn(
								"w-[200px] justify-between",
								currentStyle === 'brutalist'
									? 'border-2 border-primary rounded-none'
									: 'border rounded-md'
							)}
						>
							<div className="flex items-center gap-2">
								{currentRegistry && (
									<div
										className="w-2 h-2 rounded-full"
										style={{ backgroundColor: getColor(currentRegistry.name) }}
									/>
								)}
								{currentRegistry?.name || "All Registries"}
							</div>
							<CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-[200px] p-0">
						<Command>
							<CommandInput placeholder="Search registries..." className="h-9" />
							<CommandEmpty>No registry found.</CommandEmpty>
							<CommandList>
								<CommandGroup heading="Registries">
									<CommandItem
										onSelect={() => handleRegistryChange(null)}
										className="flex justify-between"
									>
										<div className="flex items-center gap-2">
											<CheckIcon
												className={cn(
													"mr-2 h-4 w-4",
													!currentRegistry
														? "opacity-100"
														: "opacity-0"
												)}
											/>
											<div
												className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/50"
											/>
											All Registries
										</div>
									</CommandItem>
									{registries
										.filter((r) => !r.custom)
										.map((registry) => (
											<CommandItem
												key={registry.name}
												onSelect={() => handleRegistryChange(registry)}
												className="flex justify-between"
											>
												<div className="flex items-center gap-2">
													<CheckIcon
														className={cn(
															"mr-2 h-4 w-4",
															currentRegistry?.name === registry.name
																? "opacity-100"
																: "opacity-0"
														)}
													/>
													<div
														className="w-2 h-2 rounded-full"
														style={{ backgroundColor: getColor(registry.name) }}
													/>
													{registry.name}
												</div>
											</CommandItem>
										))}
								</CommandGroup>
								{registries.some(r => r.custom) && (
									<CommandGroup heading="Custom Registries">
										{registries
											.filter((r) => r.custom)
											.map((registry) => (
												<CommandItem
													key={registry.name}
													onSelect={() => handleRegistryChange(registry)}
													className="flex justify-between"
												>
													<div className="flex items-center gap-2">
														<CheckIcon
															className={cn(
																"mr-2 h-4 w-4",
																currentRegistry?.name === registry.name
																	? "opacity-100"
																	: "opacity-0"
															)}
														/>
														<div
															className="w-2 h-2 rounded-full"
															style={{ backgroundColor: getColor(registry.name) }}
														/>
														{registry.name}
													</div>
													<Button
														variant="ghost"
														size="sm"
														className="h-4 w-4 p-0"
														onClick={(e) => {
															e.stopPropagation()
															if (currentRegistry?.name === registry.name) {
																const defaultRegistry = registries.find(r => !r.custom)
																const fallbackRegistry = registries[0]
																const nextRegistry = defaultRegistry || fallbackRegistry
																if (nextRegistry) {
																	handleRegistryChange(nextRegistry)
																}
															}
															onRemoveRegistry(registry.name)
														}}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</CommandItem>
											))}
									</CommandGroup>
								)}
								<Separator />
								<CommandGroup>
									<CommandItem className="border-t p-0">
										<AddRegistryDialog onAdd={onAddRegistry} />
									</CommandItem>
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
				<div className="flex items-center gap-2">
					<Switch
						id="overwrite"
						checked={overwrite}
						onCheckedChange={onOverwriteChange}
						className={cn(
							currentStyle === 'brutalist'
								? 'data-[state=checked]:bg-primary'
								: ''
						)}
					/>
					<Label
						htmlFor="overwrite"
						className="text-sm text-muted-foreground"
					>
						Overwrite existing
					</Label>
				</div>
				<Separator orientation="vertical" className="h-6" />
				<Button
					variant="ghost"
					size="icon"
					onClick={onStyleChange}
					className={cn(
						"h-8 w-8",
						currentStyle === 'brutalist'
							? 'hover:bg-primary/20'
							: 'hover:bg-accent'
					)}
				>
					<Palette className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}


