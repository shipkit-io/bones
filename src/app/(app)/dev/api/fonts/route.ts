import { type NextRequest, NextResponse } from "next/server";
import { GOOGLE_FONTS } from "@/config/fonts";

interface GoogleFontApiItem {
	family: string;
	variants: string[];
	subsets: string[];
	version: string;
	lastModified: string;
	files: Record<string, string>;
	category: string;
	kind: string;
}

interface GoogleFontApiResponse {
	kind: string;
	items: GoogleFontApiItem[];
}

// Use a reasonable default or fetch from config if needed elsewhere
const DEFAULT_FALLBACK_FONTS = [
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
].join(", ");

const MAX_SEARCH_RESULTS = 25;
const BROWSE_PAGE_LIMIT = 50; // Number of fonts to return per browse page

// Cache for the full font list to avoid repeated API calls within the revalidation period
let fullFontListCache: string[] | null = null;
let lastFetchTime: number | null = null;
const CACHE_DURATION = 60 * 60 * 24 * 1000; // 24 hours in milliseconds

async function fetchAndCacheFullFontList(apiKey: string): Promise<string[]> {
	const now = Date.now();
	if (fullFontListCache && lastFetchTime && now - lastFetchTime < CACHE_DURATION) {
		// console.log('Using cached full font list.');
		return fullFontListCache;
	}

	console.log("Fetching fresh full font list from Google Fonts API...");
	const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;
	const response = await fetch(url, { next: { revalidate: 0 } }); // Use fetch cache, but revalidate immediately if stale

	if (!response.ok) {
		const errorText = await response.text();
		console.error(`Failed to fetch Google Fonts (${response.status}): ${errorText}`);
		throw new Error(`Failed to fetch Google Fonts: ${response.statusText}`);
	}

	const data: GoogleFontApiResponse = await response.json();
	fullFontListCache = data.items.map((font) => font.family);
	lastFetchTime = now;
	console.log(`Successfully fetched and cached ${fullFontListCache.length} Google Font families.`);
	return fullFontListCache;
}

export async function GET(request: NextRequest) {
	const apiKey = process.env.GOOGLE_FONTS_API_KEY;
	const searchParams = request.nextUrl.searchParams;
	const searchQuery = searchParams.get("search")?.trim().toLowerCase();
	const page = Number.parseInt(searchParams.get("page") || "1", 10);
	const limit = Number.parseInt(searchParams.get("limit") || String(BROWSE_PAGE_LIMIT), 10);

	if (!apiKey) {
		// If no API key, return the curated list as a fallback
		console.warn(
			"Google Fonts API key is missing. Falling back to curated list. Add GOOGLE_FONTS_API_KEY to .env.local to enable full font search."
		);
		const curatedFonts = GOOGLE_FONTS.map((font) => font.family);
		return NextResponse.json({
			families: curatedFonts,
			fallback: DEFAULT_FALLBACK_FONTS,
			hasMore: false,
			isCurated: true, // Add a flag to indicate fallback mode
		});
	}

	try {
		const allFamilies = await fetchAndCacheFullFontList(apiKey);

		let responseFamilies: string[] = [];
		let hasMore = false;

		if (searchQuery && searchQuery.length > 0) {
			// --- Handle Search ---
			responseFamilies = allFamilies
				.filter((family) => family.toLowerCase().includes(searchQuery))
				.slice(0, MAX_SEARCH_RESULTS);
			hasMore = false; // No pagination for search results
		} else {
			// --- Handle Browse/Pagination ---
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;
			responseFamilies = allFamilies.slice(startIndex, endIndex);
			hasMore = endIndex < allFamilies.length;
		}

		return NextResponse.json({
			families: responseFamilies,
			fallback: DEFAULT_FALLBACK_FONTS,
			hasMore, // Include pagination info
		});
	} catch (error) {
		console.error("Error processing font request:", error);
		return NextResponse.json(
			{
				families: [],
				fallback: DEFAULT_FALLBACK_FONTS,
				error: "Failed to fetch or process fonts",
				hasMore: false,
			},
			{ status: 500 }
		);
	}
}
