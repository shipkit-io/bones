import { Poppins as FontSans, Noto_Serif as FontSerif } from "next/font/google";

export const fontSerif = FontSerif({
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-serif",
	display: "swap",
});

export const fontSans = FontSans({
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

export interface GoogleFont {
	family: string;
	// Add other properties if needed, e.g., category, variants
}

// A curated list of popular Google Fonts
// See: https://fonts.google.com/
export const GOOGLE_FONTS: GoogleFont[] = [
	{ family: "Inter" }, // Default likely
	{ family: "Roboto" },
	{ family: "Open Sans" },
	{ family: "Lato" },
	{ family: "Montserrat" },
	{ family: "Poppins" },
	{ family: "Source Sans Pro" },
	{ family: "Oswald" },
	{ family: "Raleway" },
	{ family: "Nunito" },
	{ family: "Merriweather" },
	{ family: "Playfair Display" },
	{ family: "Ubuntu" },
	{ family: "Work Sans" },
	{ family: "Fira Sans" },
	{ family: "Noto Sans JP" }, // Example CJK font
	{ family: "Roboto Mono" }, // Example Monospace font
	{ family: "Comic Neue" }, // Example fun font
];
