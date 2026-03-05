"use client";
import { Builder, builder } from "@builder.io/react";
import { CTA } from "./components/modules/builder/cta";
import { Hero } from "./components/modules/builder/hero";
import { Stats } from "./components/modules/builder/stats";

builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

Builder.registerComponent(CTA, {
	name: "CTA",
	inputs: [
		{
			name: "backgroundImage",
			type: "string",
		},
		{
			name: "description",
			type: "string",
			required: true,
		},
		{
			name: "primaryButton",
			type: "object",
			hideFromUI: true,
			meta: {
				ts: "CTAButton",
			},
			required: true,
		},
		{
			name: "secondaryButton",
			type: "object",
			hideFromUI: true,
			meta: {
				ts: "CTAButton",
			},
		},
		{
			name: "title",
			type: "string",
			required: true,
		},
	],
});

// Register the Stats component
Builder.registerComponent(Stats, {
	name: "Stats",
	inputs: [
		{
			name: "title",
			type: "string",
			defaultValue: "Our Impact in Numbers",
		},
		{
			name: "subtitle",
			type: "string",
			defaultValue: "See how we are making a difference",
		},
		{
			name: "columns",
			type: "number",
			defaultValue: 3,
			enum: [
				{ label: "2 Columns", value: 2 },
				{ label: "3 Columns", value: 3 },
				{ label: "4 Columns", value: 4 },
			],
			helperText: "Number of columns to display stats in",
		},
		{
			name: "background",
			type: "string",
			defaultValue: "white",
			enum: ["white", "gray"],
			helperText: "Background color of the section",
		},
		{
			name: "stats",
			type: "list",
			defaultValue: [
				{
					value: "10M+",
					label: "Active Users",
					description: "Growing every day",
				},
				{
					value: "99.9%",
					label: "Uptime",
					description: "Industry-leading reliability",
				},
				{
					value: "24/7",
					label: "Support",
					description: "Always here to help",
				},
			],
			subFields: [
				{
					name: "value",
					type: "string",
				},
				{
					name: "label",
					type: "string",
				},
				{
					name: "description",
					type: "string",
				},
			],
		},
	],
});

// Register the Hero component
Builder.registerComponent(Hero, {
	name: "Hero",
	inputs: [
		{
			name: "title",
			type: "string",
			defaultValue: "Welcome to Our Platform",
		},
		{
			name: "subtitle",
			type: "string",
			defaultValue: "The best solution for your needs",
		},
		{
			name: "buttonText",
			type: "string",
			defaultValue: "Get Started",
		},
		{
			name: "buttonLink",
			type: "string",
			defaultValue: "#",
		},
		{
			name: "backgroundImage",
			type: "string",
			defaultValue: "",
		},
	],
});
