"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function Header() {
	const [darkMode, setDarkMode] = useState(false);

	useEffect(() => {
		const isDarkMode = localStorage.getItem("darkMode") === "true";
		setDarkMode(isDarkMode);
		document.documentElement.classList.toggle("dark", isDarkMode);
	}, []);

	const toggleDarkMode = () => {
		const newDarkMode = !darkMode;
		setDarkMode(newDarkMode);
		localStorage.setItem("darkMode", newDarkMode.toString());
		document.documentElement.classList.toggle("dark", newDarkMode);
	};

	return (
		<header className="py-4 px-4 md:px-6 lg:px-8">
			<div className="max-w-6xl mx-auto flex justify-between items-center">
				<div className="text-2xl font-bold">CLI Tool</div>
				<Button variant="ghost" size="icon" onClick={toggleDarkMode}>
					{darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
				</Button>
			</div>
		</header>
	);
}
