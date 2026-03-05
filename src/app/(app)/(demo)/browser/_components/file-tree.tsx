"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TreeViewElement {
	id: string;
	name: string;
	isSelectable?: boolean;
	children?: TreeViewElement[];
}

interface TreeContextProps {
	selectedId: string | undefined;
	expandedItems: string[];
	indicator: boolean;
	handleExpand: (id: string) => void;
	selectItem: (id: string) => void;
	setExpandedItems: React.Dispatch<React.SetStateAction<string[]>>;
	openIcon?: ReactNode;
	closeIcon?: ReactNode;
	direction: "rtl" | "ltr";
}

const TreeContext = React.createContext<TreeContextProps | null>(null);

const useTree = () => {
	const context = React.useContext(TreeContext);
	if (!context) {
		throw new Error("useTree must be used within a TreeProvider");
	}
	return context;
};

interface TreeViewComponentProps extends HTMLAttributes<HTMLDivElement> {}

type Direction = "rtl" | "ltr" | undefined;

type TreeViewProps = {
	initialSelectedId?: string;
	indicator?: boolean;
	elements?: TreeViewElement[];
	initialExpandedItems?: string[];
	openIcon?: ReactNode;
	closeIcon?: ReactNode;
} & TreeViewComponentProps;

interface FolderProps extends AccordionPrimitive.AccordionItemProps {
	element: string;
	isSelectable?: boolean;
	isSelect?: boolean;
}

interface FileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	value: string;
	handleSelect?: (id: string) => void;
	isSelectable?: boolean;
	isSelect?: boolean;
	fileIcon?: ReactNode;
}

interface CollapseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	elements: TreeViewElement[];
	expandAll?: boolean;
}

const Tree = React.forwardRef<HTMLDivElement, TreeViewProps>(
	(
		{
			className,
			elements,
			initialSelectedId,
			initialExpandedItems = [],
			children,
			indicator = true,
			openIcon,
			closeIcon,
			dir,
			...props
		},
		ref
	) => {
		const [selectedId, setSelectedId] = React.useState<string | undefined>(initialSelectedId);
		const [expandedItems, setExpandedItems] = React.useState<string[]>(initialExpandedItems);

		const selectItem = React.useCallback((id: string) => {
			setSelectedId(id);
		}, []);

		const handleExpand = React.useCallback((id: string) => {
			setExpandedItems((prev: string[]) => {
				const filtered = prev.filter((item) => item !== id);
				return prev.includes(id) ? filtered : [...filtered, id];
			});
		}, []);

		const expandSpecificTargetedElements = React.useCallback(
			(elements?: TreeViewElement[], selectId?: string) => {
				if (!elements || !selectId) return;
				const findParent = (currentElement: TreeViewElement, currentPath: string[] = []) => {
					const isSelectable = currentElement.isSelectable ?? true;
					const newPath = [...currentPath, currentElement.id].filter(
						(id): id is string => id !== undefined
					);
					if (currentElement.id === selectId) {
						if (isSelectable) {
							setExpandedItems((prev: string[]) => [...prev, ...newPath]);
						} else if (newPath.includes(currentElement.id)) {
							const filteredPath = newPath.slice(0, -1);
							setExpandedItems((prev: string[]) => [...prev, ...filteredPath]);
						}
						return;
					}
					if (isSelectable && currentElement.children && currentElement.children.length > 0) {
						for (const child of currentElement.children) {
							findParent(child, newPath);
						}
					}
				};
				for (const element of elements) {
					findParent(element);
				}
			},
			[]
		);

		React.useEffect(() => {
			if (initialSelectedId && elements) {
				expandSpecificTargetedElements(elements, initialSelectedId);
			}
		}, [initialSelectedId, elements, expandSpecificTargetedElements]);

		const direction = dir === "rtl" ? "rtl" : "ltr";

		return (
			<TreeContext.Provider
				value={{
					selectedId,
					expandedItems,
					handleExpand,
					selectItem,
					setExpandedItems,
					indicator,
					openIcon,
					closeIcon,
					direction,
				}}
			>
				<div className={cn("size-full", className)}>
					<ScrollArea ref={ref} className="relative h-full px-2" dir={dir as Direction}>
						<AccordionPrimitive.Root
							{...props}
							type="multiple"
							defaultValue={expandedItems}
							value={expandedItems}
							className="flex flex-col gap-1"
							onValueChange={(value: string[]) => {
								const newValue = value[0];
								if (typeof newValue === "string") {
									setExpandedItems((prev) => Array.from(new Set([...prev, newValue])));
								}
							}}
							dir={dir as Direction}
						>
							{children}
						</AccordionPrimitive.Root>
					</ScrollArea>
				</div>
			</TreeContext.Provider>
		);
	}
);

Tree.displayName = "Tree";

const TreeIndicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
	({ className, ...props }, ref) => {
		const { direction } = useTree();

		return (
			<div
				dir={direction}
				ref={ref}
				className={cn(
					"absolute left-1.5 h-full w-px rounded-md bg-muted py-3 duration-300 ease-in-out hover:bg-slate-300 rtl:right-1.5",
					className
				)}
				{...props}
			/>
		);
	}
);

TreeIndicator.displayName = "TreeIndicator";

const Folder = React.forwardRef<HTMLDivElement, FolderProps & React.HTMLAttributes<HTMLDivElement>>(
	({ className, element, value, isSelectable = true, isSelect, children, ...props }, ref) => {
		const {
			direction,
			handleExpand,
			expandedItems,
			indicator,
			setExpandedItems,
			openIcon,
			closeIcon,
		} = useTree();

		return (
			<AccordionPrimitive.Item {...props} value={value} className="relative h-full overflow-hidden">
				<AccordionPrimitive.Trigger
					className={cn("flex items-center gap-1 rounded-md text-sm", className, {
						"bg-muted rounded-md": isSelect && isSelectable,
						"cursor-pointer": isSelectable,
						"cursor-not-allowed opacity-50": !isSelectable,
					})}
					disabled={!isSelectable}
					onClick={() => handleExpand(value)}
				>
					{expandedItems?.includes(value)
						? (openIcon ?? <FolderOpenIcon className="size-4" />)
						: (closeIcon ?? <FolderIcon className="size-4" />)}
					<span>{element}</span>
				</AccordionPrimitive.Trigger>
				<AccordionPrimitive.Content className="relative h-full overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
					{element && indicator && <TreeIndicator aria-hidden="true" />}
					<AccordionPrimitive.Root
						dir={direction}
						type="multiple"
						className="ml-5 flex flex-col gap-1 py-1 rtl:mr-5"
						defaultValue={expandedItems}
						value={expandedItems}
						onValueChange={(value: string[]) => {
							const newValue = value[0];
							if (typeof newValue === "string") {
								setExpandedItems((prev) => Array.from(new Set([...prev, newValue])));
							}
						}}
					>
						{children}
					</AccordionPrimitive.Root>
				</AccordionPrimitive.Content>
			</AccordionPrimitive.Item>
		);
	}
);

Folder.displayName = "Folder";

const File = React.forwardRef<HTMLButtonElement, FileProps>(
	(
		{
			value,
			className,
			handleSelect,
			isSelectable = true,
			isSelect,
			fileIcon,

			children,
			...props
		},
		ref
	) => {
		const { direction, selectedId, selectItem } = useTree();
		const isSelected = isSelect ?? selectedId === value;
		return (
			<button
				ref={ref}
				type="button"
				disabled={!isSelectable}
				className={cn(
					"flex w-fit max-w-full items-center gap-1 rounded-md pr-1 text-sm duration-200 ease-in-out rtl:pl-1 rtl:pr-0",
					{
						"bg-muted": isSelected && isSelectable,
					},
					isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
					direction === "rtl" ? "rtl" : "ltr",
					className
				)}
				onClick={() => selectItem(value)}
				{...props}
			>
				{fileIcon ?? <FileIcon className="size-4" />}
				{children}
			</button>
		);
	}
);

File.displayName = "File";

const CollapseButton = React.forwardRef<HTMLButtonElement, CollapseButtonProps>(
	({ className, elements, expandAll = false, children, ...props }, ref) => {
		const { expandedItems, setExpandedItems } = useTree();

		const expendAllTree = React.useCallback(
			(elements: TreeViewElement[]) => {
				const expandTree = (element: TreeViewElement) => {
					const isSelectable = element.isSelectable ?? true;
					if (isSelectable && element.children && element.children.length > 0) {
						setExpandedItems((prev: string[]) => [...prev, element.id]);
						for (const child of element.children) {
							expandTree(child);
						}
					}
				};
				for (const element of elements) {
					expandTree(element);
				}
			},
			[setExpandedItems]
		);

		const closeAll = React.useCallback(() => {
			setExpandedItems([]);
		}, [setExpandedItems]);

		React.useEffect(() => {
			if (expandAll) {
				expendAllTree(elements);
			}
		}, [expandAll, elements, expendAllTree]);

		return (
			<Button
				variant={"ghost"}
				className="absolute bottom-1 right-2 h-8 w-fit p-1"
				onClick={
					expandedItems && expandedItems.length > 0 ? closeAll : () => expendAllTree(elements)
				}
				ref={ref}
				{...props}
			>
				{children}
				<span className="sr-only">Toggle</span>
			</Button>
		);
	}
);

CollapseButton.displayName = "CollapseButton";

export { CollapseButton, File, Folder, Tree, type TreeViewElement };
