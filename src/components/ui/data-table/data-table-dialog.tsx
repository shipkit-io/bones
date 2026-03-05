import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DataTableDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	onSubmit: () => void;
	submitLabel?: string;
	isSubmitting?: boolean;
	fields: {
		label: string;
		value: string;
		onChange: (value: string) => void;
		placeholder?: string;
		type?: string;
	}[];
}

export function DataTableDialog({
	open,
	onOpenChange,
	title,
	description,
	onSubmit,
	submitLabel = "Save",
	isSubmitting = false,
	fields,
}: DataTableDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{fields.map((field) => (
						<div key={field.label} className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor={field.label} className="text-right">
								{field.label}
							</Label>
							<Input
								id={field.label}
								value={field.value}
								onChange={(e) => field.onChange(e.target.value)}
								placeholder={field.placeholder}
								type={field.type}
								className="col-span-3"
							/>
						</div>
					))}
				</div>
				<DialogFooter>
					<Button onClick={onSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Saving..." : submitLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
