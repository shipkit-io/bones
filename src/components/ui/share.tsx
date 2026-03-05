"use client";

import { Facebook, Linkedin, Link as LinkIcon, Share2, Twitter } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BASE_URL } from "@/config/base-url";
import { useToast } from "@/hooks/use-toast";

interface ShareProps {
	title?: string;
	description?: string;
	hashtags?: string[];
	via?: string;
	className?: string;
}

export const Share = ({
	title = "Check this out!",
	description = "I thought you might find this interesting",
	hashtags = [],
	via = "shipkit",
	className,
}: ShareProps) => {
	const { toast } = useToast();
	const pathname = usePathname();
	const url = `${BASE_URL}${pathname}`;

	const shareData = {
		title,
		text: description,
		url,
	};

	const handleNativeShare = async () => {
		try {
			if (navigator?.share) {
				await navigator.share(shareData);
				toast({
					title: "Shared!",
					description: "Content shared successfully",
				});
			} else {
				throw new Error("Native sharing not supported");
			}
		} catch (error) {
			console.error("Error sharing:", error);
			toast({
				title: "Error",
				description: "Failed to share content",
				variant: "destructive",
			});
		}
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(url);
			toast({
				title: "Copied!",
				description: "Link copied to clipboard",
			});
		} catch (error) {
			console.error("Error copying:", error);
			toast({
				title: "Error",
				description: "Failed to copy link",
				variant: "destructive",
			});
		}
	};

	const openShareWindow = (shareUrl: string) => {
		window.open(shareUrl, "share-dialog", "width=600,height=400,location=no,menubar=no");
	};

	// Social media share URLs
	const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
		url
	)}&text=${encodeURIComponent(description)}&via=${via}&hashtags=${hashtags.join(",")}`;

	const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

	const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
		url
	)}`;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" className={className} onClick={handleNativeShare}>
					<Share2 className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			{!navigator?.share && (
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => openShareWindow(twitterUrl)}>
						<Twitter className="mr-2 h-4 w-4" />
						Share on Twitter
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => openShareWindow(facebookUrl)}>
						<Facebook className="mr-2 h-4 w-4" />
						Share on Facebook
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => openShareWindow(linkedinUrl)}>
						<Linkedin className="mr-2 h-4 w-4" />
						Share on LinkedIn
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleCopyLink}>
						<LinkIcon className="mr-2 h-4 w-4" />
						Copy Link
					</DropdownMenuItem>
				</DropdownMenuContent>
			)}
		</DropdownMenu>
	);
};
