"use client";

import {
	BookOpen,
	ChevronDown,
	ChevronUp,
	CircleArrowRight,
	Code,
	CornerRightDown,
	Frown,
	HelpCircle,
	Loader,
	Search,
} from "lucide-react";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { ShortcutDisplay } from "@/components/primitives/shortcut-display";
import { useKeyboardShortcut } from "@/components/providers/keyboard-shortcut-provider";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { ShortcutAction } from "@/config/keyboard-shortcuts";
import { routes } from "@/config/routes";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site-config";

const MIN_HEIGHT = 48;
const MAX_HEIGHT = 120;
const MAX_SECTION_HEIGHT = 400;
const PREVIEW_LINES = 2;

const SEARCH_SUGGESTIONS = [
	{
		text: "Documentation",
		icon: BookOpen,
		colors: {
			icon: "text-blue-600",
			border: "border-blue-500",
			bg: "bg-blue-100 dark:bg-blue-900/20",
		},
	},
	{
		text: "Code Examples",
		icon: Code,
		colors: {
			icon: "text-emerald-600",
			border: "border-emerald-500",
			bg: "bg-emerald-100 dark:bg-emerald-900/20",
		},
	},
	{
		text: "How To",
		icon: HelpCircle,
		colors: {
			icon: "text-purple-600",
			border: "border-purple-500",
			bg: "bg-purple-100 dark:bg-purple-900/20",
		},
	},
];

interface SearchResult {
	title: string;
	content: string;
	url: string;
}

export interface SearchAiProps extends ButtonProps {
	/**
	 * Custom button text
	 * @default "Search..."
	 */
	buttonText?: string | React.ReactNode;

	/**
	 * Whether to show the keyboard shortcut
	 * @default true
	 */
	showShortcut?: boolean;

	/**
	 * When true, the button can collapse to show only an icon when space is tight
	 * @default false
	 */
	collapsible?: boolean;
}

export const SearchAi = ({
	buttonText,
	showShortcut = true,
	collapsible = false,
	className,
	...props
}: SearchAiProps) => {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState<string>("");
	const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
	const [answer, setAnswer] = React.useState<string>("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [isSearchInProgress, setIsSearchInProgress] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [selectedSuggestion, setSelectedSuggestion] = React.useState<string | null>(null);
	const [isAIResponseExpanded, setIsAIResponseExpanded] = React.useState(true);
	const [isSearchResultsExpanded, setIsSearchResultsExpanded] = React.useState(true);
	const [isClient, setIsClient] = React.useState(false);

	const { textareaRef, adjustHeight } = useAutoResizeTextarea({
		minHeight: MIN_HEIGHT,
		maxHeight: MAX_HEIGHT,
	});

	const handleSearch = async () => {
		if (!query.trim() || isSearchInProgress) return;

		setIsSearchInProgress(true);
		setIsLoading(true);
		setError(null);
		setAnswer("");
		setSearchResults([]);

		// Start both requests in parallel for better performance
		const searchResultsPromise = fetch(routes.api.docsSearch, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				query: query.trim(),
				limit: 5,
			}),
		});

		const aiStreamPromise = fetch(routes.api.docsSearch, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: `${selectedSuggestion ? `[${selectedSuggestion}] ` : ""}${query.trim()}`,
				limit: 5,
			}),
		});

		// Handle search results
		try {
			const searchResponse = await searchResultsPromise;
			if (searchResponse.ok) {
				const { results } = await searchResponse.json();
				setSearchResults(results);
			} else {
				console.warn("Failed to fetch search results, but continuing with AI response");
			}
		} catch (err) {
			console.warn("Search results fetch failed:", err);
		}

		// Handle AI streaming response
		let hasAIResponse = false;
		try {
			const streamResponse = await aiStreamPromise;

			if (!streamResponse.ok) {
				throw new Error("Failed to fetch AI response");
			}

			// Read the stream
			const reader = streamResponse.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("Failed to initialize stream reader");
			}

			let accumulatedAnswer = "";

			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					break;
				}

				// Decode and append the chunk
				const chunk = decoder.decode(value, { stream: true });
				accumulatedAnswer += chunk;
				setAnswer(accumulatedAnswer);
			}
			hasAIResponse = true;
		} catch (err) {
			console.error("AI streaming error:", err);
			// Only set error if we also don't have search results to show
			if (searchResults.length === 0 && !hasAIResponse) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} else {
				// We have search results, so just log the AI error but don't show it to user
				console.warn("AI response failed but search results are available");
			}
		} finally {
			setIsLoading(false);
			setIsSearchInProgress(false);
		}
	};

	const toggleSuggestion = (suggestionText: string) => {
		setSelectedSuggestion((prev) => (prev === suggestionText ? null : suggestionText));
	};

	const currentSuggestion = selectedSuggestion
		? SEARCH_SUGGESTIONS.find((item) => item.text === selectedSuggestion)
		: null;

	const handleSubmit = () => {
		void handleSearch();
	};

	// Use the central hook to open the AI search dialog
	useKeyboardShortcut(
		ShortcutAction.OPEN_SEARCH,
		(event) => {
			event.preventDefault();
			setOpen(true);
		},
		undefined,
		[]
	);

	React.useEffect(() => {
		setIsClient(true);
	}, []);

	const handleModalToggle = () => {
		setOpen(!open);
		setQuery("");
		setSearchResults([]);
		setAnswer("");
		setError(null);
		setSelectedSuggestion(null);
		// On larger screens, keep expanded. On smaller screens, start collapsed for preview
		setIsAIResponseExpanded(true);
		setIsSearchResultsExpanded(true);
	};

	// Show results indicator
	const hasSearched = query.trim() && !isSearchInProgress;
	const showResultsSection = hasSearched || isLoading;

	// Helper function to get preview text
	const getAnswerPreview = (text: string, lines: number = PREVIEW_LINES) => {
		const sentences = text.split(".").filter((s) => s.trim().length > 0);
		return sentences.slice(0, lines).join(".") + (sentences.length > lines ? "..." : "");
	};

	const getSearchResultsPreview = (results: SearchResult[]) => {
		if (results.length === 0) return "";
		const firstResult = results[0];
		if (!firstResult) return "";
		return `${firstResult.title} - ${firstResult.content.slice(0, 100)}${firstResult.content.length > 100 ? "..." : ""}`;
	};

	const defaultButtonText = `Search ${siteConfig.title}...`;

	return (
		<>
			<Button
				variant="outline"
				onClick={handleModalToggle}
				size="sm"
				className={cn(
					"relative bg-muted/50 text-sm font-normal text-muted-foreground shadow-none",
					collapsible
						? "justify-center lg:justify-start lg:pr-12"
						: "justify-start sm:pr-12",
					className
				)}
				{...props}
			>
				{collapsible && (
					<Search className="h-4 w-4 shrink-0 lg:mr-2" />
				)}
				<span
					className={cn(
						"text-xs truncate",
						collapsible ? "hidden lg:inline-flex" : "inline-flex"
					)}
				>
					{buttonText ?? defaultButtonText}
				</span>
				{showShortcut && (
					<ShortcutDisplay
						action={ShortcutAction.OPEN_SEARCH}
						className={cn(
							"pointer-events-none absolute right-[0.3rem] top-[0.3rem] text-xs",
							"transition-opacity duration-300",
							collapsible ? "hidden xl:flex" : "hidden lg:flex",
							isClient ? "opacity-100" : "opacity-0"
						)}
					/>
				)}
			</Button>

			<Dialog open={open} onOpenChange={handleModalToggle}>
				<DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[1000px]">
					<DialogHeader>
						<DialogTitle>Search Documentation</DialogTitle>
						<DialogDescription>
							Search through our documentation using AI-powered search.
						</DialogDescription>
					</DialogHeader>

					<div className="w-full py-4">
						<div className="relative mx-auto w-full max-w-full">
							<div className="relative rounded-2xl border border-black/10 bg-black/[0.03] focus-within:border-black/20 dark:border-white/10 dark:bg-white/[0.03] dark:focus-within:border-white/20">
								<div className="flex flex-col">
									<div className="overflow-y-auto" style={{ maxHeight: `${MAX_HEIGHT - 48}px` }}>
										<Textarea
											ref={textareaRef}
											placeholder="What would you like to know?"
											className={cn(
												"w-full max-w-full resize-none text-wrap rounded-2xl border-none bg-transparent pb-3 pr-10 pt-3 leading-[1.2] text-black placeholder:text-black/70 focus:ring focus-visible:ring-0 focus-visible:ring-offset-0 dark:text-white dark:placeholder:text-white/70",
												`min-h-[${MIN_HEIGHT}px]`
											)}
											value={query}
											onChange={(e) => {
												setQuery(e.target.value);
												adjustHeight();
											}}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													if (!isLoading && query.trim()) {
														void handleSubmit();
													}
												}
											}}
										/>
									</div>

									<div className="h-12 bg-transparent">
										{currentSuggestion && (
											<div className="absolute bottom-3 left-3 z-10">
												<button
													type="button"
													onClick={handleSubmit}
													disabled={isSearchInProgress}
													className={cn(
														"inline-flex items-center gap-1.5",
														"rounded-md border px-2 py-0.5 text-xs font-medium shadow-sm",
														"animate-fadeIn transition-colors duration-200",
														isSearchInProgress
															? "opacity-50 cursor-not-allowed"
															: "hover:bg-black/5 dark:hover:bg-white/5",
														currentSuggestion.colors.bg,
														currentSuggestion.colors.border
													)}
												>
													<currentSuggestion.icon
														className={`h-3.5 w-3.5 ${currentSuggestion.colors.icon}`}
													/>
													<span className={currentSuggestion.colors.icon}>
														{selectedSuggestion}
													</span>
												</button>
											</div>
										)}
									</div>
								</div>

								<Button
									onClick={handleSubmit}
									type="submit"
									variant="ghost"
									size="icon"
									className={cn(
										"absolute right-3 top-3 h-4 w-4 transition-all duration-200 dark:text-white",
										query ? "scale-100 opacity-100" : "scale-95 opacity-30"
									)}
								>
									<CircleArrowRight className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<div className="mx-auto mt-2 flex max-w-full flex-wrap justify-start gap-1.5">
							{SEARCH_SUGGESTIONS.filter((item) => item.text !== selectedSuggestion).map(
								({ text, icon: Icon, colors }) => (
									<button
										type="button"
										key={text}
										className={cn(
											"rounded-full px-3 py-1.5 text-xs font-medium",
											"border transition-all duration-200",
											"border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-gray-900 dark:hover:bg-white/5",
											"flex-shrink-0"
										)}
										onClick={() => toggleSuggestion(text)}
									>
										<div className="flex items-center gap-1.5">
											<Icon className={cn("h-4 w-4", colors.icon)} />
											<span className="whitespace-nowrap text-black/70 dark:text-white/70">
												{text}
											</span>
										</div>
									</button>
								)
							)}
						</div>
					</div>

					{error && (
						<div className="flex items-start gap-4">
							<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 p-2 dark:bg-red-900">
								<Frown className="h-4 w-4 text-red-600 dark:text-red-400" />
							</span>
							<p className="mt-0.5 text-red-600 dark:text-red-400">{error}</p>
						</div>
					)}

					{/* Results Section - Responsive Layout */}
					{showResultsSection && !error && (
						<>
							{/* Mobile/Tablet: Preview Cards */}
							<div className="flex flex-col gap-4 lg:hidden">
								{/* Search Results Preview Card */}
								<div className="rounded-lg border bg-white dark:bg-gray-900">
									<button
										type="button"
										onClick={() => setIsSearchResultsExpanded(!isSearchResultsExpanded)}
										className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
									>
										<div className="flex items-center gap-2">
											<BookOpen className="h-4 w-4 text-blue-600" />
											<h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
												Documentation
											</h4>
											{searchResults.length > 0 && (
												<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
													{searchResults.length}
												</span>
											)}
										</div>
										{isSearchResultsExpanded ? (
											<ChevronUp className="h-4 w-4" />
										) : (
											<ChevronDown className="h-4 w-4" />
										)}
									</button>

									{!isSearchResultsExpanded && searchResults.length > 0 && (
										<div className="px-4 pb-4">
											<p className="text-sm text-slate-500 dark:text-slate-400">
												{getSearchResultsPreview(searchResults)}
											</p>
										</div>
									)}

									{isSearchResultsExpanded && (
										<div className="border-t p-4">
											{isLoading && searchResults.length === 0 ? (
												<div className="flex items-center gap-3">
													<Loader className="h-4 w-4 animate-spin text-blue-600" />
													<span className="text-sm text-slate-500">Finding related docs...</span>
												</div>
											) : searchResults.length > 0 ? (
												<ScrollArea className={"max-h-[300px]"}>
													<ul className="space-y-2">
														{searchResults.map((result) => (
															<li key={result.url}>
																<a
																	href={result.url}
																	className="block rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
																	onClick={handleModalToggle}
																>
																	<h5 className="font-medium text-slate-900 dark:text-slate-100">
																		{result.title}
																	</h5>
																	<p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
																		{result.content}
																	</p>
																</a>
															</li>
														))}
													</ul>
												</ScrollArea>
											) : hasSearched ? (
												<div className="flex items-center gap-3 text-slate-500">
													<span className="text-sm">No documentation found</span>
												</div>
											) : null}
										</div>
									)}
								</div>

								{/* AI Response Preview Card */}
								<div className="rounded-lg border bg-white dark:bg-gray-900">
									<button
										type="button"
										onClick={() => setIsAIResponseExpanded(!isAIResponseExpanded)}
										className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
									>
										<div className="flex items-center gap-2">
											<HelpCircle className="h-4 w-4 text-purple-600" />
											<h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
												AI Answer
											</h4>
											{answer && (
												<span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
													Generated
												</span>
											)}
										</div>
										{isAIResponseExpanded ? (
											<ChevronUp className="h-4 w-4" />
										) : (
											<ChevronDown className="h-4 w-4" />
										)}
									</button>

									{!isAIResponseExpanded && answer && (
										<div className="px-4 pb-4">
											<p className="text-sm text-slate-500 dark:text-slate-400">
												{getAnswerPreview(answer)}
											</p>
										</div>
									)}

									{isAIResponseExpanded && (
										<div className="border-t p-4">
											{isLoading && !answer ? (
												<div className="flex items-center gap-3">
													<Loader className="h-4 w-4 animate-spin text-purple-600" />
													<span className="text-sm text-slate-500">AI is thinking...</span>
												</div>
											) : answer ? (
												<ScrollArea className={"max-h-[300px]"}>
													<div className="prose max-w-none text-sm dark:prose-invert">
														<ReactMarkdown>{answer}</ReactMarkdown>
													</div>
												</ScrollArea>
											) : hasSearched ? (
												<div className="flex items-center gap-3 text-slate-500">
													<span className="text-sm">No AI response available</span>
												</div>
											) : null}
										</div>
									)}
								</div>
							</div>

							{/* Desktop: Side by Side */}
							<div className="hidden lg:flex lg:gap-6">
								{/* Search Results Column */}
								<div className="flex-1">
									<div className="rounded-lg border bg-white dark:bg-gray-900">
										<div className="flex items-center justify-between border-b p-4">
											<div className="flex items-center gap-2">
												<BookOpen className="h-4 w-4 text-blue-600" />
												<h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
													Documentation
												</h4>
												{searchResults.length > 0 && (
													<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
														{searchResults.length}
													</span>
												)}
											</div>
											<button
												type="button"
												onClick={() => setIsSearchResultsExpanded(!isSearchResultsExpanded)}
												className="rounded-md p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
											>
												{isSearchResultsExpanded ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												)}
											</button>
										</div>

										{isSearchResultsExpanded && (
											<div className="p-4">
												{isLoading && searchResults.length === 0 ? (
													<div className="flex items-center gap-3">
														<Loader className="h-4 w-4 animate-spin text-blue-600" />
														<span className="text-sm text-slate-500">Finding related docs...</span>
													</div>
												) : searchResults.length > 0 ? (
													<ScrollArea className={`max-h-[${MAX_SECTION_HEIGHT}px]`}>
														<ul className="space-y-2">
															{searchResults.map((result) => (
																<li key={result.url}>
																	<a
																		href={result.url}
																		className="block rounded-lg p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
																		onClick={handleModalToggle}
																	>
																		<h5 className="font-medium text-slate-900 dark:text-slate-100">
																			{result.title}
																		</h5>
																		<p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
																			{result.content}
																		</p>
																	</a>
																</li>
															))}
														</ul>
													</ScrollArea>
												) : hasSearched ? (
													<div className="flex items-center gap-3 text-slate-500">
														<span className="text-sm">No documentation found</span>
													</div>
												) : null}
											</div>
										)}
									</div>
								</div>

								{/* AI Response Column */}
								<div className="flex-1">
									<div className="rounded-lg border bg-white dark:bg-gray-900">
										<div className="flex items-center justify-between border-b p-4">
											<div className="flex items-center gap-2">
												<HelpCircle className="h-4 w-4 text-purple-600" />
												<h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
													AI Answer
												</h4>
												{answer && (
													<span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
														Generated
													</span>
												)}
											</div>
											<button
												type="button"
												onClick={() => setIsAIResponseExpanded(!isAIResponseExpanded)}
												className="rounded-md p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
											>
												{isAIResponseExpanded ? (
													<ChevronUp className="h-4 w-4" />
												) : (
													<ChevronDown className="h-4 w-4" />
												)}
											</button>
										</div>

										{isAIResponseExpanded && (
											<div className="p-4">
												{isLoading && !answer ? (
													<div className="flex items-center gap-3">
														<Loader className="h-4 w-4 animate-spin text-purple-600" />
														<span className="text-sm text-slate-500">AI is thinking...</span>
													</div>
												) : answer ? (
													<ScrollArea className={`max-h-[${MAX_SECTION_HEIGHT}px]`}>
														<div className="prose max-w-none text-sm dark:prose-invert">
															<ReactMarkdown>{answer}</ReactMarkdown>
														</div>
													</ScrollArea>
												) : hasSearched ? (
													<div className="flex items-center gap-3 text-slate-500">
														<span className="text-sm">No AI response available</span>
													</div>
												) : null}
											</div>
										)}
									</div>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};
