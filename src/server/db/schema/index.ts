/**
 * Database schema for Bones, split by domain.
 *
 * Every table uses the prefixed `createTable` helper from ./core so DB_PREFIX
 * applies everywhere. Unused tables cost nothing until `db:push`. Registry items
 * never ship schema files; the seams live here so `shadcn add` never has to
 * patch an existing file.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

export * from "./api-keys";
export * from "./auth";
export * from "./core";
export * from "./credits";
export * from "./deployments";
export * from "./feedback";
export * from "./payments";
export * from "./posts";
export * from "./rbac";
export * from "./teams";
export * from "./waitlist";
export * from "./webhooks";
