/**
 * Static asset modules for a fresh checkout. Next writes the same declarations
 * into next-env.d.ts on the first dev or build, but `pnpm typecheck` runs before
 * that in a project created from this template.
 */
declare module "*.png" {
  const src: import("next/image").StaticImageData;
  export default src;
}
declare module "*.jpg" {
  const src: import("next/image").StaticImageData;
  export default src;
}
declare module "*.jpeg" {
  const src: import("next/image").StaticImageData;
  export default src;
}
declare module "*.webp" {
  const src: import("next/image").StaticImageData;
  export default src;
}
declare module "*.svg" {
  const src: import("next/image").StaticImageData;
  export default src;
}
