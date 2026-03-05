"use client";

import { saveAs } from "file-saver";
import JSZip from "jszip";
import { AlertTriangleIcon, CheckIcon, CopyIcon, FileIcon, FolderIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FileChange {
	path: string;
	content: string;
	isNew?: boolean;
}

interface FileChangeDisplayProps {
	changedFiles: FileChange[];
	onDownloadAll?: () => void;
}

export const FileChangeDisplay = ({ changedFiles, onDownloadAll }: FileChangeDisplayProps) => {
	const [activeFile, setActiveFile] = useState<string>(
		changedFiles.length > 0 && changedFiles[0] ? changedFiles[0].path : ""
	);
	const [copied, setCopied] = useState<boolean>(false);

	// Find the selected file
	const selectedFile = changedFiles.find((file) => file.path === activeFile);

	// Count new files vs modified files
	const newFiles = changedFiles.filter((file) => file.isNew).length;
	const modifiedFiles = changedFiles.length - newFiles;

	// Function to get the file extension
	const getFileExtension = (filePath: string) => {
		const parts = filePath.split(".");
		return parts.length > 1 ? parts[parts.length - 1] : "";
	};

	// Function to copy code to clipboard
	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};

	const downloadSingleFile = (file: FileChange) => {
		const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
		saveAs(blob, file.path.split("/").pop() || "file.txt");
	};

	const downloadAllFiles = async () => {
		try {
			const zip = new JSZip();

			// Add all changed files to the zip
			for (const file of changedFiles) {
				// Skip files that appear to be binary based on the content
				if (!file.content.includes("[Binary data:")) {
					// Preserve directory structure
					zip.file(file.path, file.content);
				}
			}

			// Generate the zip file
			const zipBlob = await zip.generateAsync({ type: "blob" });
			saveAs(zipBlob, "shadcn-changes.zip");
		} catch (error) {
			console.error("Error creating zip file:", error);
			alert("Failed to create zip file. See console for details.");
		}
	};

	// If no files are provided, show a message
	if (changedFiles.length === 0) {
		return (
			<Alert>
				<AlertTriangleIcon className="h-4 w-4" />
				<AlertTitle>No files changed</AlertTitle>
				<AlertDescription>No files were changed during the installation process.</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h3 className="font-semibold text-lg">Installation Complete</h3>
					<p className="text-sm text-muted-foreground">
						The following files were{" "}
						{newFiles > 0 && modifiedFiles > 0
							? "added or modified"
							: newFiles > 0
								? "added"
								: "modified"}{" "}
						during installation.
					</p>
				</div>
				<Button onClick={downloadAllFiles} variant="default">
					Download All Changes
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-1 space-y-4">
					<Card>
						<CardHeader className="py-3">
							<CardTitle className="text-sm font-medium">Files</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<ul className="divide-y divide-border">
								{changedFiles.map((file) => (
									<li key={file.path}>
										<button
											type="button"
											className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 hover:bg-accent/50 ${activeFile === file.path ? "bg-accent" : ""
												}`}
											onClick={() => setActiveFile(file.path)}
										>
											{file.path.endsWith("/") ? (
												<FolderIcon className="h-4 w-4 text-muted-foreground" />
											) : (
												<FileIcon className="h-4 w-4 text-muted-foreground" />
											)}
											<span className="flex-1 truncate">{file.path}</span>
											{file.isNew && (
												<Badge
													variant="outline"
													className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
												>
													New
												</Badge>
											)}
										</button>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</div>

				<div className="lg:col-span-2">
					<Card>
						<CardHeader className="py-3 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-medium">{selectedFile?.path}</CardTitle>
							<div className="flex space-x-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => selectedFile && downloadSingleFile(selectedFile)}
								>
									Download
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => selectedFile && copyToClipboard(selectedFile.content)}
								>
									{copied ? (
										<CheckIcon className="h-4 w-4 text-green-500" />
									) : (
										<CopyIcon className="h-4 w-4" />
									)}
									<span className="ml-2">{copied ? "Copied" : "Copy"}</span>
								</Button>
							</div>
						</CardHeader>
						<CardContent className="p-0 max-h-[500px] overflow-auto">
							{selectedFile && (
								<div className="text-sm">
									{selectedFile.content.includes("[Binary data:") ? (
										<div className="p-4 text-muted-foreground">
											Binary file content cannot be displayed.
										</div>
									) : (
										<pre className="p-4 bg-slate-900 text-slate-50 rounded-md whitespace-pre-wrap font-mono text-sm">
											{selectedFile.content}
										</pre>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
};
