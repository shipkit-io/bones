'use client'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { ReloadIcon } from '@radix-ui/react-icons'
import { PlusCircle } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { validateRegistry } from '../_lib/registry-service'
import type { Registry } from '../_lib/types'

interface AddRegistryDialogProps {
	onAdd: (registry: Registry) => void
}

export function AddRegistryDialog({ onAdd }: AddRegistryDialogProps) {
	const [open, setOpen] = useState(false)
	const [name, setName] = useState('')
	const [url, setUrl] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			const registry = {
				name,
				url,
				baseComponentUrl: url,
				baseBlockUrl: url,
				baseDocsUrl: url,
			}

			await validateRegistry(registry)
			await onAdd(registry)
			setOpen(false)
			setName('')
			setUrl('')
			toast({
				title: "Registry added",
				description: `Successfully added registry "${name}"`,
			})
		} catch (error) {
			toast({
				title: "Failed to add registry",
				description: error instanceof Error ? error.message : "Unknown error occurred",
				variant: "destructive",
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="w-full"
					onClick={(e) => {
						e.stopPropagation();
						setOpen(true);
					}}
				>
					<PlusCircle className="mr-2 h-4 w-4" />
					Add Registry
				</Button>
			</DialogTrigger>
			<DialogContent onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<DialogTitle>Add Custom Registry</DialogTitle>
					<DialogDescription>
						Add a custom component registry to browse and install components from.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="My Custom Registry"
								required
								disabled={loading}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="url">Registry URL</Label>
							<Input
								id="url"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								placeholder="https://example.com/registry"
								required
								disabled={loading}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={loading}>
							{loading ? (
								<>
									<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
									Validating...
								</>
							) : (
								'Add Registry'
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
