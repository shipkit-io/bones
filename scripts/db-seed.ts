// import "../scripts/env-config.js";
import { seed as seedCMS } from "@/lib/payload/seed";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed CMS collections (RBAC, Features, FAQs, Testimonials)
    await seedCMS();

    console.log("✅ Database seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

export { main as seed };

main()
  .catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
