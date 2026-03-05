"use client";

import { ExternalLink, Globe, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Link } from "@/components/primitives/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authorUtils, type BlogAuthor } from "@/config/blog-authors";
import { cn } from "@/lib/utils";

interface AuthorProfileProps {
	author: BlogAuthor;
	postCount?: number;
	showCompact?: boolean;
	className?: string;
}

/**
 * Enhanced blog author profile component
 */
export const AuthorProfile = ({
	author,
	postCount,
	showCompact = false,
	className,
}: AuthorProfileProps) => {
	const [imageError, setImageError] = useState(false);
	const displayName = authorUtils.getDisplayName(author);
	const socialLinks = authorUtils.getSocialLinks(author);

	const handleImageError = () => {
		setImageError(true);
	};

	// Compact version for sidebars or small spaces
	if (showCompact) {
		return (
			<Card className={cn("w-full", className)}>
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="relative">
							{!imageError ? (
								<Image
									src={author.avatar}
									alt={`${displayName} avatar`}
									width={40}
									height={40}
									className="rounded-full ring-2 ring-muted"
									onError={handleImageError}
								/>
							) : (
								<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
									<span className="text-sm font-medium">{displayName.charAt(0).toUpperCase()}</span>
								</div>
							)}
						</div>
						<div className="flex-1 min-w-0">
							<h3 className="font-medium text-sm truncate">{displayName}</h3>
							{author.role && (
								<p className="text-xs text-muted-foreground truncate">{author.role}</p>
							)}
							{postCount !== undefined && (
								<p className="text-xs text-muted-foreground">
									{postCount} {postCount === 1 ? "post" : "posts"}
								</p>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Full version for author pages or detailed displays
	return (
		<Card className={cn("w-full", className)}>
			<CardHeader className="pb-4">
				<div className="flex flex-col sm:flex-row gap-4 items-start">
					<div className="relative">
						{!imageError ? (
							<Image
								src={author.avatar}
								alt={`${displayName} avatar`}
								width={80}
								height={80}
								className="rounded-full ring-2 ring-muted"
								onError={handleImageError}
								priority
							/>
						) : (
							<div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
								<span className="text-xl font-medium">{displayName.charAt(0).toUpperCase()}</span>
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
							<h1 className="text-2xl font-bold truncate">{displayName}</h1>
							{author.isActive !== false && (
								<Badge variant="secondary" className="w-fit">
									Active
								</Badge>
							)}
						</div>

						{author.role && <p className="text-muted-foreground mb-2">{author.role}</p>}

						<div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
							{author.location && (
								<div className="flex items-center gap-1">
									<MapPin className="h-3 w-3" aria-hidden="true" />
									<span>{author.location}</span>
								</div>
							)}
							{postCount !== undefined && (
								<div className="flex items-center gap-1">
									<span>
										{postCount} {postCount === 1 ? "post" : "posts"}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{author.bio && (
					<div>
						<h2 className="font-medium mb-2">About</h2>
						<p className="text-muted-foreground leading-relaxed">{author.bio}</p>
					</div>
				)}

				{socialLinks.length > 0 && (
					<div>
						<h2 className="font-medium mb-3">Connect</h2>
						<div className="flex flex-wrap gap-2">
							{socialLinks.map((link) => (
								<Button key={link.platform} variant="outline" size="sm" asChild className="h-8">
									<a
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-2"
										aria-label={`${displayName} on ${link.platform}`}
									>
										{link.platform === "website" && (
											<Globe className="h-3 w-3" aria-hidden="true" />
										)}
										<span className="text-xs">{link.handle}</span>
										<ExternalLink className="h-2 w-2 ml-1" aria-hidden="true" />
									</a>
								</Button>
							))}
						</div>
					</div>
				)}

				{author.email && !socialLinks.some((link) => link.platform === "email") && (
					<div>
						<Separator />
						<div className="flex items-center gap-2 pt-4">
							<Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
							<a
								href={`mailto:${author.email}`}
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								aria-label={`Send email to ${displayName}`}
							>
								{author.email}
							</a>
						</div>
					</div>
				)}

				<div className="pt-2">
					<Button asChild variant="outline" size="sm" className="w-full">
						<Link href={authorUtils.getAuthorUrl(author)}>View All Posts by {displayName}</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

/**
 * Simple author byline component for use in post headers
 */
export const AuthorByline = ({
	author,
	publishedAt,
	className,
}: {
	author: BlogAuthor;
	publishedAt?: string | Date;
	className?: string;
}) => {
	const [imageError, setImageError] = useState(false);
	const displayName = authorUtils.getDisplayName(author);

	const handleImageError = () => {
		setImageError(true);
	};

	return (
		<div className={cn("flex items-center gap-3", className)}>
			<Link
				href={authorUtils.getAuthorUrl(author)}
				className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
				aria-label={`View ${displayName}'s profile`}
			>
				{!imageError ? (
					<Image
						src={author.avatar}
						alt={`${displayName} avatar`}
						width={32}
						height={32}
						className="rounded-full ring-2 ring-muted transition-transform hover:scale-105"
						onError={handleImageError}
					/>
				) : (
					<div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
						<span className="text-xs font-medium">{displayName.charAt(0).toUpperCase()}</span>
					</div>
				)}
			</Link>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 text-sm">
					<span className="text-muted-foreground">By</span>
					<Link
						href={authorUtils.getAuthorUrl(author)}
						className="font-medium hover:underline truncate"
					>
						{displayName}
					</Link>
				</div>
				{publishedAt && (
					<time
						dateTime={publishedAt instanceof Date ? publishedAt.toISOString() : publishedAt}
						className="text-xs text-muted-foreground"
					>
						{new Intl.DateTimeFormat("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						}).format(new Date(publishedAt))}
					</time>
				)}
			</div>
		</div>
	);
};
