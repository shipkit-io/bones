import type { Feature } from "@/types/feature";

type FeatureContent = Omit<Feature, "id" | "order">;

export const content: FeatureContent[] = [
	// Core Technology & Performance
	{
		name: "10x Faster Development",
		description:
			"Ship in days, not months with our pre-built Next.js 15 stack. Zero runtime errors with end-to-end type safety and instant hot reload.",
		category: "core",
		plans: ["bones", "brains"],
		icon: "Zap",
	},
	{
		name: "Future-Proof Architecture",
		description:
			"Built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn/UI - the same stack used by industry leaders. Never worry about tech debt again.",
		category: "core",
		plans: ["bones", "brains"],
		icon: "Layers",
	},
	{
		name: "Enterprise Security",
		description:
			"Bank-grade security with Auth.js v5, rate limiting, and SOC2-ready infrastructure. Multi-provider authentication and GDPR compliance included.",
		category: "security",
		plans: ["brains"],
		icon: "Lock",
	},

	// Design & UI
	{
		name: "Beautiful UI Components",
		description:
			"Launch with stunning, professional designs using our pre-built Shadcn/UI components and marketing tools. Built-in SEO optimization included.",
		category: "core",
		plans: ["bones", "brains"],
		icon: "Paintbrush",
	},

	// Backend & Infrastructure
	{
		name: "Production-Ready Backend",
		description:
			"Scale confidently with PostgreSQL + Drizzle ORM. Includes automatic backups, type-safe queries, and zero-downtime deployment pipeline.",
		category: "backend",
		plans: ["brains"],
		icon: "Database",
	},
	{
		name: "Content Management",
		description:
			"Empower your team with Payload CMS and Builder.io integration. Beautiful transactional emails with Resend for reliable delivery.",
		category: "core",
		plans: ["brains"],
		icon: "FileText",
	},

	// Developer Experience
	{
		name: "Developer Happiness",
		description:
			"A development environment your team will love with VS Code integration, instant hot reload, and tools that make coding feel magical.",
		category: "dx",
		plans: ["bones", "brains"],
		icon: "Code",
	},
	{
		name: "AI-First Development",
		description:
			"Built-in OpenAI integration for task automation and AI features. Stay ahead of competitors with cutting-edge AI capabilities.",
		category: "advanced",
		plans: ["brains"],
		icon: "Brain",
	},

	// Monitoring & Analytics
	{
		name: "Complete Observability",
		description:
			"Built-in error tracking, performance monitoring, and analytics. Know exactly how your app is performing with real-time insights.",
		category: "core",
		plans: ["brains"],
		icon: "LineChart",
	},
	{
		name: "DevOps & Deployment",
		description:
			"Production-ready DevOps with Docker support and CI/CD workflows. Includes automatic backups and zero-downtime deployments.",
		category: "devops",
		plans: ["brains"],
		icon: "Rocket",
	},

	// Support & Compliance
	{
		name: "Enterprise Support",
		description:
			"Launch with confidence knowing you're GDPR compliant, WCAG accessible, and following security best practices. Ready for business.",
		category: "support",
		plans: ["brains"],
		icon: "CheckCircle",
	},
	{
		name: "Professional Email System",
		description:
			"Beautiful transactional emails that actually reach inboxes. Built-in templates and Resend integration for reliable delivery.",
		category: "core",
		plans: ["brains"],
		icon: "Mail",
	},
];
