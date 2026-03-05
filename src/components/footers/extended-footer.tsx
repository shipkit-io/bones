import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { v4 as uuid } from "uuid";
import { FeedbackPopover } from "@/components/forms/feedback-popover";
import { SubscribeForm } from "@/components/forms/subscribe-form";
import { Link } from "@/components/primitives/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import RetroGrid from "@/components/ui/retro-grid";
import SparklesText from "@/components/ui/sparkles-text";
import { TextHoverEffect } from "@/components/ui/text-hover-effect";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
import { cn } from "@/lib/utils";

type FooterItem =
	| {
			label: string;
			href: string;
	  }
	| React.ReactNode;

interface FooterGroup {
	header: {
		label: string;
		href?: string;
	};
	items: FooterItem[];
}

type FooterElement =
	| { type: "group"; content: FooterGroup }
	| { type: "node"; content: React.ReactNode };

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
			header: { label: "Resources", href: "#" },
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
				<li className="flex justify-start" key="feedback">
					<FeedbackPopover />
				</li>,
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

interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: VariantProps<typeof footerStyles>["variant"];
	groups?: FooterElement[];
}

export const Footer: React.FC<FooterProps> = ({
	variant = "default",
	groups = defaultGroups,
	...props
}) => {
	const { className, ...rest } = props;

	const groupElements = groups.map((element, index) => {
		if (element.type === "group") {
			const group = element.content;
			return (
				<div key={uuid()} className="mb-8 md:mb-0">
					{group.header.href ? (
						<Link href={group.header.href} className="mb-2 block font-semibold">
							{group.header.label}
						</Link>
					) : (
						<h3 className="mb-2 font-semibold">{group.header.label}</h3>
					)}
					<ul className="space-y-2">
						{group.items.map((item, itemIndex) => {
							if (item && typeof item === "object" && "href" in item && "label" in item) {
								return (
									<li key={uuid()}>
										<Link
											className={cn(buttonVariants({ variant: "link" }), "p-0")}
											href={item.href}
										>
											{item.label}
										</Link>
									</li>
								);
							}
							return item;
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
					<div className="flex flex-col gap-2xl">
						<Link href={routes.home}>
							<SparklesText
								duration={2}
								sparklesCount={6}
								text={siteConfig.title}
								colors={{ first: "#76676e", second: "#FA00FF" }}
							/>
						</Link>
						<SubscribeForm />
					</div>
					{/* Desktop Layout */}
					<div className="hidden md:flex flex-col md:flex-row flex-wrap lg:gap-20">
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
														if (
															item &&
															typeof item === "object" &&
															"href" in item &&
															"label" in item
														) {
															return (
																<li key={uuid()}>
																	<Link
																		className={cn(
																			buttonVariants({ variant: "link" }),
																			"p-0 h-auto" // Adjust padding/height for accordion content
																		)}
																		href={item.href}
																	>
																		{item.label}
																	</Link>
																</li>
															);
														}
														// Render custom ReactNode items directly, ensure they have keys
														return React.isValidElement(item)
															? React.cloneElement(item, { key: uuid() })
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
				<div className="hidden md:block overflow-hidden">
					<TextHoverEffect text={siteConfig.title} />
				</div>
			</div>
			<RetroGrid
				className={"hidden md:block [mask-image:linear-gradient(to_top,white,transparent)]"}
			/>
		</footer>
	);
};
