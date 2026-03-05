"use client";

import { format } from "date-fns";
import {
	CalendarDays,
	ChevronDown,
	ChevronUp,
	CreditCard,
	DollarSign,
	Mail,
	Tag,
	User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { JsonViewer } from "@/components/ui/json-viewer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { PaymentData } from "@/server/services/payment-service";

interface PaymentDrawerProps {
	payment: PaymentData | null;
	open: boolean;
	onClose: () => void;
}

export const PaymentDrawer = ({ payment, open, onClose }: PaymentDrawerProps) => {
	const [isJsonOpen, setIsJsonOpen] = useState(false);
	if (!payment) return null;

	// Determine product type label
	const getProductTypeLabel = () => {
		if (payment.isFreeProduct) {
			return { label: "Free Product", variant: "default" as const };
		}
		if (payment.amount === 0) {
			return { label: "Discounted to $0", variant: "secondary" as const };
		}
		return { label: "Paid Product", variant: "default" as const };
	};

	const productType = getProductTypeLabel();

	return (
		<Drawer open={open} onOpenChange={onClose}>
			<DrawerContent className="max-h-[90vh] flex flex-col">
				<DrawerHeader>
					<DrawerTitle>Payment Details</DrawerTitle>
					<DrawerDescription>Order ID: {payment.orderId}</DrawerDescription>
				</DrawerHeader>

				<ScrollArea className="flex-grow overflow-y-auto">
					<div className="mx-auto w-full max-w-2xl p-6">
						<div className="space-y-6">
							<section>
								<h3 className="text-lg font-semibold">Payment Information</h3>
								<div className="mt-4 grid gap-4">
									<Card className="overflow-hidden">
										<div className="bg-muted/40 p-6">
											<div className="flex items-center gap-4">
												<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
													<CreditCard className="h-8 w-8 text-primary" />
												</div>
												<div>
													<h4 className="text-xl font-medium">{payment.productName}</h4>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<DollarSign className="h-3 w-3" />
														<span className="tabular-nums">
															{new Intl.NumberFormat("en-US", {
																style: "currency",
																currency: "USD",
															}).format(
																typeof payment.amount === "string"
																	? Number.parseFloat(payment.amount)
																	: payment.amount
															)}
														</span>
													</div>
												</div>
												<div className="ml-auto flex gap-2">
													<Badge variant={productType.variant}>{productType.label}</Badge>
													<Badge
														variant={
															payment.status === "paid"
																? "default"
																: payment.status === "refunded"
																	? "destructive"
																	: "secondary"
														}
													>
														{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
													</Badge>
												</div>
											</div>
										</div>
										<CardContent className="p-0">
											<div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
												<div className="p-4">
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
															<CalendarDays className="h-5 w-5 text-primary" />
														</div>
														<div>
															<p className="text-sm font-medium text-muted-foreground">
																Purchase Date
															</p>
															<p className="font-medium">{format(payment.purchaseDate, "PPP")}</p>
														</div>
													</div>
												</div>
												<div className="p-4">
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
															<CreditCard className="h-5 w-5 text-primary" />
														</div>
														<div>
															<p className="text-sm font-medium text-muted-foreground">Processor</p>
															<Badge variant="outline" className="mt-1">
																{payment.processor}
															</Badge>
														</div>
													</div>
												</div>
												<div className="p-4">
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
															<Tag className="h-5 w-5 text-primary" />
														</div>
														<div>
															<p className="text-sm font-medium text-muted-foreground">
																Product Type
															</p>
															<Badge variant={productType.variant} className="mt-1">
																{productType.label}
															</Badge>
														</div>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</section>

							<Separator />

							{payment.userName || payment.userEmail ? (
								<section>
									<h3 className="text-lg font-semibold">Customer Information</h3>
									<div className="mt-4">
										<Card>
											<CardContent className="p-4">
												<div className="flex items-center gap-3">
													<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
														<User className="h-5 w-5 text-primary" />
													</div>
													<div>
														<p className="font-medium">{payment.userName || "Unknown"}</p>
														{payment.userEmail && (
															<div className="flex items-center gap-1 text-sm text-muted-foreground">
																<Mail className="h-3 w-3" />
																<span>{payment.userEmail}</span>
															</div>
														)}
													</div>
												</div>
											</CardContent>
										</Card>
									</div>
								</section>
							) : null}

							<Separator />

							<section>
								<Collapsible open={isJsonOpen} onOpenChange={setIsJsonOpen} className="w-full">
									<div className="flex items-center justify-end">
										<CollapsibleTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-xs text-muted-foreground"
											>
												{isJsonOpen ? (
													<>
														<ChevronUp className="h-3 w-3 mr-1" />
														<span>Raw JSON</span>
													</>
												) : (
													<>
														<ChevronDown className="h-3 w-3 mr-1" />
														<span>Raw JSON</span>
													</>
												)}
											</Button>
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent>
										<JsonViewer data={payment} className="mt-2" />
									</CollapsibleContent>
								</Collapsible>
							</section>
						</div>
					</div>
				</ScrollArea>

				<DrawerFooter className="mt-auto pt-4 border-t">
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
};
