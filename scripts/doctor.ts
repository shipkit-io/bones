/**
 * shipkit doctor
 *
 * Prints which features are on, which are waiting on a key, and which key is
 * missing. Reads `.env.local` then `.env` (neither is required), evaluates the
 * feature table in `src/config/features-table.ts`, and prints one table.
 *
 *   bun scripts/doctor.ts
 *   npx tsx scripts/doctor.ts
 *
 * It is a report, not a gate: exit code is always 0 and no value is ever printed.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

// Load env files before the feature module runs, since it reads process.env at import.
const loaded: string[] = [];
for (const file of [".env.local", ".env"]) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;
  // Earlier files win: dotenv never overwrites a key that is already set.
  loadDotenv({ path, quiet: true });
  loaded.push(file);
}

const { FEATURE_DEFINITIONS, FEATURE_KEYS, computeBuildTimeFeatures, featureFlagName } =
  await import("../src/config/features-config");

type Key = (typeof FEATURE_KEYS)[number];
type Status = "on" | "waiting" | "off";

interface Report {
  status: Status;
  /** What to do next, one short phrase. */
  detail: string;
  /** Keys still needed, used when another feature depends on this one. */
  missing: string[];
}

const env = process.env;
const flags = computeBuildTimeFeatures(env);
const isSet = (name: string) => typeof env[name] === "string" && env[name].trim().length > 0;
const isTrue = (name: string) =>
  ["true", "1", "yes", "on", "enable", "enabled"].includes(env[name]?.toLowerCase().trim() ?? "");

const reports = new Map<Key, Report>();

function report(key: Key): Report {
  const cached = reports.get(key);
  if (cached) return cached;
  const def = FEATURE_DEFINITIONS[key];
  let result: Report;

  if (flags[featureFlagName(key)]) {
    result = { status: "on", detail: def.devOnly ? "development only" : "", missing: [] };
  } else if (def.disable && isTrue(def.disable)) {
    result = { status: "off", detail: `${def.disable} is set`, missing: [] };
  } else if (def.devOnly && env.NODE_ENV === "production") {
    result = { status: "off", detail: "development only", missing: [] };
  } else {
    const missing: string[] = [];
    const needs: string[] = [];
    let intent = false;

    if (def.env) {
      if ("any" in def.env) {
        if (def.env.any.some(isSet)) intent = true;
        else missing.push(def.env.any.join(" or "));
      } else {
        const unset = def.env.filter((name) => !isSet(name));
        if (unset.length < def.env.length) intent = true;
        missing.push(...unset);
      }
    }
    if (def.enable) {
      if (isTrue(def.enable)) intent = true;
      else missing.push(`${def.enable}=true`);
    }
    for (const dep of def.requires ?? []) {
      const sub = report(dep);
      if (sub.status === "on") continue;
      // A dependency that is waiting makes this feature waiting too, on the same keys.
      if (sub.status === "waiting") intent = true;
      if (sub.missing.length > 0) missing.push(...via(sub.missing, dep));
      else needs.push(`${FEATURE_DEFINITIONS[dep].label} on`);
    }
    if (def.anyOf) {
      const alternatives: string[] = [];
      for (const alt of def.anyOf) {
        if (typeof alt === "string") {
          const sub = report(alt);
          if (sub.status === "waiting") {
            intent = true;
            missing.push(...via(sub.missing, alt));
          }
          alternatives.push(FEATURE_DEFINITIONS[alt].label);
        } else if ("any" in alt) {
          if (alt.any.some(isSet)) intent = true;
          alternatives.push(alt.any.join(" or "));
        } else if ("env" in alt) {
          if (alt.env.some(isSet)) intent = true;
          alternatives.push(alt.env.join(", "));
        } else {
          if (isTrue(alt.enable)) intent = true;
          alternatives.push(`${alt.enable}=true`);
        }
      }
      if (missing.length === 0) needs.push(`one of: ${summarize(alternatives)}`);
    }

    const status: Status = intent ? "waiting" : "off";
    const parts = [...missing, ...needs];
    const detail =
      parts.length === 0 ? "" : `${status === "waiting" ? "missing" : "needs"} ${parts.join(", ")}`;
    result = { status, detail, missing };
  }

  reports.set(key, result);
  return result;
}

/** Re-label a dependency's missing keys with the direct dependency, not the whole chain. */
function via(missing: string[], dep: Key): string[] {
  return missing.map(
    (m) => `${m.replace(/ \(via .*\)$/, "")} (via ${FEATURE_DEFINITIONS[dep].label})`
  );
}

function summarize(items: string[], max = 4): string {
  if (items.length <= max) return items.join(", ");
  return `${items.slice(0, max).join(", ")} and ${items.length - max} more`;
}

// ======== Print =========

const rows = FEATURE_KEYS.map((key) => ({ key, def: FEATURE_DEFINITIONS[key], ...report(key) }));
const labelWidth = Math.max(...rows.map((r) => r.def.label.length));
const statusWidth = "waiting".length;
const pad = (s: string, n: number) => s.padEnd(n);
const lines: string[] = [];

lines.push("ShipKit doctor");
lines.push(
  loaded.length > 0
    ? `Read ${loaded.join(" then ")} from ${process.cwd()}`
    : `No .env.local or .env in ${process.cwd()}; using the shell environment only`
);
lines.push("");
lines.push(`${pad("Feature", labelWidth)}  ${pad("Status", statusWidth)}  Detail`);
for (const row of rows) {
  lines.push(
    `${pad(row.def.label, labelWidth)}  ${pad(row.status, statusWidth)}  ${row.detail}`.trimEnd()
  );
  if (row.status === "waiting" && row.def.docs) {
    lines.push(`${pad("", labelWidth)}  ${pad("", statusWidth)}  ${row.def.docs}`);
  }
}
const count = (s: Status) => rows.filter((r) => r.status === s).length;
lines.push("");
lines.push(`${count("on")} on, ${count("waiting")} waiting, ${count("off")} off`);
lines.push("Features turn on when their keys are set. DISABLE_<FEATURE>=true forces one off.");

process.stdout.write(`${lines.join("\n")}\n`);
