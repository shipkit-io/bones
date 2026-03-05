"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * SecretGenerator component for generating random secrets
 * Used in MDX files to allow users to generate secrets for various purposes
 */
export const SecretGenerator = ({
	length = 32,
	label = "Generate Secret",
}: {
	length?: number;
	label?: string;
}) => {
	const [secret, setSecret] = useState<string>("");

	// Generate a random secret of specified length
	const generateSecret = () => {
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const randomValues = new Uint8Array(length);
		window.crypto.getRandomValues(randomValues);

		let result = "";
		for (const val of randomValues) {
			result += characters.charAt(val % characters.length);
		}

		setSecret(result);
	};

	// Copy the secret to clipboard
	const copyToClipboard = () => {
		if (!secret) return;

		navigator.clipboard
			.writeText(secret)
			.then(() => {
				toast.success("Secret copied to clipboard");
			})
			.catch(() => {
				toast.error("Failed to copy secret");
			});
	};

	return (
		<div className="my-4 p-4 border rounded-md bg-muted/50">
			<div className="mb-2 font-medium">Generate a secure random secret</div>
			<div className="flex gap-2 mb-4">
				<Button onClick={generateSecret} variant="default">
					{label}
				</Button>
			</div>

			{secret && (
				<div className="mt-2">
					<div className="flex gap-2 items-center">
						<Input value={secret} readOnly className="font-mono text-sm" />
						<Button
							size="icon"
							variant="outline"
							onClick={copyToClipboard}
							title="Copy to clipboard"
						>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
					<p className="text-xs text-muted-foreground mt-2">
						This is a cryptographically secure random string. Copy this value and use it as your
						PAYLOAD_SECRET.
					</p>
				</div>
			)}
		</div>
	);
};
