import type { Metadata } from "next";
import { PolarProductStatus } from "@/components/modules/payments/polar-product-status";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { constructMetadata } from "@/config/metadata";
import { env } from "@/env";
import { auth } from "@/server/auth";
import { PaymentService } from "@/server/services/payment-service";

export const metadata: Metadata = constructMetadata({
	title: "Polar Products",
	description:
		"View and manage your Polar product purchases and subscriptions.",
});

export default async function PolarProductsPage() {
	const session = await auth();

	// Define the Polar products using environment variables
	const polarProducts = [
		{
			id: env.NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID,
			name: "One-Time Purchase",
			description: "Get lifetime access to our core features and support",
			price: "$49",
			checkoutUrl: `https://polar.sh/lacy/products/${env.NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID}`,
		},
		{
			id: env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID,
			name: "Monthly Subscription",
			description: "Get monthly access to all premium features and updates",
			price: "$9.99/month",
			checkoutUrl: `https://polar.sh/lacy/subscriptions/${env.NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID}`,
		},
	].filter((product) => !!product.id); // Only include products with valid IDs

	// Get user's purchased products if logged in
	let userProducts: any[] = [];
	if (session?.user?.id) {
		userProducts = await PaymentService.getUserPurchasedProducts(
			session.user.id,
			"polar",
		);
	}

	return (
		<div className="container mx-auto py-10">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Polar Products</h1>
					<p className="text-muted-foreground">
						View and purchase products through Polar
					</p>
				</div>

				{polarProducts.length > 0 ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{polarProducts.map((product) => (
							<Card key={product.id} className="overflow-hidden">
								<CardHeader>
									<CardTitle>{product.name}</CardTitle>
									<CardDescription>{product.description}</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col gap-4">
									<p className="font-medium">{product.price}</p>

									{session?.user && product.id ? (
										<PolarProductStatus
											productId={product.id}
											productPrice={product.price}
											productName={product.name}
											checkoutUrl={product.checkoutUrl}
											buttonText="Purchase Now"
											successText="Purchased ✓"
										/>
									) : (
										<div className="text-sm text-muted-foreground">
											Please log in to purchase
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="bg-muted p-4 rounded-md">
						<p className="text-muted-foreground">
							No Polar products configured. Add
							NEXT_PUBLIC_POLAR_ONE_TIME_PRICE_ID and/or
							NEXT_PUBLIC_POLAR_SUBSCRIPTION_PRICE_ID to your environment
							variables.
						</p>
					</div>
				)}

				{session?.user && userProducts.length > 0 && (
					<div className="mt-8">
						<h2 className="text-2xl font-bold mb-4">Your Purchases</h2>
						<div className="grid gap-4">
							{userProducts.map((product) => (
								<Card key={product.id}>
									<CardContent className="pt-6">
										<div className="flex justify-between items-center">
											<div>
												<h3 className="font-semibold">{product.name}</h3>
												<p className="text-sm text-muted-foreground">
													Purchased on{" "}
													{new Date(product.purchaseDate).toLocaleDateString()}
												</p>
											</div>
											<div className="flex items-center text-green-600">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="20"
													height="20"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													className="mr-1 h-5 w-5"
												>
													<path d="M20 6L9 17l-5-5" />
												</svg>
												Active
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
