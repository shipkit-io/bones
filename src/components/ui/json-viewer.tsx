"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
	data: unknown;
	title?: string;
	className?: string;
}

export function JsonViewer({ data, title, className }: JsonViewerProps) {
	const [copied, setCopied] = useState(false);

	const jsonString = JSON.stringify(data, null, 2);

	const copyToClipboard = () => {
		navigator.clipboard.writeText(jsonString);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Card className={cn("relative", className)}>
			{title && (
				<div className="flex items-center justify-between px-4 py-2 border-b">
					<h3 className="text-sm font-medium">{title}</h3>
					<Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 gap-1 text-xs">
						{copied ? (
							<>
								<Check className="h-3.5 w-3.5" />
								<span>Copied</span>
							</>
						) : (
							<>
								<Copy className="h-3.5 w-3.5" />
								<span>Copy JSON</span>
							</>
						)}
					</Button>
				</div>
			)}
			<pre className="overflow-auto p-4 text-xs font-mono">{jsonString}</pre>
		</Card>
	);
}
