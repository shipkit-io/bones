'use client'

import { Button } from "@/components/ui/button"
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import * as React from "react"

export function CommandMenu() {
	const router = useRouter()
	const [open, setOpen] = React.useState(false)

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen((open) => !open)
			}
		}
		document.addEventListener("keydown", down)
		return () => document.removeEventListener("keydown", down)
	}, [])

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
				)}
				onClick={() => setOpen(true)}
			>
				<span className="hidden lg:inline-flex">Search docs...</span>
				<span className="inline-flex lg:hidden">Search...</span>
				<kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Type a command or search..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Links">
						<CommandItem
							onSelect={() => {
								router.push("/docs")
								setOpen(false)
							}}
						>
							Documentation
						</CommandItem>
						<CommandItem
							onSelect={() => {
								router.push("/docs/components/accordion")
								setOpen(false)
							}}
						>
							Components
						</CommandItem>
						<CommandItem
							onSelect={() => {
								router.push("/docs/themes")
								setOpen(false)
							}}
						>
							Themes
						</CommandItem>
						<CommandItem
							onSelect={() => {
								router.push("/docs/examples")
								setOpen(false)
							}}
						>
							Examples
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	)
}
