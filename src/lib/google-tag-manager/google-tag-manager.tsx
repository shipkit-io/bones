import { GoogleTagManager as NextGoogleTagManager } from "@next/third-parties/google";
import { env } from "@/env";

export const GoogleTagManager = () => {
    if (!env.NEXT_PUBLIC_FEATURE_GOOGLE_TAG_MANAGER_ENABLED || !env.NEXT_PUBLIC_GOOGLE_GTM_ID) {
        return null;
    }

    return <NextGoogleTagManager gtmId={env.NEXT_PUBLIC_GOOGLE_GTM_ID} />;
};
