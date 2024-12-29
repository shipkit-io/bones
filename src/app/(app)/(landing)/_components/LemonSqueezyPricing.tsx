import {
  PricingSection,
  type PricingTier,
} from "@/components/blocks/pricing-section";
import { fetchLemonSqueezyProducts } from "@/lib/lemonsqueezy";

export const LemonSqueezyProductPricing =
  async (): Promise<React.JSX.Element> => {
    try {
      // Fetch pricing variants from Lemon Squeezy
      const products = await fetchLemonSqueezyProducts();
      console.log(products);

      // Transform products to match the PricingTier interface
      const pricingTiers: PricingTier[] = products.map((product) => ({
        name: product.attributes.name,
        price: product.attributes.price_formatted, // Assuming price is in cents
        description: product.attributes.description,
        cta: `Get ${product.attributes.name}`,
        href: product.attributes.buy_now_url,
      }));

      return (
        <section className="px-4 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-2 text-center text-3xl font-bold">
              Lemon Squeezy Pricing
            </h2>
            <p className="mb-12 text-center text-xl text-gray-600">
              Choose the plan that's right for you
            </p>

            {/* Use the PricingSection component */}
            <PricingSection tiers={pricingTiers} />
          </div>
        </section>
      );
    } catch (error) {
      console.error("Error fetching Lemon Squeezy products:", error);
      return <div>Error loading pricing information.</div>;
    }
  };
