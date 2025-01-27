/*
	OG Image Generator

	Basic usage
	https://your-site.com/og

	With custom title
	https://your-site.com/og?title=Custom%20Title

	With custom description
	https://your-site.com/og?description=Custom%20Description

	With light mode
	https://your-site.com/og?mode=light

	Full customization
	https://your-site.com/og?title=Custom%20Title&description=Custom%20Description&mode=dark
*/

import { siteConfig } from "@/config/site";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { v4 } from "uuid";

export const runtime = "edge";

// const interRegular = fetch(
// 	new URL("../../../assets/fonts/Inter-Regular.ttf", import.meta.url)
// ).then((res) => res.arrayBuffer());

// const interBold = fetch(
// 	new URL("../../../assets/fonts/Inter-Bold.ttf", import.meta.url)
// ).then((res) => res.arrayBuffer());

export async function GET(req: NextRequest) {
	try {
		// const [interRegularData, interBoldData] = await Promise.all([
		// 	interRegular,
		// 	interBold,
		// ]);

		const { searchParams } = new URL(req.url);
		const title = searchParams.get("title") ?? siteConfig.title;
		const mode = searchParams.get("mode") ?? "dark";
		const description = searchParams.get("description") ?? siteConfig.description;
		const type = searchParams.get("type") ?? "default";

		const isDark = mode === "dark";
		const bgColor = isDark ? "#000000" : "#ffffff";

		// Generate random positions for stars
		const stars = Array.from({ length: 100 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 3 + 1,
			opacity: Math.random() * 0.5 + 0.3,
		}));

		// Generate random positions for nebula clouds
		const nebulaClouds = Array.from({ length: 5 }, () => ({
			x: Math.random() * 100,
			y: Math.random() * 100,
			size: Math.random() * 300 + 200,
			rotation: Math.random() * 360,
			color: [
				"rgba(147, 51, 234, 0.1)",
				"rgba(59, 130, 246, 0.1)",
				"rgba(236, 72, 153, 0.1)",
				"rgba(16, 185, 129, 0.1)",
				"rgba(245, 158, 11, 0.1)",
			][Math.floor(Math.random() * 5)],
		}));

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
						backgroundColor: bgColor,
						position: "relative",
						overflow: "hidden",
					}}
				>
					{/* Deep Space Background */}
					<div
						style={{
							position: "absolute",
							inset: 0,
							background: isDark
								? "radial-gradient(circle at 25% 25%, rgba(17, 24, 39, 1) 0%, rgba(0, 0, 0, 1) 100%)"
								: "radial-gradient(circle at 25% 25%, rgba(243, 244, 246, 1) 0%, rgba(255, 255, 255, 1) 100%)",
						}}
					/>

					{/* Nebula Clouds */}
					{nebulaClouds.map((cloud) => (
						<div
							key={`nebula-${v4()}`}
							style={{
								position: "absolute",
								left: `${cloud.x}%`,
								top: `${cloud.y}%`,
								width: `${cloud.size}px`,
								height: `${cloud.size}px`,
								background: cloud.color,
								filter: "blur(100px)",
								transform: `rotate(${cloud.rotation}deg)`,
								opacity: 0.6,
							}}
						/>
					))}

					{/* Star Field */}
					{stars.map((star) => (
						<div
							key={`star-${v4()}`}
							style={{
								position: "absolute",
								left: `${star.x}%`,
								top: `${star.y}%`,
								width: `${star.size}px`,
								height: `${star.size}px`,
								background: isDark ? "#ffffff" : "#000000",
								borderRadius: "50%",
								opacity: star.opacity,
								boxShadow: `0 0 ${star.size * 2}px ${isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.5)"}`,
							}}
						/>
					))}

					{/* Orbital Rings */}
					<div
						style={{
							position: "absolute",
							width: "900px",
							height: "900px",
							borderRadius: "50%",
							border: `2px solid ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.1)"}`,
							transform: "rotate(-45deg)",
							boxShadow: `0 0 50px ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.1)"}`,
						}}
					/>
					<div
						style={{
							position: "absolute",
							width: "700px",
							height: "700px",
							borderRadius: "50%",
							border: `1px solid ${isDark ? "rgba(147, 51, 234, 0.2)" : "rgba(126, 34, 206, 0.1)"}`,
							transform: "rotate(45deg)",
							boxShadow: `0 0 50px ${isDark ? "rgba(147, 51, 234, 0.2)" : "rgba(126, 34, 206, 0.1)"}`,
						}}
					/>
					<div
						style={{
							position: "absolute",
							width: "500px",
							height: "500px",
							borderRadius: "50%",
							border: `3px solid ${isDark ? "rgba(236, 72, 153, 0.2)" : "rgba(219, 39, 119, 0.1)"}`,
							transform: "rotate(-15deg)",
							boxShadow: `0 0 50px ${isDark ? "rgba(236, 72, 153, 0.2)" : "rgba(219, 39, 119, 0.1)"}`,
						}}
					/>

					{/* Content Container */}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: 24,
							maxWidth: "85%",
							textAlign: "center",

							padding: "48px",
							background: isDark
								? "linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(0, 0, 0, 0.8))"
								: "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(243, 244, 246, 0.8))",
							borderRadius: "32px",
							border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(37, 99, 235, 0.2)"}`,
							boxShadow: isDark
								? "0 0 100px rgba(59, 130, 246, 0.2)"
								: "0 0 100px rgba(37, 99, 235, 0.1)",
							backdropFilter: "blur(20px)",
						}}
					>
						{/* Logo */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 20,
								position: "relative",
							}}
						>
							{/* Logo Background Glow */}
							<div
								style={{
									position: "absolute",
									inset: -20,
									background: "radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 70%)",
									filter: "blur(20px)",
								}}
							/>
							<div
								style={{
									width: 96,
									height: 96,
									// background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
									borderRadius: "24px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 48,
									position: "relative",
									boxShadow: "0 0 50px rgba(59, 130, 246, 0.5)",
								}}
							>
								🚀
								{/* Rocket Trail */}
								<div
									style={{
										position: "absolute",
										bottom: -20,
										width: "40px",
										height: "60px",
										background: "linear-gradient(to bottom, rgba(59, 130, 246, 0.5), transparent)",
										filter: "blur(10px)",
										transform: "rotate(45deg)",
									}}
								/>
							</div>
							<div
								style={{
									fontSize: 40,
									fontWeight: 800,
									background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
									backgroundClip: "text",
									color: "transparent",
									textShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
								}}
							>
								Shipkit
							</div>
						</div>

						{/* Title */}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 12,
								position: "relative",
							}}
						>
							{/* Title Glow Effect */}
							<div
								style={{
									position: "absolute",
									inset: -30,
									background: "radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%)",
									filter: "blur(20px)",
								}}
							/>
							<h1
								style={{
									fontSize: 72,
									fontWeight: 800,
									letterSpacing: "-0.05em",
									lineHeight: 1.1,
									margin: 0,
									padding: 0,
									background: isDark
										? "linear-gradient(to right, #fff, #94A3B8)"
										: "linear-gradient(to right, #000, #1E293B)",
									backgroundClip: "text",
									color: "transparent",
									textShadow: isDark
										? "0 2px 20px rgba(255, 255, 255, 0.2)"
										: "0 2px 20px rgba(0, 0, 0, 0.1)",
								}}
							>
								{title}
							</h1>
							<p
								style={{
									fontSize: 28,
									color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
									margin: 0,
									padding: 0,
									textShadow: isDark
										? "0 2px 10px rgba(0, 0, 0, 0.3)"
										: "0 2px 10px rgba(255, 255, 255, 0.3)",
								}}
							>
								{description}
							</p>
						</div>

						{/* Type Badge */}
						{type !== "default" && (
							<div
								style={{
									background: isDark
										? "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))"
										: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(126, 34, 206, 0.1))",
									padding: "10px 24px",
									borderRadius: "9999px",
									fontSize: 24,
									color: isDark ? "#60A5FA" : "#3B82F6",
									textTransform: "capitalize",
									border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "rgba(37, 99, 235, 0.2)"}`,
									boxShadow: `0 0 30px ${isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.1)"}`,
									textShadow: "0 2px 10px rgba(59, 130, 246, 0.3)",
								}}
							>
								{type}
							</div>
						)}
					</div>
				</div>
			),
			{
				width: 1200,
				height: 630,
				// fonts: [
				// 	{
				// 		name: "Inter",
				// 		data: interRegularData,
				// 		weight: 400,
				// 		style: "normal",
				// 	},
				// 	{
				// 		name: "Inter",
				// 		data: interBoldData,
				// 		weight: 700,
				// 		style: "normal",
				// 	},
				// ],
			}
		);
	} catch (e) {
		console.error(e);
		return new Response("Failed to generate image", { status: 500 });
	}
}
