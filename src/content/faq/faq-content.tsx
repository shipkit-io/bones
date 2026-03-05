import { siteConfig } from "@/config/site-config";

export const content = [
	{
		question: `How is ${siteConfig.title} different from other starter kits?`,
		answer: `Unlike basic templates, ${siteConfig.title} is a complete production-ready solution used by real companies. You get enterprise features like authentication, database, AI integration, and DevOps - all pre-configured and battle-tested. Our customers typically save 3-6 months of development time.`,
		category: "general",
	},
	{
		question: "Will this work for my specific use case?",
		answer: `${siteConfig.title} is highly flexible and powers everything from SaaS apps to e-commerce sites. It's built with industry-standard tools like Next.js, TypeScript, and PostgreSQL, making it adaptable to any business need. If you're unsure, our support team can evaluate your specific requirements.`,
		category: "technical",
	},
	{
		question: "How much money will this save my company?",
		answer:
			"Our customers typically save $50,000-$150,000 in development costs and 3-6 months of time. Instead of building basic features from scratch, your team can focus on your unique business logic from day one. Plus, our enterprise-grade architecture helps prevent costly rewrites down the line.",
		category: "pricing",
	},
	{
		question: "What happens if I need help?",
		answer:
			"You get direct access to our engineering team through private Discord channels. We typically respond within hours, not days. Our detailed documentation covers everything from setup to deployment, and we regularly release video tutorials for new features.",
		category: "support",
	},
	{
		question: "Is this just another template that will need heavy modification?",
		answer: `No - ${siteConfig.title} is a production-ready platform that powers real applications today. It includes everything you need: authentication, database, file storage, emails, payments, and more. While you can customize everything, you don't have to modify anything to go live.`,
		category: "technical",
	},
	{
		question: "What if the tech stack becomes outdated?",
		answer: `We maintain ${siteConfig.title} with weekly updates, ensuring you're always using the latest stable versions of Next.js, React, and other dependencies. Our semantic versioning and clear upgrade paths mean you'll never be stuck on an old version.`,
		category: "general",
	},
	{
		question: "Can my team handle this technology?",
		answer: `If your team knows React, they can use ${siteConfig.title}. We use mainstream technologies like Next.js, TypeScript, and Tailwind - no proprietary frameworks. Plus, our detailed documentation and support ensure your team never gets stuck.`,
		category: "technical",
	},
	{
		question: "Is it worth the investment?",
		answer: `Consider this: a single developer costs $10,000+ per month. ${siteConfig.title} saves 3-6 months of development time and includes enterprise features that would take even longer to build properly. Our customers typically see ROI within their first week of using ${siteConfig.title}.`,
		category: "pricing",
	},
];
