"use client";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import "@xterm/xterm/css/xterm.css";

interface XTermComponentProps {
	initialText?: string;
	className?: string;
}

const XTermComponent = forwardRef<
	{ write: (text: string) => void; clear: () => void },
	XTermComponentProps
>(({ initialText = "", className }, ref) => {
	const terminalRef = useRef<HTMLDivElement>(null);
	const terminalInstance = useRef<Terminal | null>(null);
	const fitAddon = useRef<FitAddon | null>(null);

	// Initialize terminal on mount
	useEffect(() => {
		if (!terminalRef.current) return;

		// Create terminal instance
		const terminal = new Terminal({
			fontFamily: "Menlo, Monaco, 'Courier New', monospace",
			fontSize: 12,
			lineHeight: 1.2,
			cursorBlink: false,
			theme: {
				background: "#000000",
				foreground: "#ffffff",
				cursor: "#ffffff",
				black: "#000000",
				red: "#e06c75",
				green: "#98c379",
				yellow: "#d19a66",
				blue: "#61afef",
				magenta: "#c678dd",
				cyan: "#56b6c2",
				white: "#abb2bf",
				brightBlack: "#5c6370",
				brightRed: "#e06c75",
				brightGreen: "#98c379",
				brightYellow: "#e5c07b",
				brightBlue: "#61afef",
				brightMagenta: "#c678dd",
				brightCyan: "#56b6c2",
				brightWhite: "#ffffff",
			},
			allowTransparency: true,
			scrollback: 1000,
			disableStdin: true,
		});

		// Create fit addon to make terminal responsive
		const fit = new FitAddon();
		terminal.loadAddon(fit);

		// Open terminal in the container
		terminal.open(terminalRef.current);
		fit.fit();

		// Store references
		terminalInstance.current = terminal;
		fitAddon.current = fit;

		// Handle window resize - refit the terminal
		const handleResize = () => {
			if (fitAddon.current) {
				setTimeout(() => {
					fitAddon.current?.fit();
				}, 10);
			}
		};

		window.addEventListener("resize", handleResize);

		// Write initial text if provided
		if (initialText) {
			terminal.write(initialText);
		} else {
			// Default welcome message
			terminal.write("\x1b[2;37m--- Terminal ready ---\x1b[0m\r\n");
		}

		// Clean up
		return () => {
			window.removeEventListener("resize", handleResize);
			terminal.dispose();
		};
	}, []);

	// Re-fit terminal when it becomes visible (tab changes, etc.)
	useEffect(() => {
		if (!fitAddon.current) return;

		const observer = new ResizeObserver(() => {
			if (fitAddon.current) {
				fitAddon.current.fit();
			}
		});

		if (terminalRef.current) {
			observer.observe(terminalRef.current);
		}

		return () => {
			if (terminalRef.current) {
				observer.unobserve(terminalRef.current);
			}
			observer.disconnect();
		};
	}, []);

	// Expose terminal methods through ref
	useImperativeHandle(ref, () => ({
		write: (text: string) => {
			if (terminalInstance.current) {
				terminalInstance.current.write(text.replace(/\n/g, "\r\n"));
			}
		},
		clear: () => {
			if (terminalInstance.current) {
				terminalInstance.current.clear();
			}
		},
		terminal: terminalInstance.current,
	}));

	return <div ref={terminalRef} className={cn("h-full w-full overflow-hidden", className)} />;
});

XTermComponent.displayName = "XTermComponent";

export default XTermComponent;
