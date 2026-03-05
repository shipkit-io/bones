"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateTemporaryLink } from "@/server/actions/temporary-links";

interface DownloadButtonProps {
	userId: string;
}

export const DownloadButton = ({ userId }: DownloadButtonProps) => {
	const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

	const handleDownload = async () => {
		const temporaryLinkId = await generateTemporaryLink({ userId });
		const url = `/download/${temporaryLinkId}`;
		setDownloadUrl(url);
		window.open(url, "_blank");
	};

	return (
		<div className="space-y-4">
			<Button onClick={() => void handleDownload()}>Generate Download Link</Button>

			{downloadUrl && (
				<p className="text-sm text-muted-foreground">
					Download link generated! If it doesn't open automatically,
					<a
						href={downloadUrl}
						className={cn(buttonVariants({ variant: "link" }), "ml-1")}
						target="_blank"
						rel="noopener noreferrer"
					>
						click here
					</a>
				</p>
			)}
		</div>
	);
};
