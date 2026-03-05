"use client";
import { Counter } from "@/components/ui/cui/counter";
import { useEffect, useState } from "react";

export default function AnimatedCounter() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		// Update the count every second by increasing random value (between 1 and 10)
		const randomDelay = Math.floor(Math.random() * 5000) + 2000;
		const interval = setInterval(() => {
			const randomValue = Math.floor(Math.random() * 10) + 1;

			setCount((prevCount) => prevCount + randomValue);
		}, randomDelay);
		return () => clearInterval(interval);
	}, []);

	return (
		<Counter
			className="space-x-3 rounded-lg border border-neutral-500/20 bg-neutral-400/15 px-2 text-2xl text-neutral-800 dark:text-neutral-200"
			numberOfDigits={4}
			paddingBetweenNumbers={30}
			value={count % 1000}
		/>
	);
}
