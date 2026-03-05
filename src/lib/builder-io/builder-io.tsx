"use client";
import { BuilderComponent, useIsPreviewing } from "@builder.io/react";
import { builder } from "@builder.io/sdk";
import DefaultErrorPage from "next/error";
import type { ComponentProps } from "react";
import { env } from "@/env";

builder.init(env.NEXT_PUBLIC_BUILDER_API_KEY!);

type BuilderPageProps = ComponentProps<typeof BuilderComponent>;

export function RenderBuilderContent(props: BuilderPageProps) {
	// Call the useIsPreviewing hook to determine if
	// the page is being previewed in Builder
	const isPreviewing = useIsPreviewing();
	// If `content` has a value or the page is being previewed in Builder,
	// render the BuilderComponent with the specified content and model props.
	if (props.content || isPreviewing) {
		return <BuilderComponent {...props} />;
	}
	// If the `content` is falsy and the page is
	// not being previewed in Builder, render the
	// DefaultErrorPage with a 404.
	return (
		<>
			<style jsx>{`
				.next-error-h1 {
					line-height: 49px;
				}
			`}</style>
			<DefaultErrorPage statusCode={404} />
		</>
	);
}
