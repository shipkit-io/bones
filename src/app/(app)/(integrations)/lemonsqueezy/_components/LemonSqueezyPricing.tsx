import { fetchConfiguredLemonSqueezyProducts } from "@/lib/lemonsqueezy/lemonsqueezy";

interface LemonProduct {
	id: string;
	productKey?: string;
	attributes: {
		name: string;
		price_formatted: string;
		description: string;
		buy_now_url: string;
	};
}

export const LemonSqueezyProductPricing = async () => {
	try {
		// Fetch configured variants (not products) from Lemon Squeezy
		// This ensures we only show products configured in our site config
		// and that they have the correct checkout URLs
		const products = (await fetchConfiguredLemonSqueezyProducts()) as LemonProduct[];

		if (!products.length) {
			return <div>No pricing plans available.</div>;
		}

		return (
			<section className="py-24 text-neutral-800 dark:text-neutral-50 lg:pb-32">
				<div className="container mx-auto px-4">
					<div className="flex flex-wrap *:mx-auto">
						{products.map((product) => (
							<div key={product.id} className="w-full p-6 md:w-1/2 lg:w-1/3">
								<div className="h-full transform-gpu rounded-2xl border border-neutral-300 bg-white transition duration-500 hover:scale-105 dark:border-neutral-600 dark:bg-neutral-900">
									<div className="border-b border-neutral-300 p-12 dark:border-neutral-600">
										<div className="pr-9">
											<h4 className="mb-6 text-6xl tracking-tighter">{product.attributes.name}</h4>
											<p className="mb-2 text-xl font-semibold tracking-tight">
												{product.attributes.price_formatted}
											</p>
											<p className="tracking-tight">{product.attributes.description}</p>
										</div>
									</div>
									<div className="p-12 pb-11">
										<a
											href={product.attributes.buy_now_url}
											className="inline-block w-full rounded-lg border border-neutral-700 bg-transparent px-5 py-4 text-center font-semibold tracking-tight transition duration-200 hover:scale-105 hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-800"
											data-variant-id={product.id}
											data-product-key={product.productKey}
										>
											Get {product.attributes.name}
										</a>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		);
	} catch (error) {
		console.error("Error fetching Lemon Squeezy products:", error);
		return <div>Error loading pricing information.</div>;
	}
};
