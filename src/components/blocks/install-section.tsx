"use client";

import { motion, useAnimation } from "framer-motion";
import { Check, Copy, Terminal } from "lucide-react";
import { Bungee_Shade as FontBungee } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/components/primitives/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import { CopyButton } from "../ui/copy-button";

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
		navigator.clipboard.writeText(installCommand);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	useEffect(() => {
		controls.start({
			opacity: [0.3, 1, 0.3],
			transition: { repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" },
		});
	}, [controls]);

	return (
		<section className={"py-20 px-4 md:px-6 lg:px-8"}>
			<div className="max-w-4xl mx-auto text-center">
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<h1
						className={cn(
							"text-4xl md:text-6xl lg:text-8xl mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 font-light",
							fontBungee.className
						)}
					>
						Bones CLI
					</h1>
				</motion.div>
				<motion.p
					className="text-xl mb-12 text-gray-300"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					Browse and install ShadCN UI registries without a terminal.
				</motion.p>
				<motion.div
					className="relative bg-gray-800/80 p-8 rounded-lg mb-8 overflow-hidden shadow-2xl border border-gray-700"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					<div className="flex items-center justify-between mb-4">
						<div className="flex space-x-2">
							<div className="w-3 h-3 rounded-full bg-gray-100/40" />
							<div className="w-3 h-3 rounded-full bg-gray-100/30" />
							<div className="w-3 h-3 rounded-full bg-gray-100/20" />
						</div>
					</div>
					<div className="flex justify-center items-center font-mono text-sm sm:text-base md:text-lg break-all w-full relative">
						<Terminal className="inline mr-2 text-blue-400" />
						<button
							ref={textRef}
							onClick={selectText}
							className="cursor-pointer text-gray-100"
							type="button"
						>
							{installCommand}
						</button>
						<CopyButton
							value={installCommand}
							className="absolute right-0"
							successTitle="Command Copied!"
							successDescription="Paste it in your terminal to install Bones CLI."
						/>
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
					className="flex justify-center space-x-4"
				>
					<Button
						size="lg"
						onClick={copyToClipboard}
						className="bg-blue-600 hover:bg-blue-700 text-white"
					>
						{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
						{copied ? "Copied!" : "Copy Command"}
					</Button>

					<Link
						href={routes.external.bones}
						className={cn(
							buttonVariants({ variant: "outline", size: "lg" }),
							"bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
						)}
					>
						Learn More
					</Link>
				</motion.div>
				<div className="mt-10 space-y-10">
					<p className="text-muted-foreground [&>a]:text-blue-400 [&>a]:underline [&>a]:font-medium">
						Run this command in your Next.js project after setting up{" "}
						<Link href={"https://ui.shadcn.com/docs/"}>ShadCN UI</Link>. If you would like to start
						with ShadCN pre-configured, check out the{" "}
						<Link href={routes.external.bones}>Bones Starter</Link>.
					</p>
					<p className="text-lg text-muted-foreground [&>a]:text-blue-400 [&>a]:underline [&>a]:font-medium">
						Get more components and ship even faster with{" "}
						<Link href={routes.external.shipkit}>Shipkit</Link>.
					</p>
				</div>
			</div>
		</section>
	);
}
