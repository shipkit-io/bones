import { FileIcon, FolderIcon } from "lucide-react";
import type { FileNode } from "./file-browser";

interface FileStatsProps {
	file: FileNode;
	extraStats?: {
		size: number;
		modifiedAt: string;
		createdAt: string;
		isDirectory: boolean;
	};
}

export function FileStats({ file, extraStats }: FileStatsProps) {
	const formatSize = (size?: number) => {
		if (!size) return "N/A";
		const units = ["B", "KB", "MB", "GB"];
		let value = size;
		let unitIndex = 0;

		while (value >= 1024 && unitIndex < units.length - 1) {
			value /= 1024;
			unitIndex++;
		}

		return `${value.toFixed(2)} ${units[unitIndex]}`;
	};

	const formatDate = (date?: string) => {
		if (!date) return "N/A";
		return new Date(date).toLocaleString();
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				{file.type === "directory" ? (
					<FolderIcon className="h-8 w-8 text-blue-500" />
				) : (
					<FileIcon className="h-8 w-8 text-gray-500" />
				)}
				<h2 className="text-2xl font-semibold">{file.name}</h2>
			</div>

			<div className="grid gap-4">
				<div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
					<span className="text-muted-foreground">Type</span>
					<span className="font-medium">{file.type}</span>
				</div>

				<div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
					<span className="text-muted-foreground">Path</span>
					<span className="font-medium break-all">{file.path}</span>
				</div>

				{file.type === "file" && (
					<>
						<div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
							<span className="text-muted-foreground">Size</span>
							<span className="font-medium">{formatSize(extraStats?.size)}</span>
						</div>

						<div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
							<span className="text-muted-foreground">Created</span>
							<span className="font-medium">{formatDate(extraStats?.createdAt)}</span>
						</div>

						<div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
							<span className="text-muted-foreground">Last Modified</span>
							<span className="font-medium">{formatDate(extraStats?.modifiedAt)}</span>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
