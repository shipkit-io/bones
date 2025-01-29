"use client";

import * as React from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

export interface FloatingEditorProps {
	/**
	 * The current text content
	 */
	content: string;
	/**
	 * Callback when content is saved
	 */
	onSave: (content: string) => Promise<void>;
	/**
	 * Optional className for the container
	 */
	className?: string;
	/**
	 * Optional className for the text content
	 */
	contentClassName?: string;
	/**
	 * Optional className for the popover content
	 */
	popoverClassName?: string;
	/**
	 * Whether the content should render as markdown
	 */
	isMarkdown?: boolean;
	/**
	 * Whether edit mode is enabled
	 */
	isEditModeEnabled?: boolean;
}

export function FloatingEditor({
	content,
	onSave,
	className,
	contentClassName,
	popoverClassName,
	isMarkdown = false,
	isEditModeEnabled = false,
}: FloatingEditorProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const [editedContent, setEditedContent] = React.useState(content);
	const [isSaving, setIsSaving] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const [transform, setTransform] = React.useState({
		rotate: { x: 0, y: 0 },
		scale: 1,
		translate: { x: 0, y: 0 },
	});

	const { textareaRef, adjustHeight } = useAutoResizeTextarea({
		minHeight: 100,
		maxHeight: 500,
	});

	// Reset edited content when content prop changes
	React.useEffect(() => {
		setEditedContent(content);
	}, [content]);

	// Reset edited content when popover opens
	React.useEffect(() => {
		if (isOpen) {
			setEditedContent(content);
			// Wait for next tick to adjust height
			setTimeout(() => adjustHeight(), 0);
		}
	}, [isOpen, content, adjustHeight]);

	// Handle mouse movement for 3D effect
	const handleMouseMove = React.useCallback(
		(e: MouseEvent) => {
			if (!containerRef.current || !isEditModeEnabled) return;

			const rect = containerRef.current.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;

			// Calculate distance from center
			const distanceX = e.clientX - centerX;
			const distanceY = e.clientY - centerY;

			// Calculate distance from element
			const elementDistance = Math.sqrt(
				(e.clientX - (rect.left + rect.width / 2)) ** 2 +
					(e.clientY - (rect.top + rect.height / 2)) ** 2,
			);

			// Maximum rotation in degrees
			const maxRotation = 10;
			// Maximum translation in pixels
			const maxTranslation = 5;
			// Distance at which the element starts to "attract" to the cursor
			const attractionRadius = 300;

			// Calculate rotation based on mouse position
			const rotateX = -(distanceY / rect.height) * maxRotation;
			const rotateY = (distanceX / rect.width) * maxRotation;

			// Calculate attraction effect
			const attractionStrength = Math.max(
				0,
				1 - elementDistance / attractionRadius,
			);
			const translateX =
				(distanceX / attractionRadius) * maxTranslation * attractionStrength;
			const translateY =
				(distanceY / attractionRadius) * maxTranslation * attractionStrength;

			// Calculate scale based on distance (closer = larger)
			const scale = 1 + attractionStrength * 0.05;

			setTransform({
				rotate: { x: rotateX, y: rotateY },
				scale,
				translate: { x: translateX, y: translateY },
			});
		},
		[isEditModeEnabled],
	);

	// Reset transform on mouse leave
	const handleMouseLeave = React.useCallback(() => {
		setTransform({
			rotate: { x: 0, y: 0 },
			scale: 1,
			translate: { x: 0, y: 0 },
		});
	}, []);

	// Add and remove mouse event listeners
	React.useEffect(() => {
		const container = containerRef.current;
		if (container && isEditModeEnabled) {
			window.addEventListener("mousemove", handleMouseMove);
			container.addEventListener("mouseleave", handleMouseLeave);
		}
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			if (container) {
				container.removeEventListener("mouseleave", handleMouseLeave);
			}
		};
	}, [handleMouseMove, handleMouseLeave, isEditModeEnabled]);

	const handleSave = async () => {
		try {
			setIsSaving(true);
			await onSave(editedContent);
			setIsOpen(false);
			toast({
				title: "Changes saved",
				description: "Your changes have been saved successfully.",
			});
		} catch (error) {
			toast({
				title: "Error saving changes",
				description:
					error instanceof Error
						? error.message
						: "An error occurred while saving your changes.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleEdit = () => {
		if (isEditModeEnabled) {
			setIsOpen(true);
		}
	};

	return (
		<div
			ref={containerRef}
			className={cn(
				"perspective-1000 group relative transition-all duration-200",
				isEditModeEnabled && "hover:z-10",
				className,
			)}
			style={{
				perspective: "1000px",
			}}
		>
			<button
				type="button"
				className={cn(
					"prose w-full max-w-none rounded-md text-left transition-all duration-200",
					isEditModeEnabled && "cursor-pointer p-2",
					!isEditModeEnabled && "pointer-events-none",
					contentClassName,
				)}
				onClick={handleEdit}
				disabled={!isEditModeEnabled}
				style={{
					transform: isEditModeEnabled
						? `
							rotate3d(1, 0, 0, ${transform.rotate.x}deg)
							rotate3d(0, 1, 0, ${transform.rotate.y}deg)
							scale(${transform.scale})
							translate(${transform.translate.x}px, ${transform.translate.y}px)
						`
						: undefined,
					transformStyle: "preserve-3d",
					transition: "transform 0.1s ease-out",
				}}
			>
				<div
					className={cn(
						"relative",
						isEditModeEnabled &&
							"before:absolute before:inset-0 before:rounded-md before:opacity-0 before:shadow-[0_0_15px_rgba(0,0,0,0.1)] before:transition-opacity group-hover:before:opacity-100",
					)}
				>
					{isMarkdown ? <ReactMarkdown>{content}</ReactMarkdown> : content}
				</div>
			</button>

			{isEditModeEnabled && (
				<Popover open={isOpen} onOpenChange={setIsOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="absolute -right-8 top-0 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<Pencil className="h-4 w-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className={cn("w-[400px] p-4", popoverClassName)}
						align="start"
						sideOffset={5}
					>
						<div className="space-y-4">
							<Textarea
								ref={textareaRef}
								value={editedContent}
								onChange={(e) => {
									setEditedContent(e.target.value);
									adjustHeight();
								}}
								className="min-h-[100px] resize-none"
								placeholder="Enter your content..."
							/>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setIsOpen(false);
										setEditedContent(content);
									}}
								>
									<X className="mr-2 h-4 w-4" />
									Cancel
								</Button>
								<Button
									size="sm"
									onClick={handleSave}
									disabled={isSaving || editedContent === content}
								>
									<Check className="mr-2 h-4 w-4" />
									Save
								</Button>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			)}
		</div>
	);
}
