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

export type FontCategory = "sans-serif" | "serif" | "display" | "handwriting" | "monospace";

export interface GoogleFont {
  family: string;
  category: FontCategory;
}

// A curated list of popular Google Fonts
// See: https://fonts.google.com/
export const GOOGLE_FONTS: GoogleFont[] = [
  { family: "Inter", category: "sans-serif" },
  { family: "Roboto", category: "sans-serif" },
  { family: "Open Sans", category: "sans-serif" },
  { family: "Lato", category: "sans-serif" },
  { family: "Montserrat", category: "sans-serif" },
  { family: "Poppins", category: "sans-serif" },
  { family: "Source Sans Pro", category: "sans-serif" },
  { family: "Oswald", category: "sans-serif" },
  { family: "Raleway", category: "sans-serif" },
  { family: "Nunito", category: "sans-serif" },
  { family: "Merriweather", category: "serif" },
  { family: "Playfair Display", category: "serif" },
  { family: "Ubuntu", category: "sans-serif" },
  { family: "Work Sans", category: "sans-serif" },
  { family: "Fira Sans", category: "sans-serif" },
  { family: "Noto Sans JP", category: "sans-serif" },
  { family: "Roboto Mono", category: "monospace" },
  { family: "Comic Neue", category: "handwriting" },
];
