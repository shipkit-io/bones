import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  // dts disabled: CLI binary, not a library — no consumers need .d.ts
  dts: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
