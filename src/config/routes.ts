import type { Route } from "next";
import { siteConfig } from "./site-config";
type ParamValue = string | number | null;
export type RouteParams = Record<string, ParamValue>;

export interface RouteObject {
  path: Route;
  params?: RouteParams;
}

export const createRoute = (
  path: Route,
  params: RouteParams = {},
): RouteObject => ({
  path,
  params,
});

export const routes = {
  // Public routes
  home: "/",
  features: "/features",
  cli: "/cli",
  support: `mailto:${siteConfig.email.support}`,

  // Legal routes
  terms: "/terms-of-service",
  privacy: "/privacy-policy",

  // Bones specific routes
  bones: {
    cliWww: "/bones/cli-www",
  },

  // Special routes
  og: "/og",

  // Planned/Future routes (not yet implemented)
  launch: "/launch",
  docs: "/docs",
  // blog: "/blog",
  // faq: "/faq",
  // pricing: "/pricing",
  // download: "/download",
  // components: "/components",
  // tasks: "/tasks",

  // Auth routes
  auth: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    signOut: "/sign-out",
    signOutIn: "/sign-out",
    forgotPassword: "/forgot-password",
    signInPage: "/api/auth/signin",
    signOutPage: "/api/auth/signout",
    error: "/error",
  },

  // App routes (planned/future)
  app: {
    dashboard: "/dashboard",
    settings: "/settings",
    apiKeys: "/api-keys",
  },

  // Admin routes (planned/future)
  admin: {
    root: "/admin",
  },

  // Example routes (planned/future)
  // examples: {
  //   root: "/examples",
  //   dashboard: "/examples/dashboard",
  //   forms: "/examples/forms",
  //   authentication: "/examples/authentication",
  //   notifications: "/examples/forms/notifications",
  //   profile: "/examples/forms/profile",
  // },

  // API routes
  api: {
    download: "/api/download",
    apiKeys: "/api/api-keys",
    apiKey: createRoute("/api/api-keys/:key", { key: null }),
    live: "/api/live-logs",
    sse: "/api/sse-logs",
    sendTestLog: "/api/send-test-log",
    activityStream: "/api/activity/stream",
    logger: "/v1",
    githubConnect: "/api/github/connect",
    githubDisconnect: "/api/github/disconnect",
  },

  // Worker routes
  workers: {
    logger: "/workers/workers/logger-worker.js",
  },
  // Demo routes
  demo: {
    trpc: "/trpc",
  },

  // External links
  external: {
    shipkit: `https://shipkit.io`,
    support: `https://shipkit.io/contact`,
    bones: `https://bones.sh`,
    bones_github: `https://github.com/shipkit-io/bones`,
    log: `https://log.bones.sh`,
    ui: `https://ui.bones.sh`,
    buy: siteConfig.store.format.buyUrl("shipkit"),
    discord: "https://discord.gg/XxKrKNvEje",
    twitter: siteConfig.links.twitter,
    twitter_follow: siteConfig.links.twitter_follow,
    x: siteConfig.links.x,
    x_follow: siteConfig.links.x_follow,
    website: siteConfig.creator.url,
    docs: "https://shipkit.io/docs",
    email: `mailto:${siteConfig.creator.email}`,
    github: siteConfig.repo.url,
    vercelDeployBones:
      "https://vercel.com/new/clone?repository-url=https://github.com/shipkit-io/bones&project-name=bones-app&repository-name=bones-app&redirect-url=https://shipkit.io/connect/vercel/deploy&developer-id=oac_KkY2TcPxIWTDtL46WGqwZ4BF&production-deploy-hook=Shipkit%20Deploy&demo-title=Shipkit%20Preview&demo-description=The%20official%20Shipkit%20Preview.%20A%20full%20featured%20demo%20with%20dashboards,%20AI%20tools,%20and%20integrations%20with%20Docs,%20Payload,%20and%20Builder.io&demo-url=https://shipkit.io/demo&demo-image=//assets.vercel.com/image/upload/contentful/image/e5382hct74si/4JmubmYDJnFtstwHbaZPev/0c3576832aae5b1a4d98c8c9f98863c3/Vercel_Home_OG.png",
  },
};

interface Redirect {
  source: Route;
  destination: Route;
  permanent: boolean;
}

/* eslint-disable-next-line @typescript-eslint/require-await */
export const redirects = async (): Promise<Redirect[]> => {
  return [
    // Remove docs redirects since routes.docs is not defined
    // ...createRedirects(["/docs", "/documentation"], routes.docs),
    ...createRedirects(["/join", "/signup", "/sign-up"], routes.auth.signUp),
    ...createRedirects(
      ["/login", "/log-in", "/signin", "/sign-in"],
      routes.auth.signIn,
    ),
    ...createRedirects(
      ["/logout", "/log-out", "/signout", "/sign-out"],
      routes.auth.signOut,
    ),
  ];
};

export const createRedirects = (
  sources: Route[],
  destination: Route,
  permanent = false,
): Redirect[] => {
  if (!sources.length) return [];

  return sources
    .map((source) => {
      if (source === destination) return null;
      return { source, destination, permanent };
    })
    .filter((redirect): redirect is Redirect => redirect !== null);
};
