// Basic usage
// https://your-site.com/api/og

// With custom title
// https://your-site.com/api/og?title=Custom%20Title

// With custom description
// https://your-site.com/api/og?description=Custom%20Description

// With light mode
// https://your-site.com/api/og?mode=light

// Full customization
// https://your-site.com/api/og?title=Custom%20Title&description=Custom%20Description&mode=dark

import { siteConfig } from "@/config/site";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#0D9373" offset="20%" />
      <stop stop-color="#07C983" offset="50%" />
      <stop stop-color="#0D9373" offset="80%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#0D9373" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) => {
	// Encode the string to base64 safely
	try {
		return Buffer.from(str).toString("base64");
	} catch (error) {
		console.error("Error encoding to base64:", error);
		return Buffer.from("").toString("base64");
	}
};

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);

		// Get dynamic values from URL params or use defaults
		const title = searchParams.get("title") ?? siteConfig.title;
		const description = searchParams.get("description") ?? siteConfig.description;
		const mode = (searchParams.get("mode") ?? "dark") as "dark" | "light";

		// Create shimmer effect
		const shimmerDataUrl = `data:image/svg+xml;base64,${toBase64(
			shimmer(1200, 630)
		)}`;

		// Font loading
		// const interSemiBold = await fetch(
		// 	new URL("../../../public/fonts/Inter-SemiBold.ttf", import.meta.url)
		// ).then((res) => res.arrayBuffer());

		// const interMedium = await fetch(
		// 	new URL("../../../public/fonts/Inter-Medium.ttf", import.meta.url)
		// ).then((res) => res.arrayBuffer());

		return new ImageResponse(
			(
				<div
					style={{
						height: "100%",
						width: "100%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						backgroundColor: mode === "dark" ? "#000" : "#fff",
						backgroundImage: `url(${shimmerDataUrl})`,
						backgroundSize: "cover",
					}}
				>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							backgroundColor: mode === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
							padding: "40px 60px",
							borderRadius: "20px",
							maxWidth: "80%",
						}}
					>
						<h1
							style={{
								fontSize: 60,
								fontFamily: "Inter SemiBold",
								color: mode === "dark" ? "#fff" : "#000",
								lineHeight: 1.2,
								textAlign: "center",
								marginBottom: 20,
							}}
						>
							{title}
						</h1>
						<p
							style={{
								fontSize: 30,
								fontFamily: "Inter Medium",
								color: mode === "dark" ? "#ccc" : "#666",
								textAlign: "center",
								margin: 0,
							}}
						>
							{description}
						</p>
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
				// fonts: [
				// 	{
				// 		name: "Inter SemiBold",
				// 		data: interSemiBold,
				// 		style: "normal",
				// 	},
				// 	{
				// 		name: "Inter Medium",
				// 		data: interMedium,
				// 		style: "normal",
				// 	},
				// ],
			}
		);
	} catch (error) {
		console.error("Error generating OG image:", error);
		return new Response("Failed to generate OG image", { status: 500 });
	}
}
