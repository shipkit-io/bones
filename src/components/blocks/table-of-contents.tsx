"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface TableOfContentsProps {
	headings: {
		id: string;
		text: string;
		level: number;
	}[];
}

export const TableOfContents = ({ headings }: TableOfContentsProps) => {
	const [activeItem, setActiveItem] = useState<string | null>(null);

	return (
		<nav className="w-64 rounded-lg bg-background p-4 text-foreground shadow-md">
			<h2 className="mb-4 text-lg font-semibold">Table of Contents</h2>
			<ul>
				{headings.map((heading) => (
					<motion.li
						key={heading.id}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3 }}
						className={`my-1 ml-${(heading.level - 1) * 4}`}
					>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setActiveItem(heading.id)}
							className={`flex w-full items-center rounded-md px-2 py-1 text-left transition-colors ${
								activeItem === heading.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
							}`}
						>
							<span className="text-sm">{heading.text}</span>
						</motion.button>
					</motion.li>
				))}
			</ul>
		</nav>
	);
};
