// import { routes } from "@/config/routes"; // No longer needed directly

import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site-config";

export default function manifest(): MetadataRoute.Manifest {
	return {
		/* Basic Application Information
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest#name
		 */
		name: `${siteConfig.title} - ${siteConfig.tagline}`,
		short_name: siteConfig.title,
		description: siteConfig.description, // Description shown in app stores and install prompts

		/* Application Entry Points and Identification
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/start_url
		 */
		start_url: siteConfig.manifest.startUrl, // Use config value
		id: siteConfig.manifest.startUrl, // Use config value

		/* Display and UI Settings
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/display
		 */
		display: siteConfig.manifest.display, // Use config value
		display_override: siteConfig.manifest.displayOverride, // Use config value

		/* Theme and Color Settings
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/theme_color
		 */
		background_color: siteConfig.metadata.themeColor.light, // Use config value
		theme_color: siteConfig.metadata.themeColor.dark, // Use config value

		/* Device and Locale Settings
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/orientation
		 */
		orientation: siteConfig.manifest.orientation, // Use config value
		categories: siteConfig.manifest.categories, // Use config value
		dir: siteConfig.manifest.dir, // Use config value
		lang: siteConfig.manifest.lang, // Use config value

		/* Installation and Platform Preferences
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/prefer_related_applications
		 */
		prefer_related_applications: siteConfig.manifest.preferRelatedApplications, // Use config value
		scope: siteConfig.manifest.scope, // Use config value

		/* Launch Behavior
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/launch_handler
		 */
		launch_handler: siteConfig.manifest.launchHandler, // Use config value

		/* App Icons
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/icons
		 */
		icons: [
			{
				src: siteConfig.manifest.icons.favicon, // Use config value
				sizes: "48x48",
				type: "image/x-icon",
			},
			{
				src: siteConfig.manifest.icons.appIcon192, // Use config value
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
			{
				src: siteConfig.manifest.icons.appIcon192, // Use config value
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: siteConfig.manifest.icons.appIcon512, // Use config value
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],

		/* App Screenshots
		 * Used in app stores and install prompts to showcase the app
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/screenshots
		 * @note You need to create these screenshot files in `public/screenshots/`
		 */
		screenshots: [
			{
				src: "/app/screenshots/screenshot-desktop.png", // Updated path
				sizes: "1280x720",
				type: "image/png",
				form_factor: "wide", // Indicates this is for wide screens (desktop)
				label: `Desktop view of ${siteConfig.title}`,
			},
			{
				src: "/app/screenshots/screenshot-mobile.png", // Updated path
				sizes: "720x1280",
				type: "image/png",
				form_factor: "narrow", // Indicates this is for narrow screens (mobile)
				label: `Mobile view of ${siteConfig.title}`,
			},
		],

		/* App Shortcuts (currently commented out)
		 * Provides quick access to key features from the app icon
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/shortcuts
		 */
		// shortcuts: [
		// 	{
		// 		name: "Documentation",
		// 		short_name: "Docs",
		// 		description: `View ${siteConfig.title} documentation`,
		// 		url: routes.docs,
		// 		icons: [{ src: "/icons/docs.png", sizes: "192x192" }],
		// 	},
		// 	{
		// 		name: "Examples",
		// 		short_name: "Examples",
		// 		description: `View ${siteConfig.title} examples`,
		// 		url: routes.examples.index,
		// 		icons: [{ src: "/icons/examples.png", sizes: "192x192" }],
		// 	},
		// ],

		/* Web Share Target
		 * Allows the app to receive shared content from other apps
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
		 */
		// share_target: {
		// 	action: "/share",
		// 	method: "POST", // Changed from GET to POST
		// 	enctype: "application/x-www-form-urlencoded", // Added enctype for POST
		// 	params: {
		// 		title: "title",
		// 		text: "text",
		// 		url: "url",
		// 	},
		// },

		/* Custom Protocol Handlers
		 * Allows the app to handle custom URL schemes
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/protocol_handlers
		 */
		// protocol_handlers: [
		// 	{
		// 		protocol: siteConfig.branding.protocol, // Custom protocol scheme
		// 		url: "/protocol?type=%s", // URL that handles the protocol
		// 	},
		// ],

		/* Related Applications
		 * Links to related native applications
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/related_applications
		 */
		related_applications: siteConfig.manifest.relatedApplications || [], // Use config value, ensure array
	};
}
