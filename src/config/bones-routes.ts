// Relative import on purpose: next.config.ts imports this file and Next's
// config transpiler does not resolve the @/ alias in transitive imports.
import { routes } from "./routes";

/**
 * Pages that exist only in Bones.
 *
 * `src/config/routes.ts` is shared with ShipKit byte for byte (the
 * @shipkit/routes-config registry item overwrites it on install), so Bones'
 * own pages keep their paths here instead of in that file.
 */
export const bonesRoutes = {
  about: "/about",
  cli: "/cli",
  cliWww: "/bones/cli-www",
  changelog: "/changelog",
} as const;

/**
 * Every public page Bones ships, in sitemap order. The sitemap emits only
 * these so it never advertises a route that has no page (LAC-2783).
 */
export const bonesPages: string[] = [
  routes.home,
  routes.features,
  bonesRoutes.cli,
  bonesRoutes.cliWww,
  bonesRoutes.changelog,
  bonesRoutes.about,
  routes.faq,
  routes.contact,
  routes.terms,
  routes.privacy,
  routes.eula,
  routes.legal,
];

/**
 * Auth utility pages are excluded from the sitemap; mark them noindex so
 * crawlers agree (Ahrefs "Indexable page not in sitemap", LAC-3521). The
 * auth layout is a shared ShipKit file, so the policy rides on a response
 * header from next.config.ts instead of layout metadata.
 */
export const noIndexPaths: string[] = [
  routes.auth.signIn,
  routes.auth.signUp,
  routes.auth.signOut,
  routes.auth.forgotPassword,
  routes.auth.resetPassword,
  routes.auth.error,
];

export const noIndexHeaders = () =>
  noIndexPaths.map((source) => ({
    source,
    headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
  }));
