"use client";

import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";
import { useTheme } from "next-themes";
import { env } from "@/env";

interface TurnstileProps {
	onVerify: (token: string) => void;
	onError?: () => void;
	onExpire?: () => void;
	className?: string;
}

export const Turnstile = ({ onVerify, onError, onExpire, className }: TurnstileProps) => {
	const { resolvedTheme } = useTheme();
	const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

	if (!siteKey) {
		return null;
	}

	return (
		<TurnstileWidget
			siteKey={siteKey}
			onSuccess={onVerify}
			onError={onError}
			onExpire={onExpire}
			options={{
				theme: resolvedTheme === "dark" ? "dark" : "light",
			}}
			className={className}
		/>
	);
};
