import { Button } from "@/components/ui/button";
import Link from "next/link";
import type React from "react";
import type { ReactNode } from "react";

interface CommonProps {
	className?: string;
	children: ReactNode;
}

type LinkProps = CommonProps & {
	href: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">;
type ButtonProps = CommonProps &
	Omit<React.ComponentProps<typeof Button>, "className" | "children">;

type LinkOrButtonProps = LinkProps | ButtonProps;

export const LinkOrButton = (props: LinkOrButtonProps) => {
	return "href" in props ? <Link {...props} /> : <Button {...props} />;
};
