import { useEffect, useState } from "react";

interface CountdownResult {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	isExpired: boolean;
}

/**
 * Hook to create a countdown timer to a specific date
 * @param targetDate - The date to count down to (ISO string or Date object)
 * @returns CountdownResult object with remaining time and expiry status
 */
export const useCountdown = (targetDate: string | Date): CountdownResult => {
	const [countdown, setCountdown] = useState<CountdownResult>({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
		isExpired: false,
	});

	useEffect(() => {
		const target = new Date(targetDate).getTime();

		const calculateTimeLeft = () => {
			const now = new Date().getTime();
			const difference = target - now;

			if (difference <= 0) {
				return {
					days: 0,
					hours: 0,
					minutes: 0,
					seconds: 0,
					isExpired: true,
				};
			}

			return {
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
				hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((difference % (1000 * 60)) / 1000),
				isExpired: false,
			};
		};

		// Initial calculation
		setCountdown(calculateTimeLeft());

		// Update every second
		const timer = setInterval(() => {
			setCountdown(calculateTimeLeft());
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	return countdown;
};
