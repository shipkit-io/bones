export const UPSTREAM_REPOS = [
  "https://github.com/lacymorrow/shipkit.git", // Premium (try first)
  "https://github.com/shipkit-io/bones.git", // Public fallback
] as const;

export const TEMPLATE_REPOS = [
  { owner: "lacymorrow", name: "shipkit", label: "ShipKit Premium" },
  { owner: "shipkit-io", name: "bones", label: "ShipKit (Bones - Public)" },
] as const;

export const DEFAULT_BRANCH = "main";
export const UPSTREAM_REMOTE = "upstream";
