"use client";

import { Check, ChevronsUpDown, ListPlus, Loader2 } from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce";
import { env } from "@/env";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GOOGLE_FONTS } from "@/config/fonts"; // Initial curated list
import { cn } from "@/lib/utils";

interface FontsApiResponse {
	families: string[];
	fallback: string;
	hasMore?: boolean; // Add hasMore for pagination
	isCurated?: boolean;
	error?: string;
}

const DEBOUNCE_DELAY = 300; // milliseconds
const BROWSE_LIMIT = 50; // Number of fonts per browse page
const FONT_API_PATH = "/dev/api/fonts";

/**
 * Font selector with suggestions, server-side search, and paginated browsing.
 * Only intended for use in NODE_ENV=development.
 */
export function FontSelector() {
	const fontSelectorEnabled = env.NEXT_PUBLIC_FEATURE_DEVTOOLS_FONT_SELECTOR_ENABLED;
	const [open, setOpen] = React.useState(false);
	const [selectedFont, setSelectedFont] = React.useState<string>("");
	const [fallbackFonts, setFallbackFonts] = React.useState<string>("");
	const [initialLoading, setInitialLoading] = React.useState(true);
	const [initialError, setInitialError] = React.useState<string | null>(null);

	// Search state
	const [searchQuery, setSearchQuery] = React.useState("");
	const [debouncedSearchQuery] = useDebounce(searchQuery, DEBOUNCE_DELAY);
	const [searchResults, setSearchResults] = React.useState<string[]>([]);
	const [searchLoading, setSearchLoading] = React.useState(false);
	const [searchError, setSearchError] = React.useState<string | null>(null);

	// Browse state
	const [browsedFonts, setBrowsedFonts] = React.useState<string[]>([]);
	const [browsePage, setBrowsePage] = React.useState(1);
	const [browseHasMore, setBrowseHasMore] = React.useState(false);
	const [browseLoading, setBrowseLoading] = React.useState(false);
	const [browseError, setBrowseError] = React.useState<string | null>(null);

	const [isCuratedList, setIsCuratedList] = React.useState(false);
	const [mounted, setMounted] = React.useState(false);

	// Apply Font Function (Memoized)
	const applyFont = React.useCallback((fontFamily: string, fallbacks: string) => {
		if (!fallbacks || typeof window === "undefined") return;
		const existingLink = document.head.querySelector('link[data-font-selector="true"]');
		if (existingLink) document.head.removeChild(existingLink);

		if (fontFamily) {
			const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;700&display=swap`;
			const link = document.createElement("link");
			link.href = fontUrl;
			link.rel = "stylesheet";
			link.setAttribute("data-font-selector", "true");
			document.head.appendChild(link);
		}

		const fontName = fontFamily
			? fontFamily.includes(" ")
				? `"${fontFamily}"`
				: fontFamily
			: null;
		document.body.style.fontFamily = fontName ? `${fontName}, ${fallbacks}` : fallbacks;
	}, []);

	// Fetch initial data (fallbacks + first browse page)
	React.useEffect(() => {
		setMounted(true);
		const fetchInitialData = async () => {
			setInitialLoading(true);
			setInitialError(null);
			setBrowseError(null);
			setBrowseLoading(true);
			try {
				const response = await fetch(`${FONT_API_PATH}?page=1&limit=${BROWSE_LIMIT}`);
				if (!response.ok) {
					const data: Partial<FontsApiResponse> = await response.json();
					throw new Error(data.error || `HTTP error! status: ${response.status}`);
				}
				const data: FontsApiResponse = await response.json();
				setFallbackFonts(data.fallback);
				setBrowsedFonts(data.families);
				setBrowseHasMore(data.hasMore ?? false);
				setBrowsePage(1);
				setIsCuratedList(data.isCurated ?? false);
			} catch (e: unknown) {
				console.error("Failed to fetch initial font data:", e);
				const errorMsg = e instanceof Error ? e.message : "Failed to load initial data";
				setInitialError(errorMsg);
				setBrowseError(errorMsg);
				setFallbackFonts(
					[
						"ui-sans-serif",
						"system-ui",
						"-apple-system",
						"BlinkMacSystemFont",
						'"Segoe UI"',
						"Roboto",
						'"Helvetica Neue"',
						"Arial",
						'"Noto Sans"',
						"sans-serif",
						'"Apple Color Emoji"',
						'"Segoe UI Emoji"',
						'"Segoe UI Symbol"',
						'"Noto Color Emoji"',
					].join(", ")
				);
			} finally {
				setInitialLoading(false);
				setBrowseLoading(false);
			}
		};
		fetchInitialData();
	}, []);

	// Set and apply initial font once fallbacks are loaded
	React.useEffect(() => {
		if (!mounted || initialLoading || !fallbackFonts || selectedFont) return;
		const getInitialFont = () => {
			const currentStyle = document.body.style.fontFamily;
			if (currentStyle) {
				const fontParts = currentStyle.split(",");
				const firstFont = fontParts[0]?.trim().replace(/['"]/g, "");
				if (firstFont && GOOGLE_FONTS.some((f) => f.family === firstFont)) return firstFont;
				if (firstFont && browsedFonts.includes(firstFont)) return firstFont;
			}
			const defaultFont = GOOGLE_FONTS.find((f) => f.family === "Inter")?.family || "";
			if (!currentStyle && defaultFont) {
				document.body.style.fontFamily = `${defaultFont}, ${fallbackFonts}`;
			}
			return defaultFont;
		};
		const initial = getInitialFont();
		setSelectedFont(initial);
	}, [mounted, initialLoading, fallbackFonts, browsedFonts]);

	// Function to load more browse fonts
	const loadMoreFonts = React.useCallback(async () => {
		if (browseLoading || !browseHasMore) return;
		setBrowseLoading(true);
		setBrowseError(null);
		const nextPage = browsePage + 1;
		try {
			const response = await fetch(`${FONT_API_PATH}?page=${nextPage}&limit=${BROWSE_LIMIT}`);
			if (!response.ok) {
				const data: Partial<FontsApiResponse> = await response.json();
				throw new Error(data.error || `HTTP error! status: ${response.status}`);
			}
			const data: FontsApiResponse = await response.json();
			setBrowsedFonts((prev) => [...prev, ...data.families]);
			setBrowseHasMore(data.hasMore ?? false);
			setBrowsePage(nextPage);
		} catch (e: unknown) {
			console.error("Failed to load more fonts:", e);
			setBrowseError(e instanceof Error ? e.message : "Failed to load more fonts");
		} finally {
			setBrowseLoading(false);
		}
	}, [browseLoading, browseHasMore, browsePage]);

	// Effect to perform search
	React.useEffect(() => {
		if (!debouncedSearchQuery) {
			setSearchResults([]);
			return;
		}
		const searchFonts = async () => {
			setSearchLoading(true);
			setSearchError(null);
			try {
				const response = await fetch(
					`${FONT_API_PATH}?search=${encodeURIComponent(debouncedSearchQuery)}`
				);
				if (!response.ok) {
					const data: Partial<FontsApiResponse> = await response.json();
					throw new Error(data.error || `HTTP error! status: ${response.status}`);
				}
				const data: FontsApiResponse = await response.json();
				setSearchResults(data.families);
			} catch (e: unknown) {
				console.error("Failed to search fonts:", e);
				setSearchError(e instanceof Error ? e.message : "Failed to search fonts");
				setSearchResults([]);
			} finally {
				setSearchLoading(false);
			}
		};
		searchFonts();
	}, [debouncedSearchQuery]);

	// Apply selected font
	React.useEffect(() => {
		if (mounted && fallbackFonts) {
			applyFont(selectedFont, fallbackFonts);
		}
	}, [selectedFont, fallbackFonts, mounted, applyFont]);

	if (!fontSelectorEnabled) return null;
	if (!mounted) return null;

	const handleSelectFont = (currentValue: string) => {
		const newFont = currentValue === selectedFont ? "" : currentValue;
		setSelectedFont(newFont);
		setSearchQuery("");
		setSearchResults([]);
		setSearchLoading(false);
		setSearchError(null);
		setOpen(false);
	};

	const isReady = mounted && !initialLoading && !!fallbackFonts;
	const hasError = !!initialError;

	return (
		<div className="fixed bottom-4 right-4 z-[1000]">
			<Popover
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (!isOpen) {
						setSearchQuery("");
						setSearchResults([]);
						setSearchLoading(false);
						setSearchError(null);
					}
				}}
			>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						aria-label="Select font"
						className="w-[200px] justify-between bg-background shadow-lg"
						disabled={!isReady || hasError}
					>
						<span className="truncate">
							{!isReady ? "Initializing..." : hasError ? "Error" : selectedFont || "Select font..."}
						</span>
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder={
								isCuratedList ? "Browse suggestions..." : "Search or Browse fonts..."
							}
							value={searchQuery}
							onValueChange={setSearchQuery}
							disabled={!isReady}
						/>
						<CommandList>
							{searchQuery ? (
								/* --- Search View --- */
								<CommandGroup heading="Search Results">
									{searchLoading && (
										<div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
											<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
										</div>
									)}
									{!searchLoading && searchError && (
										<div className="p-2 text-center text-xs text-destructive">
											Error: {searchError}
										</div>
									)}
									{!searchLoading && !searchError && searchResults.length === 0 && (
										<CommandEmpty>No results for "{searchQuery}".</CommandEmpty>
									)}
									{!searchLoading &&
										!searchError &&
										searchResults.length > 0 &&
										searchResults.map((fontFamily) => (
											<CommandItem
												key={`search-${fontFamily}`}
												value={fontFamily}
												onSelect={handleSelectFont}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														selectedFont === fontFamily ? "opacity-100" : "opacity-0"
													)}
													aria-hidden="true"
												/>
												<span>{fontFamily}</span>
											</CommandItem>
										))}
								</CommandGroup>
							) : (
								/* --- Browse View --- */
								<>
									<CommandGroup heading="Suggestions">
										{GOOGLE_FONTS.length > 0 ? (
											GOOGLE_FONTS.map((font) => (
												<CommandItem
													key={`suggest-${font.family}`}
													value={font.family}
													onSelect={handleSelectFont}
												>
													<Check
														className={cn(
															"mr-2 h-4 w-4",
															selectedFont === font.family ? "opacity-100" : "opacity-0"
														)}
														aria-hidden="true"
													/>
													<span>{font.family}</span>
												</CommandItem>
											))
										) : (
											<CommandEmpty>No suggestions.</CommandEmpty>
										)}
									</CommandGroup>

									<CommandSeparator />

									{!isCuratedList && (
										<CommandGroup heading="Browse Fonts">
											{browsedFonts.length > 0
												? browsedFonts.map((fontFamily) => (
													<CommandItem
														key={`browse-${fontFamily}`}
														value={fontFamily}
														onSelect={handleSelectFont}
													>
														<Check
															className={cn(
																"mr-2 h-4 w-4",
																selectedFont === fontFamily ? "opacity-100" : "opacity-0"
															)}
															aria-hidden="true"
														/>
														<span>{fontFamily}</span>
													</CommandItem>
												))
												: null}

											{/* Loading/Error/Load More Section */}
											{browseLoading && (
												<div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
													<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading more...
												</div>
											)}
											{!browseLoading && browseError && (
												<div className="p-2 text-center text-xs text-destructive">
													Error: {browseError}
												</div>
											)}
											{!browseLoading && !browseError && browseHasMore && (
												<CommandItem
													key="load-more"
													onSelect={() => {
														void loadMoreFonts();
													}}
													className="flex cursor-pointer items-center justify-center text-sm text-muted-foreground hover:bg-accent"
												>
													<ListPlus className="mr-2 h-4 w-4" /> Load More
												</CommandItem>
											)}
											{!browseLoading &&
												!browseError &&
												!browseHasMore &&
												browsedFonts.length === 0 && (
													// This state means initial load succeeded (no error) but returned no fonts
													<CommandEmpty>No fonts found to browse.</CommandEmpty>
												)}
										</CommandGroup>
									)}
								</>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
