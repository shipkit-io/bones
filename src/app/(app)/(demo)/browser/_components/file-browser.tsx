"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getFileStats, getFileTree } from "./actions";
import { FileStats } from "./file-stats";
import { File, Folder, Tree } from "./file-tree";

export interface FileNode {
	name: string;
	path: string;
	type: "file" | "directory";
	children?: FileNode[];
	size?: number;
	modifiedAt?: string;
}

interface TreeElement {
	id: string;
	isSelectable: true;
	name: string;
	path: string;
	children?: TreeElement[];
}

const convertToTreeElements = (nodes: FileNode[], parentPath = ""): TreeElement[] => {
	return nodes.map((node, index) => {
		const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
		return {
			id: currentPath,
			isSelectable: true,
			name: node.name,
			path: currentPath,
			...(node.children && { children: convertToTreeElements(node.children, currentPath) }),
		};
	});
};

const renderTreeNodes = (nodes: FileNode[], onSelect: (node: FileNode) => void) => {
	return nodes.map((node, index) => {
		const key = `${node.path}-${index}`;
		if (node.type === "directory") {
			return (
				<Folder key={key} element={node.name} value={node.path}>
					{node.children && renderTreeNodes(node.children, onSelect)}
				</Folder>
			);
		}
		return (
			<File key={key} value={node.path} onClick={() => onSelect(node)}>
				<p className="truncate w-full">{node.name}</p>
			</File>
		);
	});
};

export function FileBrowser() {
	const router = useRouter();
	const [files, setFiles] = useState<FileNode[]>([]);
	const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
	const [loading, setLoading] = useState(true);
	const [selectedFileStats, setSelectedFileStats] = useState<any>(null);
	const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

	const loadFiles = useCallback(async () => {
		try {
			setLoading(true);
			const result = await getFileTree();

			if (result.error) {
				toast.error(result.error);
				return;
			}

			const tree = result?.tree ?? [];

			setFiles(tree);
			// Initially expand root directories
			const rootPaths = tree.filter((node) => node.type === "directory").map((node) => node.path);
			setExpandedPaths(rootPaths);
			router.refresh();
		} catch (error) {
			toast.error("Failed to load file tree");
		} finally {
			setLoading(false);
		}
	}, [router]);

	const handleFileSelect = async (node: FileNode) => {
		setSelectedFile(node);
		if (node.type === "file") {
			const stats = await getFileStats(node.path);
			if (stats.error) {
				toast.error(stats.error);
				return;
			}
			setSelectedFileStats(stats.stats);
		} else {
			setSelectedFileStats(null);
		}
	};

	useEffect(() => {
		loadFiles();
	}, [loadFiles]);

	if (loading) {
		return (
			<div className="grid grid-cols-[300px_1fr] gap-6">
				<Skeleton className="h-[500px] w-full" />
				<Skeleton className="h-[500px] w-full" />
			</div>
		);
	}

	const treeElements = convertToTreeElements(files);

	return (
		<div className="grid grid-cols-[300px_1fr] gap-6">
			<div className="border rounded-lg p-4">
				<Tree
					className="h-[500px] overflow-auto bg-background p-2"
					initialExpandedItems={expandedPaths}
					elements={treeElements}
				>
					{renderTreeNodes(files, handleFileSelect)}
				</Tree>
			</div>
			<div
				className={cn(
					"border rounded-lg p-6",
					"min-h-[500px]",
					!selectedFile && "flex items-center justify-center text-muted-foreground"
				)}
			>
				{selectedFile ? (
					<FileStats file={selectedFile} extraStats={selectedFileStats} />
				) : (
					<p>Select a file to view its details</p>
				)}
			</div>
		</div>
	);
}
