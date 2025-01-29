"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
	getHistory,
	revertContentSection,
} from "@/server/actions/content-actions";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { formatDistanceToNow } from "date-fns";

interface ContentHistoryProps {
	filePath: string;
	onRevert: (newContent: string) => void;
}

interface Section {
	id: string;
	originalContent: string;
	currentContent: string;
	lastModified: string;
	path: string[];
}

export function ContentHistory({ filePath, onRevert }: ContentHistoryProps) {
	const [sections, setSections] = useState<Section[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadHistory() {
			try {
				setLoading(true);
				const history = await getHistory(filePath);
				setSections(
					history.sections.filter(
						(section) => section.currentContent !== section.originalContent,
					),
				);
			} catch (err) {
				setError("Failed to load content history");
				console.error(err);
			} finally {
				setLoading(false);
			}
		}

		loadHistory();
	}, [filePath]);

	const handleRevert = async (sectionId: string) => {
		try {
			const newContent = await revertContentSection(filePath, sectionId);
			onRevert(newContent);

			// Update sections
			const history = await getHistory(filePath);
			setSections(
				history.sections.filter(
					(section) => section.currentContent !== section.originalContent,
				),
			);
		} catch (err) {
			setError("Failed to revert section");
			console.error(err);
		}
	};

	if (loading) {
		return <div className="p-4 text-center">Loading history...</div>;
	}

	if (error) {
		return <div className="p-4 text-center text-red-500">{error}</div>;
	}

	if (sections.length === 0) {
		return (
			<div className="p-4 text-center text-muted-foreground">
				No changes found
			</div>
		);
	}

	return (
		<ScrollArea className="h-[400px] w-full rounded-md border p-4">
			<div className="space-y-4">
				{sections.map((section) => (
					<div key={section.id} className="space-y-2">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">{section.path.join(" > ")}</h3>
							<span className="text-sm text-muted-foreground">
								{formatDistanceToNow(new Date(section.lastModified))} ago
							</span>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<div className="text-sm font-medium text-muted-foreground">
									Original
								</div>
								<pre className="rounded-md bg-muted p-2 text-sm">
									{section.originalContent}
								</pre>
							</div>

							<div className="space-y-2">
								<div className="text-sm font-medium text-muted-foreground">
									Current
								</div>
								<pre className="rounded-md bg-muted p-2 text-sm">
									{section.currentContent}
								</pre>
							</div>
						</div>

						<Button
							variant="outline"
							size="sm"
							onClick={() => handleRevert(section.id)}
						>
							Revert this section
						</Button>

						<Separator className="mt-4" />
					</div>
				))}
			</div>
		</ScrollArea>
	);
}
