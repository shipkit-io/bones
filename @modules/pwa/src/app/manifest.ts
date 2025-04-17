import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site-config";
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
                src: "/favicon/web-app-manifest-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/favicon/web-app-manifest-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/favicon/web-app-manifest-512x512.png",
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
                src: "/assets/screenshots/screenshot-desktop.png", // Updated path
                sizes: "1280x720",
                type: "image/png",
                form_factor: "wide", // Indicates this is for wide screens (desktop)
                label: `Desktop view of ${siteConfig.branding.projectName}`,
            },
            {
                src: "/assets/screenshots/screenshot-mobile.png", // Updated path
                sizes: "720x1280",
                type: "image/png",
                form_factor: "narrow", // Indicates this is for narrow screens (mobile)
                label: `Mobile view of ${siteConfig.branding.projectName}`,
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
        // 		description: `View ${siteConfig.branding.projectName} documentation`,
        // 		url: routes.docs,
        // 		icons: [{ src: "/icons/docs.png", sizes: "192x192" }],
        // 	},
        // 	{
        // 		name: "Examples",
        // 		short_name: "Examples",
        // 		description: `View ${siteConfig.branding.projectName} examples`,
        // 		url: routes.examples.root,
        // 		icons: [{ src: "/icons/examples.png", sizes: "192x192" }],
        // 	},
        // ],

        /* Web Share Target
         * Allows the app to receive shared content from other apps
         * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
         */
        share_target: {
            action: "/share",
            method: "POST", // Changed from GET to POST
            enctype: "application/x-www-form-urlencoded", // Added enctype for POST
            params: {
                title: "title",
                text: "text",
                url: "url",
            },
        },

        /* Custom Protocol Handlers
         * Allows the app to handle custom URL schemes
         * @see https://developer.mozilla.org/en-US/docs/Web/Manifest/protocol_handlers
         */
        protocol_handlers: [
            {
                protocol: siteConfig.branding.protocol, // Custom protocol scheme
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
