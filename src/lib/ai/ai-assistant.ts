import { aiAnalyzer } from "./ai-analyzer";
import type { TechnologyStack } from "./ai-loader";
import { aiLoader } from "./ai-loader";

export interface ImplementationDecision {
	approach: string;
	reasoning: string[];
	considerations: string[];
	recommendations: string[];
	pitfalls: string[];
}

export interface CodeReviewGuidelines {
	general: string[];
	typescript: string[];
	nextjs: string[];
	security: string[];
	performance: string[];
	accessibility: string[];
}

/**
 * AIAssistant helps make decisions about code implementation and provides
 * guidance on best practices for the Shipkit codebase.
 */
export class AIAssistant {
	private context = aiLoader.getContext();
	private insights = aiAnalyzer.getCodebaseInsights();

	/**
	 * Get guidance on how to implement a feature
	 */
	public getImplementationGuidance(feature: string): ImplementationDecision {
		const guide = aiAnalyzer.getFeatureImplementationGuide(feature);
		const pitfalls = aiAnalyzer.getPitfalls();

		return {
			approach: guide.join("\n"),
			reasoning: [
				"Following established project patterns",
				"Maintaining consistency with existing codebase",
				"Optimizing for performance and maintainability",
				"Ensuring type safety with TypeScript",
				"Following Next.js best practices",
			],
			considerations: [
				"Server vs client component trade-offs",
				"Data fetching strategy",
				"State management approach",
				"Performance implications",
				"Security considerations",
			],
			recommendations: [
				"Start with server components by default",
				"Use TypeScript for type safety",
				"Follow existing patterns in similar features",
				"Add proper error handling",
				"Include loading states",
			],
			pitfalls: pitfalls.slice(0, 5),
		};
	}

	/**
	 * Get code review guidelines
	 */
	public getCodeReviewGuidelines(): CodeReviewGuidelines {
		return {
			general: [
				"Follow project file naming conventions",
				"Keep components focused and reusable",
				"Add proper comments explaining complex logic",
				"Use meaningful variable and function names",
				"Follow DRY principles",
			],
			typescript: [
				"Use proper TypeScript types",
				"Avoid any type",
				"Use interface for object types",
				"Add proper return types to functions",
				"Use type inference when possible",
			],
			nextjs: [
				"Prefer server components",
				"Use proper data fetching patterns",
				"Implement proper error boundaries",
				"Add loading states",
				"Follow App Router conventions",
			],
			security: [
				"Validate user input",
				"Use proper authentication checks",
				"Implement CSRF protection",
				"Follow security headers guidelines",
				"Use proper error handling",
			],
			performance: [
				"Optimize component rendering",
				"Use proper caching strategies",
				"Minimize client-side JavaScript",
				"Optimize images and assets",
				"Use proper bundling configurations",
			],
			accessibility: [
				"Add proper ARIA labels",
				"Ensure keyboard navigation",
				"Use semantic HTML",
				"Add proper focus management",
				"Follow WCAG guidelines",
			],
		};
	}

	/**
	 * Get technology-specific best practices
	 */
	public getTechnologyBestPractices(tech: keyof TechnologyStack): string[] {
		const practices: Record<keyof TechnologyStack, string[]> = {
			framework: [
				"Use App Router features effectively",
				"Follow server-first approach",
				"Implement proper error handling",
				"Use proper data fetching patterns",
				"Follow file-based routing conventions",
			],
			language: [
				"Use TypeScript features effectively",
				"Add proper type definitions",
				"Follow TypeScript best practices",
				"Use type inference when possible",
				"Avoid type assertions",
			],
			styling: [
				"Use Tailwind utility classes",
				"Follow responsive design principles",
				"Use CSS variables for theming",
				"Optimize CSS for performance",
				"Follow BEM naming convention for CSS Modules",
			],
			ui: [
				"Use Shadcn/UI components",
				"Follow accessibility guidelines",
				"Implement proper loading states",
				"Add error boundaries",
				"Use proper component composition",
			],
			state: [
				"Choose appropriate state management",
				"Use server state when possible",
				"Implement proper caching",
				"Follow immutability principles",
				"Use proper state initialization",
			],
			database: [
				"Use Drizzle ORM effectively",
				"Implement proper migrations",
				"Add database indexes",
				"Optimize queries",
				"Handle database errors",
			],
			cms: [
				"Use Payload CMS features",
				"Implement proper content types",
				"Add proper validation",
				"Use proper access control",
				"Implement proper hooks",
			],
			email: [
				"Use Resend effectively",
				"Implement proper templates",
				"Handle email errors",
				"Add proper tracking",
				"Follow email best practices",
			],
			auth: [
				"Use NextAuth features",
				"Implement proper providers",
				"Add session handling",
				"Use proper middleware",
				"Follow security best practices",
			],
			packageManager: [
				"Use Bun effectively",
				"Manage dependencies properly",
				"Use proper scripts",
				"Follow lockfile practices",
				"Optimize build process",
			],
		};

		return practices[tech] || [];
	}

	/**
	 * Get file structure recommendations
	 */
	public getFileStructureRecommendations(feature: string): string[] {
		const baseDir = this.context.structure.root;
		const recommendations: Record<string, string[]> = {
			page: [
				`${baseDir}app/(feature)/page.tsx - Main page component`,
				`${baseDir}app/(feature)/layout.tsx - Layout component`,
				`${baseDir}app/(feature)/loading.tsx - Loading state`,
				`${baseDir}app/(feature)/error.tsx - Error boundary`,
				`${baseDir}app/(feature)/_components/* - Page components`,
			],
			api: [
				`${baseDir}app/api/(feature)/route.ts - API route handler`,
				`${baseDir}server/actions/(feature).ts - Server actions`,
				`${baseDir}server/services/(feature)-service.ts - Service layer`,
				`${baseDir}server/db/schema/(feature).ts - Database schema`,
			],
			component: [
				`${baseDir}components/ui/(name)/(name).tsx - Component`,
				`${baseDir}components/ui/(name)/(name).test.tsx - Tests`,
				`${baseDir}components/ui/(name)/(name).stories.tsx - Stories`,
			],
		};

		return recommendations[feature] || [];
	}

	/**
	 * Get security guidelines
	 */
	public getSecurityGuidelines(): string[] {
		return [
			"Validate all user input",
			"Use proper authentication and authorization",
			"Implement CSRF protection",
			"Follow security headers best practices",
			"Use proper error handling",
			"Implement rate limiting",
			"Use proper session management",
			"Follow secure coding practices",
			"Implement proper logging",
			"Use proper encryption",
		];
	}
}

// Export a singleton instance
export const aiAssistant = new AIAssistant();
