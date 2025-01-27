import { Link } from "@/components/primitives/link-with-transition";
import { buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";
import type React from "react";
import { v4 as uuid } from "uuid";

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
			header: { label: "Resources" },
			items: [
				{ href: routes.docs, label: "Documentation" },
				{ href: routes.blog, label: "Blog" },
				{ href: routes.support, label: "Support" },
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
							if (
								item &&
								typeof item === "object" &&
								"href" in item &&
								"label" in item
							) {
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
			<div className="container relative flex w-full flex-col items-stretch gap-2xl py-2xl md:min-h-80">
				<div className="flex flex-col justify-between gap-2xl lg:flex-row">
					<div className="flex flex-col gap-2xl">
						<Link href={routes.home}>
							<h1 className="text-4xl font-bold">{siteConfig.name}</h1>
						</Link>
					</div>
					<div className="flex flex-col flex-wrap md:flex-row lg:gap-20">
						{groupElements}
					</div>
				</div>
			</div>
		</footer>
	);
};
