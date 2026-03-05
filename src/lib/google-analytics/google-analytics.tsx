import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";
import { env } from "@/env";

export const GoogleAnalytics = () => {
    if (!env.NEXT_PUBLIC_FEATURE_GOOGLE_ANALYTICS_ENABLED) {
        return null;
    }

    if (!env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID) {
        return null;
    }

    return <NextGoogleAnalytics gaId={env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />;
};
