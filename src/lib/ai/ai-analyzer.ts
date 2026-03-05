export interface CodebaseInsights {
	fileStructure: string[];
	conventions: string[];
	bestPractices: string[];
	commonPatterns: string[];
	keyConsiderations: string[];
}

/**
 * AIAnalyzer helps AI assistants analyze and understand different aspects of the codebase
 * to make better decisions and provide more accurate assistance.
 */
export class AIAnalyzer {
	/**
	 * Get insights about the codebase structure and patterns
	 */
	public getCodebaseInsights(): CodebaseInsights {
		return {
			fileStructure: [
				"App Router's file-based routing system",
				"Route groups for feature organization",
				"Parallel routes for complex layouts",
				"Intercepting routes for modals",
				"Dynamic routes for data-driven pages",
			],
			conventions: [
				"Server-first approach with React Server Components",
				"Client components marked with 'use client'",
				"Server actions for data mutations",
				"Server-side data fetching in layout and page components",
				"Component-level TypeScript types",
			],
			bestPractices: [
				"Prefer server components for better performance",
				"Use loading.tsx for Suspense boundaries",
				"Implement error.tsx for error handling",
				"Keep client bundle size minimal",
				"Use proper TypeScript types",
			],
			commonPatterns: [
				"Layout inheritance for consistent UI",
				"Route groups for feature isolation",
				"Server actions for form handling",
				"Middleware for request processing",
				"API routes for external integrations",
			],
			keyConsiderations: [
				"Server/client component boundary",
				"Data fetching patterns",
				"State management approach",
				"Performance optimization",
				"Security best practices",
			],
		};
	}

	/**
	 * Get recommended approach for implementing a feature
	 */
	public getFeatureImplementationGuide(feature: string): string[] {
		const guides: Record<string, string[]> = {
			authentication: [
				"1. Use NextAuth/AuthJS v5 for authentication",
				"2. Configure OAuth providers in auth.ts",
				"3. Implement middleware for protected routes",
				"4. Add session handling in layout components",
				"5. Use server actions for auth operations",
			],
			database: [
				"1. Define schema in server/db/schema directory",
				"2. Create migration using Drizzle CLI",
				"3. Implement service layer in server/services",
				"4. Add server actions for data operations",
				"5. Use proper error handling and validation",
			],
			api: [
				"1. Create route handler in app/api directory",
				"2. Implement request validation",
				"3. Add proper error handling",
				"4. Use middleware if needed",
				"5. Document API endpoints",
			],
			ui: [
				"1. Use Shadcn/UI components as base",
				"2. Implement responsive design with Tailwind",
				"3. Follow accessibility guidelines",
				"4. Add proper loading states",
				"5. Implement error boundaries",
			],
		};

		return (
			guides[feature] || [
				"1. Plan the feature implementation",
				"2. Review existing similar features",
				"3. Follow project conventions",
				"4. Add proper documentation",
				"5. Include tests if needed",
			]
		);
	}

	/**
	 * Get common pitfalls to avoid
	 */
	public getPitfalls(): string[] {
		return [
			"Nesting server components inside client components",
			"Using client-side data fetching when server-side is better",
			"Not handling loading and error states",
			"Mixing server and client state",
			"Not following TypeScript best practices",
			"Improper error handling in async operations",
			"Not considering performance implications",
			"Missing accessibility features",
			"Inadequate form validation",
			"Not following security best practices",
		];
	}

	/**
	 * Get recommended tools and libraries for specific tasks
	 */
	public getRecommendedTools(task: string): string[] {
		const tools: Record<string, string[]> = {
			forms: [
				"react-hook-form for form handling",
				"zod for validation",
				"Shadcn/UI form components",
			],
			state: [
				"React Context for simple state",
				"Zustand for complex state",
				"Server actions for mutations",
			],
			styling: [
				"Tailwind CSS for styling",
				"CSS Modules for component styles",
				"CSS Variables for theming",
			],
			testing: [
				"Vitest for unit testing",
				"Playwright for E2E testing",
				"Testing Library for component tests",
			],
		};

		return tools[task] || [];
	}

	/**
	 * Get performance optimization tips
	 */
	public getPerformanceOptimizations(): string[] {
		return [
			"Use React Server Components where possible",
			"Implement proper loading states with Suspense",
			"Optimize images with next/image",
			"Use proper caching strategies",
			"Minimize client-side JavaScript",
			"Implement code splitting",
			"Use proper bundling configurations",
			"Optimize database queries",
			"Use edge functions when appropriate",
			"Implement proper CDN caching",
		];
	}
}

// Export a singleton instance
export const aiAnalyzer = new AIAnalyzer();
