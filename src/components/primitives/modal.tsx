"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { debounce } from "@/lib/utils/debounce";
import { ModalProvider } from "./modal-context";

interface DrawerDialogProps {
	asChild?: boolean;
	routeBack?: boolean;
	trigger?: React.ReactNode;
	dialogTitle?: string;
	dialogDescription?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	autoCloseOnRouteChange?: boolean;
	children: React.ReactNode;
	className?: string;
}

export function Modal({
	asChild = false,
	routeBack = false,
	trigger,
	dialogTitle,
	dialogDescription,
	open = true,
	children,
	onOpenChange,
	autoCloseOnRouteChange = true,
	className,
	...props
}: DrawerDialogProps) {
	const router = useRouter();
	const pathname = usePathname();
	const isMobile = useIsMobile();
	const [isOpen, setIsOpen] = React.useState(open);
	const closingDueToRouteChange = React.useRef(false);
	const hasHandledInitialRoute = React.useRef(false);
	const previousPathname = React.useRef(pathname);

	// Sync isOpen state with open prop when it changes
	useEffect(() => {
		setIsOpen(open);
	}, [open]);

	// Don't immediately close the modal, we need to wait for the modal to animate closed before we should navigate
	// @see https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#modals
	const debouncedRouteBack = useMemo(() => debounce(() => router.back(), 300), [router]);

	// When the route path changes (e.g., navigating from one intercepted modal to another),
	// close the current modal without triggering router.back(). This prevents canceling
	// the forward navigation initiated by the new link.
	useEffect(() => {
		if (!autoCloseOnRouteChange) return;
		if (!hasHandledInitialRoute.current) {
			hasHandledInitialRoute.current = true;
			previousPathname.current = pathname;
			return;
		}

		// Only close if pathname actually changed
		if (previousPathname.current === pathname) return;

		previousPathname.current = pathname;
		closingDueToRouteChange.current = true;
		setIsOpen(false);
		const timeoutId = window.setTimeout(() => {
			closingDueToRouteChange.current = false;
		}, 400);
		return () => window.clearTimeout(timeoutId);
	}, [pathname, autoCloseOnRouteChange]);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);

		if (onOpenChange) {
			return onOpenChange(open);
		}

		if (!open && routeBack && !closingDueToRouteChange.current) {
			debouncedRouteBack();
		}
	};

	useEffect(() => {
		return () => {
			const debounced = debouncedRouteBack as typeof debouncedRouteBack & { cancel?: () => void };
			if (typeof debounced.cancel === "function") {
				debounced.cancel();
			}
		};
	}, [debouncedRouteBack]);

	// Using Tailwind responsive classes to conditionally render Dialog or Drawer
	// md: breakpoint is typically 768px which is a common tablet/desktop breakpoint
	return (
		<>
			{/* Dialog for desktop - hidden on small screens, visible on medium and up */}
			{!isMobile ? (
				<Dialog
					onOpenChange={(open) => handleOpenChange(open)}
					open={typeof open === "undefined" ? isOpen : open}
					{...props}
				>
					{trigger && <DialogTrigger asChild={asChild}>{trigger}</DialogTrigger>}

					<DialogContent className={className}>
						<ModalProvider>
							<DialogHeader>
								{dialogTitle ? (
									<DialogTitle>{dialogTitle}</DialogTitle>
								) : (
									<DialogTitle className="sr-only">
										{dialogTitle ?? "Modal dialog window"}
									</DialogTitle>
								)}
								{dialogDescription && <DialogDescription>{dialogDescription}</DialogDescription>}
							</DialogHeader>
							{children}
						</ModalProvider>
					</DialogContent>
				</Dialog>
			) : (
				<>
					{/* Drawer for mobile - visible on small screens, hidden on medium and up */}
					<Drawer
						onOpenChange={(open) => handleOpenChange(open)}
						open={typeof open === "undefined" ? isOpen : open}
					>
						{trigger && <DrawerTrigger asChild={asChild}>{trigger}</DrawerTrigger>}
						<DrawerContent>
							<ModalProvider>
								<DrawerHeader className="text-left">
									<DrawerTitle className={dialogTitle ? "" : "sr-only"}>
										{dialogTitle ?? "Modal"}
									</DrawerTitle>
									<DrawerDescription className={dialogDescription ? "" : "sr-only"}>
										{dialogDescription ?? ""}
									</DrawerDescription>
								</DrawerHeader>
								{children}
								<DrawerFooter className="pt-2">
									<DrawerClose asChild>
										<Button type="button" variant="outline">
											Cancel
										</Button>
									</DrawerClose>
								</DrawerFooter>
							</ModalProvider>
						</DrawerContent>
					</Drawer>
				</>
			)}
		</>
	);
}
