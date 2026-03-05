import { cva, type VariantProps } from "class-variance-authority";
import React, { type FC, type HTMLAttributes, type ReactNode } from "react";
import { v4 as uuid } from "uuid";
import { Link } from "@/components/primitives/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { SocialLinks } from "@/components/ui/social-links";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

interface LinkItem {
	label: string;
	href: string;
}

type FooterItem = LinkItem | ReactNode;

interface FooterGroup {
	header: {
		label: string;
		href?: string;
	};
	items: FooterItem[];
}

type FooterElement = { type: "group"; content: FooterGroup } | { type: "node"; content: ReactNode };

const defaultGroups: FooterElement[] = [
	{
		type: "group",
		content: {
			header: { label: "Product" },
			items: [
				{ href: routes.home, label: "Home" },
				{ href: routes.features, label: "Features" },
				{ href: routes.pricing, label: "Pricing" },
				{ href: routes.external.bones, label: "Bones" },
			],
		},
	},
	{
		type: "group",
		content: {
			header: { label: "Resources" },
			items: [
				{ href: routes.docs, label: "Documentation" },
				// Only include blog link when blog is enabled
				...(process.env.NEXT_PUBLIC_HAS_BLOG === "true"
					? [{ href: routes.blog, label: "Blog" }]
					: []),
				{ href: routes.contact, label: "Support" },
				{ href: routes.auth.signIn, label: "Sign in" },
			],
		},
	},
	{
		type: "group",
		content: {
			header: { label: "Legal" },
			items: [
				{ href: routes.terms, label: "Terms of Service" },
				{ href: routes.privacy, label: "Privacy Policy" },
			],
		},
	},
];

const footerStyles = cva("flex flex-col gap-lg relative", {
	variants: {
		variant: {
			default: "flex-row items-center justify-between",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

interface FooterProps extends HTMLAttributes<HTMLDivElement> {
	variant?: VariantProps<typeof footerStyles>["variant"];
	groups?: FooterElement[];
}

export const Footer: FC<FooterProps> = ({
	variant = "default",
	groups = defaultGroups,
	...props
}) => {
	const { className, ...rest } = props;

	const groupElements = groups.map((element) => {
		if (element.type === "group") {
			const group = element.content;
			return (
				<div key={uuid()} className="flex flex-col gap-4">
					{group.header.href ? (
						<Link href={group.header.href} className="mb-2 block font-semibold">
							{group.header.label}
						</Link>
					) : (
						<h3 className="mb-2 font-semibold">{group.header.label}</h3>
					)}
					<ul className="space-y-2">
						{group.items.map((item) => {
							const key = uuid();
							if (isLinkItem(item)) {
								return (
									<li key={key}>
										<Link
											className={cn(buttonVariants({ variant: "link" }), "p-0")}
											href={item.href}
										>
											{item.label}
										</Link>
									</li>
								);
							}
							return <li key={key}>{item}</li>;
						})}
					</ul>
				</div>
			);
		}
		return element.content;
	});

	return (
		<footer className={cn(footerStyles({ variant }), className)} {...rest}>
			<div className="container relative flex md:min-h-80 w-full flex-col items-stretch gap-2xl py-2xl">
				<div className="flex flex-col lg:flex-row justify-between gap-2xl">
					<div className="flex flex-col gap-4">
						<Link href={routes.home}>
							<h1 className="text-4xl font-bold">{siteConfig.title}</h1>
						</Link>
						<SocialLinks labelled className="" />
					</div>
					{/* Desktop Layout */}
					<div className="hidden md:grid w-full items-start justify-items-start md:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-xl xl:gap-2xl">
						{groupElements}
					</div>
					{/* Mobile Layout */}
					<div className="flex flex-col gap-md md:hidden w-full">
						<Accordion type="multiple" className="w-full">
							{groups
								.filter((el) => el.type === "group")
								.map((element) => {
									// We already filtered, so this cast is safe
									const group = (element as { type: "group"; content: FooterGroup }).content;
									return (
										<AccordionItem value={group.header.label} key={uuid()}>
											<AccordionTrigger className="font-semibold">
												{group.header.href ? (
													<Link href={group.header.href}>{group.header.label}</Link>
												) : (
													group.header.label
												)}
											</AccordionTrigger>
											<AccordionContent>
												<ul className="space-y-2 pt-2">
													{group.items.map((item) => {
														const key = uuid();
														if (isLinkItem(item)) {
															return (
																<li key={key}>
																	<Link
																		className={cn(
																			buttonVariants({ variant: "link" }),
																			"p-0 h-auto"
																		)}
																		href={item.href}
																	>
																		{item.label}
																	</Link>
																</li>
															);
														}
														// Render custom ReactNode items directly
														return React.isValidElement(item)
															? React.cloneElement(item, { key: key })
															: null;
													})}
												</ul>
											</AccordionContent>
										</AccordionItem>
									);
								})}
						</Accordion>
					</div>
				</div>
			</div>
		</footer>
	);
};

// Type guard for LinkItem
function isLinkItem(item: FooterItem): item is LinkItem {
	return item !== null && typeof item === "object" && "href" in item && "label" in item;
}
