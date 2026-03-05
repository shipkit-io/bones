"use client";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilePreviewProps {
	files: {
		path: string;
		content: string;
	}[];
}

interface SingleFilePreviewProps {
	file: {
		path: string;
		content: string;
	};
}

function SingleFilePreview({ file }: SingleFilePreviewProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(file.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		const blob = new Blob([file.content], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = file.path.split("/").pop() || "file.txt";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<Card>
				<CardHeader className="py-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-medium">{file.path}</CardTitle>
						<CollapsibleTrigger className="rounded-full p-1 hover:bg-accent hover:text-accent-foreground">
							{isOpen ? (
								<ChevronUpIcon className="h-4 w-4" />
							) : (
								<ChevronDownIcon className="h-4 w-4" />
							)}
						</CollapsibleTrigger>
					</div>
				</CardHeader>
				<CollapsibleContent>
					<CardContent className="py-0">
						<pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
							<code>{file.content}</code>
						</pre>
					</CardContent>
				</CollapsibleContent>
				<CardFooter className="py-2 px-6 flex justify-end gap-2">
					<Button variant="outline" size="sm" onClick={handleCopy}>
						{copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
						<span className="ml-2">{copied ? "Copied" : "Copy"}</span>
					</Button>
					<Button variant="outline" size="sm" onClick={handleDownload}>
						<DownloadIcon className="h-4 w-4" />
						<span className="ml-2">Download</span>
					</Button>
				</CardFooter>
			</Card>
		</Collapsible>
	);
}

export function FilePreview({ files }: FilePreviewProps) {
	if (!files || files.length === 0) {
		return <div className="text-center p-8 text-muted-foreground">No files to display</div>;
	}

	return (
		<ScrollArea className="h-[400px]">
			<div className="space-y-4">
				{files.map((file) => (
					<SingleFilePreview key={file.path} file={file} />
				))}
			</div>
		</ScrollArea>
	);
}
