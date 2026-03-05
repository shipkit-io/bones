/**
 * Custom ESM loader to handle CSS imports in Node.js
 * This is needed because Payload CMS imports react-image-crop which has CSS imports
 * that Node.js ESM can't handle natively.
 *
 * Usage: NODE_OPTIONS='--import ./scripts/css-loader.mjs' next build
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./css-loader-hooks.mjs", pathToFileURL("./scripts/"));
