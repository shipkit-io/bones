import Image from "next/image";
import type React from "react";
import { Link } from "@/components/primitives/link";
import { authorUtils, type BlogAuthor } from "@/config/blog-authors";

// Legacy author interface for backward compatibility
interface LegacyAuthor {
	name: string;
	avatar: string;
}

interface BlogAuthorsProps {
	authors: (BlogAuthor | LegacyAuthor)[];
}

/**
 * Check if author is a BlogAuthor (new system) or LegacyAuthor
 */
function isBlogAuthor(author: BlogAuthor | LegacyAuthor): author is BlogAuthor {
	return "id" in author;
}

export const BlogAuthors = ({ authors }: BlogAuthorsProps) => {
	if (!authors || authors.length === 0) return null;

	return (
		<div className="flex -space-x-2 relative z-0 mt-6" role="group" aria-label="Article authors">
			{authors.map((author, i) => {
				const isNewAuthor = isBlogAuthor(author);
				const displayName = isNewAuthor ? authorUtils.getDisplayName(author) : author.name;
				const authorUrl = isNewAuthor ? authorUtils.getAuthorUrl(author) : null;

				const imageElement = (
					<Image
						className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white transition-transform hover:scale-110"
						style={{ zIndex: authors.length - i }}
						src={author.avatar}
						alt={displayName}
						width={32}
						height={32}
						title={displayName}
					/>
				);

				// If new author system with URL, wrap in link
				if (authorUrl) {
					return (
						<Link
							key={isNewAuthor ? author.id : `legacy-${i}`}
							href={authorUrl}
							className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
							aria-label={`View ${displayName}'s profile`}
						>
							{imageElement}
						</Link>
					);
				}

				// Legacy author or no URL
				return (
					<div key={isNewAuthor ? author.id : `legacy-${i}`} className="focus:outline-none">
						{imageElement}
					</div>
				);
			})}
		</div>
	);
};
