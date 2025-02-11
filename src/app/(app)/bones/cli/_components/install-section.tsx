"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { routes } from "@/config/routes";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { BookOpenTextIcon, Check, Copy, Terminal } from "lucide-react";
import { Bungee_Shade as FontBungee } from "next/font/google";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
const fontBungee = FontBungee({
	weight: ["400"],
	style: ["normal"],
	subsets: ["latin"],
	variable: "--font-bungee",
});

export function InstallSection() {
	const textRef = useRef<HTMLButtonElement>(null);
	const [copied, setCopied] = useState(false);
	const controls = useAnimation();
	const installCommand = 'npx shadcn@latest add "https://cli.bones.sh"';
	const isMobile = useMediaQuery("(max-width: 768px)");

	const selectText = () => {
		if (textRef.current) {
			const selection = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(textRef.current);
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
	};

	const copyToClipboard = () => {
		void navigator.clipboard.writeText(installCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	useEffect(() => {
		void controls.start({
			opacity: [0.3, 1, 0.3],
			transition: {
				repeat: Number.POSITIVE_INFINITY,
				duration: 2,
				ease: "easeInOut",
			},
		});
	}, [controls]);

	return (
		<section className={"py-20"}>
			<div className="text-center">
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<h1
						className={cn(
							"mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-4xl font-light text-transparent md:text-6xl lg:text-8xl",
							fontBungee.className
						)}
					>
						Bones CLI
					</h1>
				</motion.div>
				<motion.p
					className="mb-12 text-xl text-gray-300"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					Browse and install ShadCN UI registries without a terminal.
				</motion.p>
				<motion.div
					className="relative mb-8 overflow-hidden rounded-lg border border-gray-700 bg-gray-800/80 p-1 shadow-2xl md:p-4"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					{!isMobile && (
						<CopyButton
							value={installCommand}
							className="absolute right-2 top-2"
							successTitle="Command Copied!"
							successDescription="Paste it in your terminal to install Bones CLI."
						/>
					)}
					<div className="mb-4 hidden items-center justify-between md:flex">
						<div className="flex space-x-1">
							<div className="h-2 w-2 rounded-full bg-gray-100/40" />
							<div className="h-2 w-2 rounded-full bg-gray-100/20" />
							<div className="h-2 w-2 rounded-full bg-gray-100/20" />
						</div>
					</div>
					<div className="flex w-full flex-wrap items-center justify-center gap-2 break-all font-mono text-sm sm:text-base md:text-lg">
						{!isMobile && <Terminal className="mr-2 inline text-blue-400" />}
						<button
							ref={textRef}
							onClick={selectText}
							className="cursor-pointer text-gray-100"
							type="button"
						>
							{installCommand}
						</button>
					</div>
					<motion.div
						className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"
						animate={controls}
						initial={{ width: 0 }}
						style={{ width: "100%" }}
					/>
				</motion.div>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.6 }}
					className="flex flex-wrap justify-center gap-4"
				>
					<Button
						size="lg"
						onClick={copyToClipboard}
						className="grow bg-blue-600 text-white hover:bg-blue-700"
					>
						{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
						{copied ? "Copied!" : "Copy Command"}
					</Button>

					<Link
						href={routes.external.bones}
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"grow border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"
						)}
					>
						<BookOpenTextIcon className="mr-2 h-4 w-4" />
						Learn More
					</Link>
				</motion.div>
			</div>
		</section>
	);
}
