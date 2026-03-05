/**
 * Isolated Payload root layout wrapper.
 *
 * All @payloadcms imports live here so they are only resolved when this
 * module is actually imported (i.e. when Payload is enabled).  The parent
 * layout.tsx conditionally `import()`s this file at runtime, keeping the
 * heavy / CSS-bearing Payload packages out of the bundle when the feature
 * flag is off.
 */

import config from "@payload-config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import type React from "react";
import { importMap } from "./cms/importMap.js";

const serverFunction: ServerFunctionClient = async (args) => {
	"use server";
	return handleServerFunctions({
		...args,
		config,
		importMap,
	});
};

export default function PayloadRootLayout({ children }: { children: React.ReactNode }) {
	return (
		<RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
			{children}
		</RootLayout>
	);
}
