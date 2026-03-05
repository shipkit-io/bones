/**
 * v0 by Vercel.
 * @see https://v0.dev/t/Z5JjteY0tw3
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ALLOWED_FILE_TYPES, FILE_UPLOAD_MAX_SIZE } from "@/config/file";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { uploadFileAction } from "@/server/actions/file";

export default function FileInput() {
	const [files, setFiles] = useState<File[]>([]);
	const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
	const [uploading, setUploading] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const addValidFiles = (newFiles: File[]) => {
		const validFiles = newFiles.filter(isValidFile);
		if (validFiles.length < newFiles.length) {
			toast.error(
				"Some files were not added. Only allowed file types up to the size limit are allowed."
			);
		}
		setFiles((prevFiles) => [...prevFiles, ...validFiles]);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		const droppedFiles = Array.from(e.dataTransfer.files);
		if (droppedFiles.length > 0) {
			addValidFiles(droppedFiles);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
		if (selectedFiles.length > 0) {
			addValidFiles(selectedFiles);
		}
	};

	const uploadFile = async (file: File): Promise<string | null> => {
		const formData = new FormData();
		formData.append("file", file);

		try {
			const { fileName } = await uploadFileAction(formData);
			logger.info(`File uploaded successfully: ${fileName}`);
			return fileName;
		} catch (error) {
			const errorMessage = `Error uploading file: ${file.name}`;
			logger.error(errorMessage, error);
			toast.error(errorMessage);
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setUploading(true);

		try {
			const results = await Promise.allSettled(files.map(uploadFile));

			const successfulUploads = results
				.filter(
					(result): result is PromiseFulfilledResult<string> =>
						result.status === "fulfilled" && result.value !== null
				)
				.map((result) => result.value);

			setUploadedFiles((prev) => [...prev, ...successfulUploads]);
			setFiles((prevFiles) =>
				prevFiles.filter((_, index) => results[index]?.status !== "fulfilled")
			);

			if (successfulUploads.length > 0) {
				toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
			}
		} catch (error) {
			console.error("Error in handleSubmit:", error);
		} finally {
			setUploading(false);
		}
	};

	const removeFile = (index: number) => {
		setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const renderFileList = (fileList: File[] | string[], isUploaded = false) => (
		<div className="space-y-2">
			<h3 className="text-lg font-medium">{isUploaded ? "Uploaded files" : "Selected files"}</h3>
			<ul className="space-y-1">
				{fileList.map((file, index) => (
					<li
						key={index}
						className={`flex items-center justify-between rounded-md px-4 py-2 ${
							isUploaded ? "bg-green-100" : "bg-muted"
						}`}
					>
						<div className="truncate">{typeof file === "string" ? file : file.name}</div>
						{!isUploaded && (
							<div className="flex items-center space-x-2">
								<div className="text-sm text-muted-foreground">
									{((file as File).size / 1024 / 1024).toFixed(2)} MB
								</div>
								<button
									type="button"
									onClick={() => removeFile(index)}
									className="text-muted-foreground hover:text-foreground"
									aria-label={`Remove ${(file as File).name}`}
								>
									<X size={16} />
								</button>
							</div>
						)}
						{isUploaded && <div className="text-sm text-green-600">Uploaded</div>}
					</li>
				))}
			</ul>
		</div>
	);

	return (
		<form onSubmit={handleSubmit}>
			<div className="mx-auto w-full max-w-md space-y-4">
				<div
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={cn(
						"flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 transition-colors",
						isDragging
							? "border-primary bg-primary/10"
							: "border-primary hover:border-primary-foreground"
					)}
				>
					<UploadIcon className="h-8 w-8 text-primary" />
					<p className="">Drag and drop files here to upload</p>
					<Label
						htmlFor="file-input"
						className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}
					>
						<FilePlusIcon className="mr-2 h-4 w-4" />
						Select Files
					</Label>
					<input
						id="file-input"
						ref={fileInputRef}
						type="file"
						multiple
						accept={ALLOWED_FILE_TYPES.join(",")}
						className="sr-only"
						onChange={handleFileSelect}
					/>
				</div>
				{files.length > 0 && renderFileList(files)}
				{uploadedFiles.length > 0 && renderFileList(uploadedFiles, true)}
				<button
					type="submit"
					className={cn(buttonVariants({ variant: "default" }), "mt-4")}
					disabled={uploading || files.length === 0}
				>
					{uploading ? "Uploading..." : "Upload Files"}
				</button>
			</div>
		</form>
	);
}

function FilePlusIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<title>File plus icon</title>
			<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
			<path d="M14 2v4a2 2 0 0 0 2 2h4" />
			<path d="M9 15h6" />
			<path d="M12 18v-6" />
		</svg>
	);
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<title>Upload icon</title>
			<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<polyline points="17 8 12 3 7 8" />
			<line x1="12" x2="12" y1="3" y2="15" />
		</svg>
	);
}
