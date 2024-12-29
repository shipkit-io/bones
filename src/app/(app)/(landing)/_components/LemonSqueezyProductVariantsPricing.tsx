import {
  PricingSection,
  type PricingTier,
} from "@/components/blocks/pricing-section";
import { fetchProductVariants } from "@/lib/lemonsqueezy";

const priceToString = (price: number) => `${price.toFixed(2)}`;

export const LemonSqueezyProductVariantsPricing = async () => {
  try {
    // Fetch product variants from Lemon Squeezy
    const productId = "383549"; // Updated product ID
    const variants = await fetchProductVariants(productId);

    if (!variants.length) {
      return <div>No variants available.</div>;
    }

    const [defaultVariant, ...otherVariants] = variants;

    // Transform product variants to match the Tier interface
    const pricingTiers: PricingTier[] = otherVariants.map((variant) => ({
      name: variant.attributes.name,
      price: (
        <>
          <span className="p-1 align-super text-lg font-normal text-gray-600">
            $
          </span>
          {priceToString(variant.attributes.price / 100)}
        </>
      ),
      description: variant.attributes.description,
      cta: `Choose ${variant.attributes.name}`,
      href: `https://shipkit.lemonsqueezy.com/buy/${variant.attributes.slug}`,
      highlighted:
        variant.attributes.price === defaultVariant?.attributes.price,
    }));

    return (
      <section className="px-4 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-3xl font-bold">
            Simple, Transparent Pricing
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
    console.error("Error fetching product variants:", error);
    return <div>Error loading pricing information.</div>;
  }
};
