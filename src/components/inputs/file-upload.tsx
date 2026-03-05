"use client";

import { AnimatePresence, motion } from "framer-motion";
import { File, Trash2, Upload } from "lucide-react";
import type React from "react";
import { type DragEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ALLOWED_FILE_TYPES, FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { deleteFileAction, uploadFileAction } from "@/server/actions/file";

interface FileWithPreview {
	id: string;
	file: File;
	preview: string;
	progress: number;
	status: "pending" | "uploading" | "completed" | "error";
	uploadedName?: string;
	fileId?: number;
}

const enabled = env.NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED;

export function FileDropzone() {
	const [files, setFiles] = useState<FileWithPreview[]>([]);
	const [isDragActive, setIsDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const progressIntervalRef = useRef<Record<string, NodeJS.Timeout>>({});

	const isValidFile = (file: File) => {
		if (!ALLOWED_FILE_TYPES.includes(file.type)) {
			toast.error(`${file.name} is not an allowed file type.`);
			return false;
		}
		if (file.size > FILE_UPLOAD_MAX_SIZE) {
			toast.error(`${file.name} exceeds the size limit.`);
			return false;
		}
		return true;
	};

	const uploadFile = async (fileWithPreview: FileWithPreview) => {
		if (!env.NEXT_PUBLIC_FEATURE_FILE_UPLOAD_ENABLED) {
			toast.error("File uploads are currently disabled.");
			return {
				success: false,
				file: fileWithPreview,
				error: "File uploads are disabled.",
			};
		}

		const formData = new FormData();
		formData.append("file", fileWithPreview.file);

		try {
			// Set initial uploading state
			setFiles((prev) =>
				prev.map((f) =>
					f.id === fileWithPreview.id ? { ...f, status: "uploading", progress: 10 } : f
				)
			);

			// Start progress simulation
			if (progressIntervalRef.current[fileWithPreview.id]) {
				clearInterval(progressIntervalRef.current[fileWithPreview.id]);
			}
			progressIntervalRef.current[fileWithPreview.id] = setInterval(() => {
				setFiles((prev) => {
					return prev.map((f) => {
						if (f.id === fileWithPreview.id && f.status === "uploading") {
							const newProgress = Math.min(f.progress + 15, 90);
							return { ...f, progress: newProgress };
						}
						return f;
					});
				});
			}, 300);

			// Perform the actual upload
			const { fileName, fileId } = await uploadFileAction(formData);

			// Clear the interval
			clearInterval(progressIntervalRef.current[fileWithPreview.id]);
			delete progressIntervalRef.current[fileWithPreview.id];

			if (fileName) {
				// Update state to completed
				setFiles((prev) =>
					prev.map((f) => {
						if (f.id === fileWithPreview.id) {
							return {
								...f,
								status: "completed",
								progress: 100,
								uploadedName: fileName,
								fileId,
							};
						}
						return f;
					})
				);

				logger.info(`File uploaded successfully: ${fileName}`);
				return { success: true, file: fileWithPreview };
			}
			return { success: false, file: fileWithPreview, error: "Upload failed" };
		} catch (error) {
			clearInterval(progressIntervalRef.current[fileWithPreview.id]);

			setFiles((prev) =>
				prev.map((f) => (f.id === fileWithPreview.id ? { ...f, status: "error", progress: 0 } : f))
			);

			return {
				success: false,
				file: fileWithPreview,
				error: `Error uploading file: ${fileWithPreview.file.name}`,
			};
		}
	};

	const handleFiles = (fileList: File[]) => {
		if (!enabled) return;
		const validFiles = fileList.filter(isValidFile);

		const newFiles = validFiles.map((file) => ({
			id: crypto.randomUUID(),
			file,
			preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
			progress: 0,
			status: "pending" as const,
		}));

		setFiles((prevFiles) => [...prevFiles, ...newFiles]);
	};

	// Effect to handle uploads of pending files
	useEffect(() => {
		const pendingFiles = files.filter((file) => file.status === "pending");

		if (pendingFiles.length === 0) {
			return;
		}

		void (async () => {
			const results = await Promise.all(pendingFiles.map(uploadFile));

			// Handle success/error notifications
			const successful = results.filter((r) => r.success);
			const failed = results.filter((r) => !r.success);

			for (const result of successful) {
				if (successful.length === 1) {
					toast.success(`Successfully uploaded ${result.file.file.name}`);
				} else {
					toast.success(`Successfully uploaded ${successful.length} files`);
					break;
				}
			}

			for (const result of failed) {
				if (result.error) {
					toast.error(result.error);
					logger.error(result.error);
				}
			}
		})();
	}, [files, enabled]);

	// Cleanup effect
	useEffect(() => {
		return () => {
			// Clear all intervals
			for (const intervalId of Object.values(progressIntervalRef.current)) {
				clearInterval(intervalId);
			}
			// Clear all previews
			for (const file of files) {
				if (file.preview) {
					URL.revokeObjectURL(file.preview);
				}
			}
		};
	}, [files]);

	const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
		if (!enabled) return;
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		if (!enabled) return;
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		if (!enabled) return;
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: DragEvent<HTMLDivElement>) => {
		if (!enabled) return;
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);

		const droppedFiles = Array.from(e.dataTransfer.files);
		handleFiles(droppedFiles);
	};

	const handleButtonClick = () => {
		if (!enabled) return;
		fileInputRef.current?.click();
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!enabled) return;
		if (e.target.files) {
			handleFiles(Array.from(e.target.files));
		}
	};

	const handleDeleteFile = (fileToDelete: FileWithPreview) => {
		if (fileToDelete.preview) {
			URL.revokeObjectURL(fileToDelete.preview);
		}
		setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileToDelete.id));
	};

	const handleDeleteUploadedFile = async (file: FileWithPreview) => {
		if (!enabled) {
			toast.error("File deletion is currently disabled.");
			return;
		}
		if (!file.uploadedName || !file.fileId) {
			return;
		}

		try {
			await deleteFileAction({ fileId: file.fileId, fileName: file.uploadedName });
			toast.success(`Successfully deleted ${file.file.name}`);
			handleDeleteFile(file);
		} catch (error) {
			const errorMessage = `Error deleting file: ${file.file.name}`;
			logger.error(errorMessage, error);
			toast.error(errorMessage);
		}
	};

	const getStatusColor = (status: FileWithPreview["status"]) => {
		switch (status) {
			case "completed":
				return "bg-green-500";
			case "error":
				return "bg-red-500";
			case "uploading":
				return "bg-blue-500";
			default:
				return "bg-neutral-200 dark:bg-neutral-700";
		}
	};

	if (!enabled) {
		return (
			<div className="h-auto w-full p-8 text-center text-neutral-500">
				File uploads are currently disabled.
			</div>
		);
	}

	return (
		<div className="h-auto w-full p-8">
			<motion.div
				className={`relative size-full cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
					isDragActive
						? "border-blue-500 bg-blue-500/5"
						: "border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
				}`}
				onClick={handleButtonClick}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						handleButtonClick();
					}
				}}
				role="button"
				tabIndex={0}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				whileHover={{ scale: 1.01 }}
				whileTap={{ scale: 0.98 }}
			>
				<input
					accept={ALLOWED_FILE_TYPES.join(",")}
					className="hidden"
					multiple={true}
					onChange={handleFileInputChange}
					ref={fileInputRef}
					type="file"
				/>
				<AnimatePresence>
					{isDragActive ? (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							className="pointer-events-none select-none"
							exit={{ opacity: 0, y: -10 }}
							initial={{ opacity: 0, y: 10 }}
							transition={{ duration: 0.2 }}
						>
							<Upload className="pointer-events-none mx-auto size-8 select-none text-blue-500" />
							<p className="pointer-events-none mt-2 select-none text-sm text-blue-500">
								Drop files here...
							</p>
						</motion.div>
					) : (
						<motion.div
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 10 }}
							initial={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							<Upload className="mx-auto size-8 text-neutral-400 dark:text-neutral-500" />
							<p className="mt-2 text-balance text-sm font-medium tracking-tighter text-neutral-400 dark:text-neutral-500">
								Drag and drop files here, or click to select
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>

			<AnimatePresence>
				{files.length > 0 && (
					<motion.div
						animate={{ opacity: 1, height: "auto" }}
						className="mt-4 space-y-2"
						exit={{ opacity: 0, height: 0 }}
						initial={{ opacity: 0, height: 0 }}
					>
						{files.map((file) => (
							<motion.div
								animate={{ opacity: 1, x: 0 }}
								className="relative flex items-center rounded-lg bg-neutral-400/10 p-1"
								exit={{ opacity: 0, x: 20 }}
								initial={{ opacity: 0, x: -20 }}
								key={file.id}
							>
								<div
									className={`absolute left-0 top-0 z-0 h-full rounded-lg transition-all duration-300 ${getStatusColor(
										file.status
									)}`}
									style={{ width: `${file.progress}%`, opacity: 0.2 }}
								/>

								{file.file.type.startsWith("image/") ? (
									<img
										alt={file.file.name}
										className="mr-2 size-10 rounded object-cover"
										src={file.preview}
									/>
								) : (
									<File className="mr-2 size-10 text-neutral-500" />
								)}
								<div className="z-10 flex flex-1 flex-col">
									<span className="truncate text-xs tracking-tighter text-neutral-600 dark:text-neutral-400">
										{file.file.name}
									</span>
									<span className="text-xs text-neutral-500">
										{file.status === "completed"
											? "Uploaded"
											: file.status === "error"
												? "Error"
												: file.status === "uploading"
													? "Uploading..."
													: "Pending"}
									</span>
								</div>
								<div className="z-10 flex items-center gap-2">
									{file.status === "completed" ? (
										<Button
											variant="destructive"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												void handleDeleteUploadedFile(file);
											}}
											className="h-7 px-2"
										>
											<Trash2 className="size-4" />
											<span className="ml-1">Delete</span>
										</Button>
									) : (
										<button
											type="button"
											className="mr-2 rounded-sm text-red-500 transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteFile(file);
											}}
										>
											<Trash2 className="size-5" />
											<span className="sr-only">Delete</span>
										</button>
									)}
								</div>
							</motion.div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export default FileDropzone;
