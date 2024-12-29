import { cn } from "@/lib/utils";
import {
	IconBrandAmazon,
	IconBrandFigma,
	IconBrandStripeFilled,
	IconBrandTesla,
	IconBrandTiktokFilled,
	IconBrandVercelFilled,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

const VercelLogo = () => (
	<svg
		height="64"
		viewBox="0 0 284 65"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M141.68 16.25c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.46 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm117.14-14.5c-11.04 0-19 7.2-19 18s8.96 18 20 18c6.67 0 12.55-2.64 16.19-7.09l-7.65-4.42c-2.02 2.21-5.09 3.5-8.54 3.5-4.79 0-8.86-2.5-10.37-6.5h28.02c.22-1.12.35-2.28.35-3.5 0-10.79-7.96-17.99-19-17.99zm-9.45 14.5c1.25-3.99 4.67-6.5 9.45-6.5 4.79 0 8.21 2.51 9.45 6.5h-18.9zm-39.03 3.5c0 6 3.92 10 10 10 4.12 0 7.21-1.87 8.8-4.92l7.68 4.43c-3.18 5.3-9.14 8.49-16.48 8.49-11.05 0-19-7.2-19-18s7.96-18 19-18c7.34 0 13.29 3.19 16.48 8.49l-7.68 4.43c-1.59-3.05-4.68-4.92-8.8-4.92-6.07 0-10 4-10 10zm82.48-29v46h-9v-46h9zM37.59.25l36.95 64H.64l36.95-64zm92.38 5l-27.71 48-27.71-48h10.39l17.32 30 17.32-30h10.39zm58.91 12v9.69c-1-.29-2.06-.49-3.2-.49-5.81 0-10 4-10 10v14.8h-9v-34h9v9.2c0-5.08 5.91-9.2 13.2-9.2z" />
	</svg>
);

const StripeLogo = () => (
	<svg
		viewBox="0 0 60 25"
		xmlns="http://www.w3.org/2000/svg"
		width="120"
		height="50"
		fill="currentColor"
	>
		<title>Stripe logo</title>
		<path
			d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z"
			fill-rule="evenodd"
		></path>
	</svg>
);

const RaycastLogo = () => (
	<svg
		height="64"
		viewBox="0 0 980 263"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M159.7 114.3l-48.4-48.4c-2.5-2.5-6.6-2.5-9.1 0l-48.4 48.4c-2.5 2.5-2.5 6.6 0 9.1l48.4 48.4c2.5 2.5 6.6 2.5 9.1 0l48.4-48.4c2.5-2.5 2.5-6.6 0-9.1z" />
	</svg>
);

const PrismaLogo = () => (
	<svg
		height="64"
		viewBox="0 0 90 90"
		fill="currentColor"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="M45 0L90 90H0L45 0z" />
	</svg>
);

const brands = [
	{ name: "Vercel", Logo: IconBrandVercelFilled },
	{ name: "Stripe", Logo: IconBrandStripeFilled },
	{ name: "Figma", Logo: IconBrandFigma },
	{ name: "Tesla", Logo: IconBrandTesla },
	{ name: "Tiktok", Logo: IconBrandTiktokFilled },
	{ name: "Amazon", Logo: IconBrandAmazon },
];

export const BrandLogos = () => {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-6">
			{brands.map(({ name, Logo }) => (
				<motion.div
					key={name}
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					whileHover={{ scale: 1.05 }}
					className={cn(
						"flex flex-col items-center justify-center gap-2",
						"grayscale transition-all duration-200 hover:grayscale-0",
						"cursor-pointer",
					)}
				>
					<Logo className="h-16 w-16" />
					<span className="text-xs text-muted-foreground">{name}</span>
				</motion.div>
			))}
		</div>
	);
};
