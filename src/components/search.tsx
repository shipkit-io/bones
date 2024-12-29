import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface SearchResult {
	title: string;
	description: string;
	keywords: string[];
	slug: string;
	section: string;
	content: string;
}

export function Search() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [searchIndex, setSearchIndex] = useState<SearchResult[]>([]);
	const debouncedQuery = useDebounce(query, 300);
	const router = useRouter();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setOpen(true);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	useEffect(() => {
		fetch("/search-index.json")
			.then((res) => res.json())
			.then(setSearchIndex)
			.catch(console.error);
	}, []);

	const search = useCallback(
		(searchQuery: string) => {
			if (!searchQuery.trim() || !searchIndex.length) {
				setResults([]);
				return;
			}

			const fuse = new Fuse(searchIndex, {
				keys: ["title", "description", "keywords", "content"],
				threshold: 0.3,
				includeMatches: true,
			});

			const searchResults = fuse.search(searchQuery);
			setResults(searchResults.map((result) => result.item));
		},
		[searchIndex],
	);

	useEffect(() => {
		search(debouncedQuery);
	}, [debouncedQuery, search]);

	const handleSelect = (result: SearchResult) => {
		router.push(`/${result.slug}`);
		setOpen(false);
		setQuery("");
	};

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="11" cy="11" r="8" />
					<path d="m21 21-4.3-4.3" />
				</svg>
				<span>Search documentation...</span>
				<kbd className="hidden rounded bg-gray-100 px-2 py-1 text-xs sm:inline-block">
					⌘K
				</kbd>
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="gap-0 p-0">
					<div className="flex items-center border-b px-4 py-2">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="mr-2 text-gray-500"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="m21 21-4.3-4.3" />
						</svg>
						<Input
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search documentation..."
							className="border-0 focus-visible:ring-0"
						/>
					</div>
					<ScrollArea className="h-[50vh] py-2">
						{results.length > 0 ? (
							<div className="space-y-1 px-2">
								{results.map((result) => (
									<button
										key={result.slug}
										onClick={() => handleSelect(result)}
										className="w-full rounded-lg px-2 py-2 text-left hover:bg-gray-100"
									>
										<div className="text-sm font-medium">{result.title}</div>
										<div className="text-xs text-gray-500">
											{result.description}
										</div>
									</button>
								))}
							</div>
						) : query ? (
							<div className="p-8 text-center text-sm text-gray-500">
								No results found.
							</div>
						) : null}
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</>
	);
}
