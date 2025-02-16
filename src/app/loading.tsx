/* Loading Component
 * This is a special Next.js file that shows during page transitions and loading states
 * @see https://nextjs.org/docs/app/building-your-application/routing/loading-ui
 */
import { Loading } from "@/components/ui/loading";

export default function LoadingComponent() {
	return (
		<Loading
			fullPage // Makes the loading spinner take up the full viewport
			backdrop // Adds a semi-transparent background overlay
			fade // Enables a smooth fade in/out animation
		/>
	);
}
