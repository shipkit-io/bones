import { Link } from "@/components/primitives/link";
import { Button } from "@/components/ui/button";
import type React from "react";

type LinkOrButtonProps = React.ComponentProps<typeof Link> &
    React.ComponentProps<typeof Button>;

export const LinkOrButton = ({ href, ...props }: LinkOrButtonProps) => {
    return href ? <Link href={href} {...props} /> : <Button {...props} />;
};
