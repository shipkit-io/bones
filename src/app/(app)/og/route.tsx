import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site-config";

// Convert base64 string to ArrayBuffer compatible with Edge runtime (no Node Buffer)
function base64ToArrayBuffer(base64: string): ArrayBuffer {
	const binaryString = atob(base64);
	const length = binaryString.length;
	const bytes = new Uint8Array(length);
	for (let i = 0; i < length; i++) bytes[i] = binaryString.charCodeAt(i);
	return bytes.buffer;
}

async function loadAssets(): Promise<
	{ name: string; data: ArrayBuffer; weight: 400 | 600; style: "normal" }[]
> {
	const [{ base64Font: normal }, { base64Font: mono }, { base64Font: semibold }] =
		await Promise.all([
			import("./geist-regular-otf.json").then((mod) => mod.default || mod),
			import("./geistmono-regular-otf.json").then((mod) => mod.default || mod),
			import("./geist-semibold-otf.json").then((mod) => mod.default || mod),
		]);

	return [
		{
			name: "Geist",
			data: base64ToArrayBuffer(normal),
			weight: 400 as const,
			style: "normal" as const,
		},
		{
			name: "Geist Mono",
			data: base64ToArrayBuffer(mono),
			weight: 400 as const,
			style: "normal" as const,
		},
		{
			name: "Geist",
			data: base64ToArrayBuffer(semibold),
			weight: 600 as const,
			style: "normal" as const,
		},
	];
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const origin = new URL(request.url).origin;
	const title = searchParams.get("title") ?? siteConfig.title;
	const description = searchParams.get("description") ?? siteConfig.description;
	const url = searchParams.get("url") ?? siteConfig?.url.replace(/https?:\/\//, "");

	const [fonts] = await Promise.all([loadAssets()]);

	return new ImageResponse(
		<div tw="flex h-full w-full bg-black text-white" style={{ fontFamily: "Geist Sans" }}>
			<div tw="flex border absolute border-stone-700 border-dashed inset-y-0 left-16 w-[1px]" />
			<div tw="flex border absolute border-stone-700 border-dashed inset-y-0 right-16 w-[1px]" />
			<div tw="flex border absolute border-stone-700 inset-x-0 h-[1px] top-16" />
			<div tw="flex border absolute border-stone-700 inset-x-0 h-[1px] bottom-16" />
			<div tw="flex absolute bottom-24 right-24">
				<img src={`${origin}/app/og-logo.png`} width={80} height={80} alt="Logo" />
			</div>
			<div
				tw="flex absolute bottom-24 left-24 text-stone-500 text-[32px]"
				style={{ fontWeight: 400 }}
			>
				{url}
			</div>
			<div tw="flex flex-col absolute w-[896px] justify-center inset-32">
				<div
					tw="tracking-tight flex-grow-1 flex flex-col justify-center leading-[1.1]"
					style={{
						textWrap: "balance",
						fontWeight: 600,
						fontSize: title && title.length > 20 ? 64 : 80,
						letterSpacing: "-0.04em",
					}}
				>
					{title}
				</div>
				<div
					tw="text-[40px] leading-[1.5] flex-grow-1 text-stone-400"
					style={{
						fontWeight: 500,
						textWrap: "balance",
					}}
				>
					{description}
				</div>
			</div>
		</div>,
		{
			width: 1200,
			height: 628,
			fonts,
		}
	);
}
