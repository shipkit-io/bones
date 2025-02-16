"use client";

import * as React from "react";

export function useCopyToClipboard({
	timeout = 2000,
	onCopy,
}: {
	timeout?: number;
	onCopy?: () => void;
} = {}) {
	const [isCopied, setIsCopied] = React.useState(false);

	const copyToClipboard = async (value: string) => {
		if (typeof window === "undefined" || !value) {
			return;
		}

		try {
			if (navigator?.clipboard) {
				await navigator.clipboard.writeText(value);
			} else {
				// Fallback for browsers that don't support clipboard API
				const textArea = document.createElement("textarea");
				textArea.value = value;
				// Avoid scrolling to bottom
				textArea.style.top = "0";
				textArea.style.left = "0";
				textArea.style.position = "fixed";

				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				try {
					document.execCommand("copy");
				} catch (err) {
					console.error("Failed to copy text:", err);
					return;
				} finally {
					document.body.removeChild(textArea);
				}
			}

			setIsCopied(true);

			if (onCopy) {
				onCopy();
			}

			setTimeout(() => {
				setIsCopied(false);
			}, timeout);
		} catch (error) {
			console.error("Failed to copy text:", error);
		}
	};

	return { isCopied, copyToClipboard };
}
