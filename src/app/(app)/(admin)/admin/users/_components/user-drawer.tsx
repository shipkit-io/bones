"use client";

import { format } from "date-fns";
import {
	Calendar,
	ChevronDown,
	ChevronUp,
	CreditCard,
	Database,
	Loader2,
	Mail,
	Package,
	User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Purchase, UserData } from "@/server/services/payment-service";

// Type for complete user data from API
interface CompleteUserData {
	user: unknown | null;
	accounts: unknown[];
	payments: unknown[];
	deployments: unknown[];
	apiKeys: unknown[];
	credits: unknown | null;
	creditTransactions: unknown[];
	teamMemberships: unknown[];
}

// Helper to fetch complete user data via API
async function getCompleteUserData(userId: string): Promise<CompleteUserData> {
	const response = await fetch(`/api/admin/users/${userId}`);
	if (!response.ok) {
		return {
			user: null,
			accounts: [],
			payments: [],
			deployments: [],
			apiKeys: [],
			credits: null,
			creditTransactions: [],
			teamMemberships: [],
		};
	}
	return response.json();
}

interface UserDrawerProps {
	user: UserData | null;
	open: boolean;
	onClose: () => void;
}

export const UserDrawer = ({ user, open, onClose }: UserDrawerProps) => {
	const [isJsonOpen, setIsJsonOpen] = useState(false);
	const [completeData, setCompleteData] = useState<CompleteUserData | null>(
		null,
	);
	const [isLoadingCompleteData, setIsLoadingCompleteData] = useState(false);

	useEffect(() => {
		if (open && user?.id && isJsonOpen && !completeData) {
			setIsLoadingCompleteData(true);
			getCompleteUserData(user.id)
				.then(setCompleteData)
				.finally(() => setIsLoadingCompleteData(false));
		}
	}, [open, user?.id, isJsonOpen, completeData]);

	useEffect(() => {
		if (!open) {
			setCompleteData(null);
			setIsJsonOpen(false);
		}
	}, [open]);

	if (!user) return null;

	const getStatusBadgeVariant = (
		status: Purchase["status"],
		isSubscription = false,
		isActive = false,
	) => {
		if (isSubscription) {
			return isActive ? "default" : "secondary";
		}

		switch (status) {
			case "paid":
				return "default";
			case "refunded":
				return "destructive";
			case "pending":
				return "secondary";
			default:
				return "secondary";
		}
	};

	const isSubscriptionProduct = (productName: string): boolean => {
		return (
			productName.toLowerCase().includes("subscription") ||
			productName.toLowerCase().includes("monthly") ||
			productName.toLowerCase().includes("yearly") ||
			productName.toLowerCase().includes("annual")
		);
	};

	return (
		<Drawer open={open} onOpenChange={onClose}>
			<DrawerContent className="max-h-[90vh] flex flex-col">
				<DrawerHeader>
					<DrawerTitle>User Details</DrawerTitle>
					<DrawerDescription>
						Detailed information about {user.name ?? user.email}
					</DrawerDescription>
				</DrawerHeader>

				<ScrollArea className="flex-grow overflow-y-auto">
					<div className="mx-auto w-full max-w-2xl p-6">
						<div className="space-y-6">
							<section>
								<h3 className="text-lg font-semibold">Basic Information</h3>
								<div className="mt-4 grid gap-4">
									<Card className="overflow-hidden">
										<div className="bg-muted/40 p-6">
											<div className="flex items-center gap-4">
												<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
													<User className="h-8 w-8 text-primary" />
												</div>
												<div>
													<h4 className="text-xl font-medium">
														{user.name || "Unnamed User"}
													</h4>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Mail className="h-3 w-3" />
														<span>{user.email}</span>
													</div>
												</div>
											</div>
										</div>
										<CardContent className="p-0">
											<div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
												<div className="p-4">
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
															<Calendar className="h-5 w-5 text-primary" />
														</div>
														<div>
															<p className="text-sm font-medium text-muted-foreground">
																Joined
															</p>
															<p className="font-medium">
																{format(user.createdAt, "PPP")}
															</p>
														</div>
													</div>
												</div>
												<div className="p-4">
													<div className="flex items-center gap-3">
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
															<CreditCard className="h-5 w-5 text-primary" />
														</div>
														<div>
															<p className="text-sm font-medium text-muted-foreground">
																Status
															</p>
															<Badge
																variant={user.hasPaid ? "default" : "secondary"}
																className="mt-1"
															>
																{user.hasPaid ? "Paid Customer" : "Not Paid"}
															</Badge>
														</div>
													</div>
												</div>
											</div>
											{user.id && (
												<div className="border-t p-4">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-2 text-sm text-muted-foreground">
															<span>User ID:</span>
															<code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
																{user.id}
															</code>
														</div>
														<Button
															variant="ghost"
															size="sm"
															className="h-7 gap-1"
															asChild
														>
															<a
																href={`mailto:${user.email}`}
																target="_blank"
																rel="noopener noreferrer"
															>
																<Mail className="h-3.5 w-3.5" />
																<span className="text-xs">Contact</span>
															</a>
														</Button>
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								</div>
							</section>

							<Separator />

							<section>
								<h3 className="text-lg font-semibold">Payment Information</h3>
								<div className="mt-4 grid gap-4">
									<Card>
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Payment Status
													</p>
													<Badge
														variant={user.hasPaid ? "default" : "secondary"}
													>
														{user.hasPaid ? "Paid" : "Not Paid"}
													</Badge>
												</div>
												<div className="text-right">
													<p className="text-sm font-medium text-muted-foreground">
														Total Purchases
													</p>
													<p className="text-2xl font-bold">
														{user.totalPurchases}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardContent className="p-4">
											<div className="flex items-center justify-between">
												<div>
													<p className="text-sm font-medium text-muted-foreground">
														Subscription Status
													</p>
													{user.hasActiveSubscription ? (
														<Badge variant="default">Subscribed</Badge>
													) : user.hadSubscription ? (
														<Badge variant="secondary">Inactive</Badge>
													) : (
														<Badge variant="outline">None</Badge>
													)}
												</div>
												<div className="text-right">
													<p className="text-sm font-medium text-muted-foreground">
														Last Purchase
													</p>
													<p className="text-lg">
														{user.lastPurchaseDate
															? format(user.lastPurchaseDate, "PPP")
															: "No purchases"}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</div>
							</section>

							<Separator />

							<section>
								<div className="mb-4 flex items-center justify-between">
									<h3 className="text-lg font-semibold">Purchase History</h3>
									{user.purchases && user.purchases.length > 0 && (
										<Button variant="outline" size="sm">
											<Package className="mr-2 h-4 w-4" />
											Export History
										</Button>
									)}
								</div>

								{user.purchases && user.purchases.length > 0 ? (
									<Card>
										<div className="p-4 border-b">
											<div className="flex flex-wrap gap-3">
												<Badge variant="outline" className="px-3 py-1">
													Total: {user.totalPurchases} purchase
													{user.totalPurchases !== 1 ? "s" : ""}
												</Badge>
												{user.providerStatuses?.lemonsqueezy && (
													<Badge variant="outline" className="px-3 py-1">
														<CreditCard className="h-4 w-4 mr-1 text-yellow-500" />
														LemonSqueezy
													</Badge>
												)}
												{user.providerStatuses?.polar && (
													<Badge variant="outline" className="px-3 py-1">
														<CreditCard className="h-4 w-4 mr-1 text-blue-500" />
														Polar
													</Badge>
												)}
												{user.hasActiveSubscription ? (
													<Badge variant="default" className="px-3 py-1">
														Subscribed
													</Badge>
												) : user.hadSubscription ? (
													<Badge variant="secondary" className="px-3 py-1">
														Subscription Inactive
													</Badge>
												) : null}
											</div>
										</div>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Product</TableHead>
													<TableHead>Date</TableHead>
													<TableHead>Amount</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Provider</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{user.purchases.map((purchase) => (
													<TableRow key={purchase.id}>
														<TableCell>
															<div>
																<p className="font-medium">
																	{purchase.productName}
																</p>
																{purchase.variantName && (
																	<p className="text-xs text-muted-foreground">
																		Variant: {purchase.variantName}
																	</p>
																)}
																<p className="text-xs text-muted-foreground">
																	Order: {purchase.orderId}
																</p>
															</div>
														</TableCell>
														<TableCell>
															{format(purchase.purchaseDate, "PPP")}
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-2">
																<CreditCard className="h-4 w-4 text-muted-foreground" />
																${purchase.amount.toFixed(2)}
															</div>
														</TableCell>
														<TableCell>
															{(() => {
																const isSubscription = isSubscriptionProduct(
																	purchase.productName,
																);
																// Check if this specific purchase is an active subscription
																const isActive =
																	isSubscription &&
																	user.hasActiveSubscription &&
																	user.purchases
																		?.filter(
																			(p) =>
																				isSubscriptionProduct(p.productName) &&
																				p.status === "paid",
																		)
																		.slice(-1)[0]?.id === purchase.id;

																if (isSubscription) {
																	return (
																		<Badge
																			variant={
																				isActive ? "default" : "secondary"
																			}
																		>
																			{isActive ? "Subscribed" : "Inactive"}
																		</Badge>
																	);
																}

																return (
																	<Badge
																		variant={getStatusBadgeVariant(
																			purchase.status,
																		)}
																	>
																		{purchase.status.charAt(0).toUpperCase() +
																			purchase.status.slice(1)}
																	</Badge>
																);
															})()}
														</TableCell>
														<TableCell>
															{purchase.processor ? (
																<Badge variant="outline">
																	{purchase.processor.charAt(0).toUpperCase() +
																		purchase.processor.slice(1)}
																</Badge>
															) : (
																<Badge variant="outline">Unknown</Badge>
															)}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</Card>
								) : (
									<Card>
										<CardContent className="flex flex-col items-center justify-center py-6 text-center">
											<Package className="mb-2 h-8 w-8 text-muted-foreground" />
											<p className="text-sm text-muted-foreground">
												No purchase history available
											</p>
										</CardContent>
									</Card>
								)}
							</section>

							<Separator />

							<section>
								<Collapsible
									open={isJsonOpen}
									onOpenChange={setIsJsonOpen}
									className="w-full"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Database className="h-4 w-4" />
											<span>Complete Database Records</span>
										</div>
										<CollapsibleTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-xs text-muted-foreground"
											>
												{isJsonOpen ? (
													<>
														<ChevronUp className="h-3 w-3 mr-1" />
														<span>Hide Raw Data</span>
													</>
												) : (
													<>
														<ChevronDown className="h-3 w-3 mr-1" />
														<span>Show Raw Data</span>
													</>
												)}
											</Button>
										</CollapsibleTrigger>
									</div>
									<CollapsibleContent>
										{isLoadingCompleteData ? (
											<div className="flex items-center justify-center py-8">
												<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
												<span className="ml-2 text-sm text-muted-foreground">
													Loading complete user data...
												</span>
											</div>
										) : completeData ? (
											<div className="mt-4 space-y-4">
												<div className="flex flex-wrap gap-2 text-xs">
													<Badge variant="outline">
														{completeData.accounts.length} Account(s)
													</Badge>
													<Badge variant="outline">
														{completeData.payments.length} Payment(s)
													</Badge>
													<Badge variant="outline">
														{completeData.deployments.length} Deployment(s)
													</Badge>
													<Badge variant="outline">
														{completeData.apiKeys.length} API Key(s)
													</Badge>
													<Badge variant="outline">
														{completeData.teamMemberships.length} Team(s)
													</Badge>
												</div>
												<JsonViewer data={completeData} className="mt-2" />
											</div>
										) : (
											<div className="flex items-center justify-center py-8">
												<span className="text-sm text-muted-foreground">
													Click to load complete user data
												</span>
											</div>
										)}
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
