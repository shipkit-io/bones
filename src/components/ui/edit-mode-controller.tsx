"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Edit, GripHorizontal, X } from "lucide-react";
import { useFloating, offset, shift, flip } from "@floating-ui/react";

interface EditModeControllerProps {
	isEnabled: boolean;
	onToggle: () => void;
	className?: string;
}

const STORAGE_KEY = "edit-mode-controller-position";

function getStoredPosition(): { x: number; y: number } {
	if (typeof window === "undefined") return { x: 20, y: 20 };

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const { x, y } = JSON.parse(stored);
			return { x, y };
		}
	} catch (error) {
		console.error("Failed to load stored position:", error);
	}

	return { x: 20, y: 20 };
}

function storePosition(position: { x: number; y: number }) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
	} catch (error) {
		console.error("Failed to store position:", error);
	}
}

function clampPosition(x: number, y: number): { x: number; y: number } {
	const maxX = typeof window !== "undefined" ? window.innerWidth - 100 : 1000;
	const maxY = typeof window !== "undefined" ? window.innerHeight - 40 : 1000;

	return {
		x: Math.max(0, Math.min(maxX, x)),
		y: Math.max(0, Math.min(maxY, y)),
	};
}

export function EditModeController({
	isEnabled,
	onToggle,
	className,
}: EditModeControllerProps) {
	const [position, setPosition] = React.useState(getStoredPosition);
	const [isDragging, setIsDragging] = React.useState(false);

	// Floating UI setup for proper positioning
	const { refs, floatingStyles } = useFloating({
		placement: "top-start",
		middleware: [offset(10), shift({ padding: 10 }), flip()],
	});

	// Handle window resize
	React.useEffect(() => {
		function handleResize() {
			setPosition((prev) => {
				const newPos = clampPosition(prev.x, prev.y);
				if (newPos.x !== prev.x || newPos.y !== prev.y) {
					storePosition(newPos);
				}
				return newPos;
			});
		}

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Handle dragging
	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);

		const startX = e.clientX - position.x;
		const startY = e.clientY - position.y;

		const handleMouseMove = (e: MouseEvent) => {
			const newPos = clampPosition(e.clientX - startX, e.clientY - startY);
			setPosition(newPos);
			storePosition(newPos);
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	};

	return (
		<div
			ref={refs.setFloating}
			style={{
				...floatingStyles,
				position: "fixed",
				left: position.x,
				top: position.y,
				zIndex: 50,
				cursor: isDragging ? "grabbing" : "grab",
				touchAction: "none",
			}}
			className={cn(
				"flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg",
				className,
			)}
		>
			<div
				onMouseDown={handleMouseDown}
				className="flex cursor-grab items-center active:cursor-grabbing"
			>
				<GripHorizontal className="h-4 w-4 text-muted-foreground" />
			</div>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={isEnabled ? "default" : "outline"}
							size="sm"
							onClick={onToggle}
							className="h-8 px-2"
						>
							{isEnabled ? (
								<>
									<X className="mr-1 h-4 w-4" />
									Exit Edit Mode
								</>
							) : (
								<>
									<Edit className="mr-1 h-4 w-4" />
									Edit Mode
								</>
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>{isEnabled ? "Disable" : "Enable"} edit mode</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	);
}
