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
  const theme = searchParams.get("theme") === "light" ? "light" : "dark";

  const isDark = theme === "dark";
  const colors = {
    bg: isDark ? "#000000" : "#ffffff",
    fg: isDark ? "#ffffff" : "#000000",
    border: isDark ? "#44403c" : "#d6d3d1",
    muted: isDark ? "#78716c" : "#57534e",
    body: isDark ? "#a8a29e" : "#57534e",
  };

  const [fonts] = await Promise.all([loadAssets()]);

  return new ImageResponse(
    <div
      // eslint-disable-next-line react/no-unknown-property
      tw="flex h-full w-full"
      style={{ fontFamily: "Geist Sans", backgroundColor: colors.bg, color: colors.fg }}
    >
      <div
        // eslint-disable-next-line react/no-unknown-property
        tw="flex absolute inset-y-0 left-16 w-px"
        style={{ borderLeft: `1px dashed ${colors.border}` }}
      />
      <div
        // eslint-disable-next-line react/no-unknown-property
        tw="flex absolute inset-y-0 right-16 w-px"
        style={{ borderLeft: `1px dashed ${colors.border}` }}
      />
      <div
        // eslint-disable-next-line react/no-unknown-property
        tw="flex absolute inset-x-0 h-px top-16"
        style={{ borderTop: `1px solid ${colors.border}` }}
      />
      <div
        // eslint-disable-next-line react/no-unknown-property
        tw="flex absolute inset-x-0 h-px bottom-16"
        style={{ borderTop: `1px solid ${colors.border}` }}
      />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <div tw="flex absolute bottom-24 right-24">
        <img src={`${origin}/app/og-logo.png`} width={80} height={80} alt="Logo" />
      </div>
      <div
        // eslint-disable-next-line react/no-unknown-property
        tw="flex absolute bottom-24 left-24 text-[32px]"
        style={{ fontWeight: 400, color: colors.muted }}
      >
        {url}
      </div>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <div tw="flex flex-col absolute w-[896px] justify-center inset-32">
        <div
          // eslint-disable-next-line react/no-unknown-property
          tw="tracking-tight grow flex flex-col justify-center leading-[1.1]"
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
          // eslint-disable-next-line react/no-unknown-property
          tw="text-[40px] leading-normal grow"
          style={{
            fontWeight: 500,
            textWrap: "balance",
            color: colors.body,
          }}
        >
          {description}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}
