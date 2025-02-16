import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		/* Basic Application Information
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest#name
		 */
		name: siteConfig.title, // Full name of the application
		short_name: siteConfig.name, // Short name for app shortcuts and home screen
		description: siteConfig.description, // Description shown in app stores and install prompts

		/* Application Entry Points and Identification
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/start_url
		 */
		start_url: routes.home, // URL that loads when app is launched
		id: routes.home, // Unique identifier for the app

		/* Display and UI Settings
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/display
		 */
		display: "standalone", // App appears as standalone application (no browser UI)
		display_override: ["window-controls-overlay"], // Enables customization of title bar in PWA

		/* Theme and Color Settings
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/theme_color
		 */
		background_color: siteConfig.metadata.themeColor.light, // Background color during app load
		theme_color: siteConfig.metadata.themeColor.dark, // Theme color for OS integration

		/* Device and Locale Settings
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/orientation
		 */
		orientation: "portrait-primary", // Preferred screen orientation
		categories: ["development", "productivity", "utilities"], // App store categories
		dir: "ltr", // Text direction
		lang: "en-US", // Primary language

		/* Installation and Platform Preferences
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/prefer_related_applications
		 */
		prefer_related_applications: false, // Don't prefer native apps over this web app
		scope: "/", // Pages that are part of the PWA experience

		/* Launch Behavior
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/launch_handler
		 */
		launch_handler: {
			client_mode: ["navigate-existing", "auto"], // Controls how app launches when clicked
		},

		/* App Icons
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/icons
		 */
		icons: [
			{
				src: "/favicon.ico", // Standard favicon
				sizes: "48x48",
				type: "image/x-icon",
			},
			{
				src: "/favicon/web-app-manifest-192x192.png", // Home screen icon
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable", // Allows icon to be masked into different shapes on Android
			},
			{
				src: "/favicon/web-app-manifest-512x512.png", // Large icon for splash screens
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],

		/* App Screenshots (currently commented out)
		 * Used in app stores and install prompts to showcase the app
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/screenshots
		 */
		// screenshots: [
		// 	{
		// 		src: "/screenshots/home.png",
		// 		sizes: "1280x720",
		// 		type: "image/png",
		// 		platform: "windows",
		// 		label: "Homepage of ShipKit",
		// 	},
		// 	{
		// 		src: "/screenshots/docs.png",
		// 		sizes: "1280x720",
		// 		type: "image/png",
		// 		platform: "windows",
		// 		label: "Documentation page of ShipKit",
		// 	},
		// ],

		/* App Shortcuts (currently commented out)
		 * Provides quick access to key features from the app icon
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/shortcuts
		 */
		// shortcuts: [
		// 	{
		// 		name: "Documentation",
		// 		short_name: "Docs",
		// 		description: "View ShipKit documentation",
		// 		url: routes.docs,
		// 		icons: [{ src: "/icons/docs.png", sizes: "192x192" }],
		// 	},
		// 	{
		// 		name: "Examples",
		// 		short_name: "Examples",
		// 		description: "View ShipKit examples",
		// 		url: routes.examples.root,
		// 		icons: [{ src: "/icons/examples.png", sizes: "192x192" }],
		// 	},
		// ],

		/* Web Share Target
		 * Allows the app to receive shared content from other apps
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
		 */
		share_target: {
			action: "/share", // URL that handles shared content
			method: "GET", // HTTP method for sharing
			params: {
				title: "title", // Parameter name for shared title
				text: "text", // Parameter name for shared text
				url: "url", // Parameter name for shared URL
			},
		},

		/* Custom Protocol Handlers
		 * Allows the app to handle custom URL schemes
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/protocol_handlers
		 */
		protocol_handlers: [
			{
				protocol: "web+shipkit", // Custom protocol scheme
				url: "/protocol?type=%s", // URL that handles the protocol
			},
		],

		/* Related Applications
		 * Links to related native applications
		 * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/related_applications
		 */
		related_applications: [], // No related native apps
	};
}
