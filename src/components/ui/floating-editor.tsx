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

interface Section {
	id: string;
	content: string;
	level: number;
	path: string[];
}

function parseSections(content: string): Section[] {
	const lines = content.split("\n");
	const sections: Section[] = [];
	let currentSection: string[] = [];
	let currentPath: string[] = [];
	let currentLevel = 0;

	function addSection() {
		if (currentSection.length > 0) {
			const content = currentSection.join("\n");
			sections.push({
				id: `${currentPath.join("/")}/${content.slice(0, 20)}`,
				content,
				level: currentLevel,
				path: [...currentPath],
			});
			currentSection = [];
		}
	}

	for (const line of lines) {
		const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headingMatch) {
			addSection();
			const level = headingMatch[1].length;
			const heading = headingMatch[2];
			currentPath = currentPath.slice(0, level - 1);
			currentPath[level - 1] = heading;
			currentLevel = level;
			currentSection = [line];
		} else {
			currentSection.push(line);
		}
	}

	addSection();
	return sections;
}

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
	const [sections, setSections] = React.useState<Section[]>([]);
	const [editingSectionId, setEditingSectionId] = React.useState<string | null>(
		null,
	);
	const [editedContent, setEditedContent] = React.useState("");
	const [isSaving, setIsSaving] = React.useState(false);
	const sectionRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
	const sectionsRef = React.useRef<Section[]>([]);
	const [hasChanges, setHasChanges] = React.useState(false);
	const [transforms, setTransforms] = React.useState<
		Map<
			string,
			{
				rotate: { x: number; y: number };
				scale: number;
				translate: { x: number; y: number };
			}
		>
	>(new Map());

	const { textareaRef, adjustHeight } = useAutoResizeTextarea({
		minHeight: 100,
		maxHeight: 500,
	});

	// Keep sectionsRef in sync with sections state
	React.useEffect(() => {
		sectionsRef.current = sections;
	}, [sections]);

	// Parse content into sections only when the prop changes
	React.useEffect(() => {
		const parsedSections = parseSections(content);
		setSections(parsedSections);
		sectionsRef.current = parsedSections;
	}, [content]);

	// Handle mouse movement for 3D effect
	const handleMouseMove = React.useCallback(
		(e: MouseEvent) => {
			if (!isEditModeEnabled) return;

			const newTransforms = new Map(transforms);
			sectionRefs.current.forEach((element, sectionId) => {
				const rect = element.getBoundingClientRect();
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;

				const distanceX = e.clientX - centerX;
				const distanceY = e.clientY - centerY;

				const elementDistance = Math.sqrt(
					(e.clientX - (rect.left + rect.width / 2)) ** 2 +
						(e.clientY - (rect.top + rect.height / 2)) ** 2,
				);

				const maxRotation = 10;
				const maxTranslation = 5;
				const attractionRadius = 300;

				const rotateX = -(distanceY / rect.height) * maxRotation;
				const rotateY = (distanceX / rect.width) * maxRotation;

				const attractionStrength = Math.max(
					0,
					1 - elementDistance / attractionRadius,
				);
				const translateX =
					(distanceX / attractionRadius) * maxTranslation * attractionStrength;
				const translateY =
					(distanceY / attractionRadius) * maxTranslation * attractionStrength;

				const scale = 1 + attractionStrength * 0.05;

				newTransforms.set(sectionId, {
					rotate: { x: rotateX, y: rotateY },
					scale,
					translate: { x: translateX, y: translateY },
				});
			});

			setTransforms(newTransforms);
		},
		[isEditModeEnabled, transforms],
	);

	// Reset transforms on mouse leave
	const handleMouseLeave = React.useCallback(() => {
		setTransforms(new Map());
	}, []);

	// Add and remove mouse event listeners
	React.useEffect(() => {
		if (isEditModeEnabled) {
			window.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseleave", handleMouseLeave);
		}
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, [handleMouseMove, handleMouseLeave, isEditModeEnabled]);

	const handleEdit = (sectionId: string) => {
		if (isEditModeEnabled) {
			const section = sectionsRef.current.find((s) => s.id === sectionId);
			if (section) {
				setEditingSectionId(sectionId);
				setEditedContent(section.content);
				setHasChanges(false);
				setTimeout(() => adjustHeight(), 0);
			}
		}
	};

	const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newContent = e.target.value;
		const currentSection = sectionsRef.current.find(
			(s) => s.id === editingSectionId,
		);

		setEditedContent(newContent);
		setHasChanges(
			currentSection ? newContent !== currentSection.content : false,
		);

		// Update the section in the list to show live preview
		setSections((prevSections) =>
			prevSections.map((section) =>
				section.id === editingSectionId
					? { ...section, content: newContent }
					: section,
			),
		);

		adjustHeight();
	};

	const handleSave = async () => {
		if (!editingSectionId || !hasChanges) return;

		try {
			setIsSaving(true);
			const newContent = sections
				.map((section) => section.content)
				.join("\n\n");
			await onSave(newContent);
			setEditingSectionId(null);
			setHasChanges(false);
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

	const handleCancel = () => {
		if (editingSectionId) {
			const originalSection = sectionsRef.current.find(
				(s) => s.id === editingSectionId,
			);
			if (originalSection) {
				setSections((prevSections) =>
					prevSections.map((section) =>
						section.id === editingSectionId
							? { ...section, content: originalSection.content }
							: section,
					),
				);
			}
		}
		setEditingSectionId(null);
		setEditedContent("");
		setHasChanges(false);
	};

	return (
		<div className={cn("space-y-4", className)}>
			{sections.map((section) => {
				const transform = transforms.get(section.id);
				const isEditing = editingSectionId === section.id;

				return (
					<div
						key={section.id}
						ref={(el) => {
							if (el) sectionRefs.current.set(section.id, el);
							else sectionRefs.current.delete(section.id);
						}}
						className={cn(
							"perspective-1000 group relative transition-all duration-200",
							isEditModeEnabled && "hover:z-10",
						)}
						style={{
							perspective: "1000px",
							paddingLeft: `${section.level * 1}rem`,
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
							onClick={() => handleEdit(section.id)}
							disabled={!isEditModeEnabled}
							style={{
								transform:
									isEditModeEnabled && transform
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
								{isMarkdown ? (
									<ReactMarkdown>{section.content}</ReactMarkdown>
								) : (
									section.content
								)}
							</div>
						</button>

						{isEditModeEnabled && (
							<Popover
								open={isEditing}
								onOpenChange={(open) => !open && handleCancel()}
							>
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
										<div className="text-sm text-muted-foreground">
											{section.path.join(" > ")}
										</div>
										<Textarea
											ref={textareaRef}
											value={editedContent}
											onChange={handleContentChange}
											className="min-h-[100px] resize-none"
											placeholder="Enter your content..."
										/>
										<div className="flex justify-end gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={handleCancel}
											>
												<X className="mr-2 h-4 w-4" />
												Cancel
											</Button>
											<Button
												size="sm"
												onClick={handleSave}
												disabled={isSaving || !hasChanges}
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
			})}
		</div>
	);
}
