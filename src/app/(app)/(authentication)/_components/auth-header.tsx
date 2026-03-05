import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthHeaderProps {
	title: string;
	description: string;
	showAuthUnavailable: boolean;
}

export function AuthHeader({ title, description, showAuthUnavailable }: AuthHeaderProps) {
	return (
		<CardHeader className="text-center">
			<CardTitle className="text-xl">{title}</CardTitle>
			{!showAuthUnavailable && <CardDescription>{description}</CardDescription>}
		</CardHeader>
	);
}
