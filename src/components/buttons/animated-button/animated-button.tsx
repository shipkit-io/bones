import { Link } from "@/components/primitives/link";
import {
  Button,
  type ButtonProps,
  buttonVariants,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";
import styles from "./animated-button.module.css";

// Extend the ButtonHTMLAttributes to include all possible button props
interface AnimatedButtonProps
  // Todo: fix type
  extends ButtonProps {
  children: React.ReactNode;
  href?: string;
  color?: string;
}

/**
 * AnimatedButton component
 *
 * A button with an animated background effect.
 * This component wraps the base Button component and adds animation.
 * It passes all received props to the underlying Button.
 */
const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  href,
  color = "#818cf8",
  ...props
}) => {
  const Element = href ? (
    <Link
      className={cn(
        buttonVariants({ variant: "outline" }),
        `border border-transparent bg-transparent transition-all ease-in-out hover:border-[${color}] text-inherit`,
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  ) : (
    <Button
      {...props}
      className={cn(
        `border border-transparent bg-transparent px-md transition-all duration-1000 ease-in-out hover:border-[${color}] text-inherit`,
        className,
      )}
    >
      {children}
    </Button>
  );

  return (
    <div
      className={cn(
        styles.buttonWrapper,
        `relative z-0 flex min-h-9 items-center justify-center overflow-hidden rounded-md text-black/95 [--background:#fafafc] dark:text-white/95 dark:[--background:#000000]`,
        className,
      )}
    >
      <div
        className={cn(
          styles.animatedBackground,
          "absolute z-[-2] m-auto h-[200px] w-[200px] translate-x-[-50%] translate-y-[-50%] bg-cover bg-[0_0] bg-no-repeat",
          className,
        )}
      />
      {Element}
    </div>
  );
};

export default AnimatedButton;
