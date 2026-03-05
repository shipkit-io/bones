"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { File, Folder } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FileTreeProps {
	files: {
		path: string;
		type: string;
		content?: string;
	}[];
	onFileSelect?: (file: { path: string; content?: string }) => void;
	selectedFile?: string;
}

interface TreeNode {
	name: string;
	path: string;
	type: "file" | "directory";
	content?: string;
	children: Record<string, TreeNode>;
}

function buildTree(files: FileTreeProps["files"]): TreeNode {
	const root: TreeNode = {
		name: "root",
		path: "",
		type: "directory",
		children: {},
	};

	if (!files) return root;

	files.forEach((file) => {
		const parts = file.path.split("/");
		let current = root;

		parts.forEach((part, i) => {
			const path = parts.slice(0, i + 1).join("/");
			if (!current.children[part]) {
				current.children[part] = {
					name: part,
					path,
					type: i === parts.length - 1 ? "file" : "directory",
					content: i === parts.length - 1 ? file.content : undefined,
					children: {},
				};
			}
			current = current.children[part];
		});
	});

	return root;
}

function TreeNode({
	node,
	level = 0,
	expanded,
	onToggle,
	onFileSelect,
	selectedFile,
}: {
	node: TreeNode;
	level?: number;
	expanded: Record<string, boolean>;
	onToggle: (path: string) => void;
	onFileSelect?: FileTreeProps["onFileSelect"];
	selectedFile?: string;
}) {
	const isExpanded = expanded[node.path];
	const hasChildren = Object.keys(node.children).length > 0;

	return (
		<div>
			<Button
				variant="ghost"
				size="sm"
				className={cn("w-full justify-start", selectedFile === node.path && "bg-muted")}
				onClick={() => {
					if (node.type === "directory") {
						onToggle(node.path);
					} else if (onFileSelect) {
						onFileSelect({
							path: node.path,
							content: node.content,
						});
					}
				}}
			>
				<span style={{ marginLeft: `${level * 12}px` }} className="flex items-center">
					{node.type === "directory" ? (
						<>
							{hasChildren ? (
								isExpanded ? (
									<ChevronDownIcon className="mr-2 h-4 w-4" />
								) : (
									<ChevronRightIcon className="mr-2 h-4 w-4" />
								)
							) : (
								<span className="mr-2 w-4" />
							)}
							<Folder className="mr-2 h-4 w-4" />
						</>
					) : (
						<>
							<span className="mr-2 w-4" />
							<File className="mr-2 h-4 w-4" />
						</>
					)}
					{node.name}
				</span>
			</Button>
			{isExpanded && hasChildren && (
				<div>
					{Object.values(node.children)
						.sort((a, b) => {
							// Directories first, then files
							if (a.type !== b.type) {
								return a.type === "directory" ? -1 : 1;
							}
							return a.name.localeCompare(b.name);
						})
						.map((child) => (
							<TreeNode
								key={child.path}
								node={child}
								level={level + 1}
								expanded={expanded}
								onToggle={onToggle}
								onFileSelect={onFileSelect}
								selectedFile={selectedFile}
							/>
						))}
				</div>
			)}
		</div>
	);
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const tree = buildTree(files);

	const handleToggle = (path: string) => {
		setExpanded((prev) => ({
			...prev,
			[path]: !prev[path],
		}));
	};

	return (
		<ScrollArea className="min-h-[100px]">
			<div className="p-2">
				<TreeNode
					node={tree}
					expanded={expanded}
					onToggle={handleToggle}
					onFileSelect={onFileSelect}
					selectedFile={selectedFile}
				/>
			</div>
		</ScrollArea>
	);
}
