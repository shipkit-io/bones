const app = {
  name: "ShipKit",
  description: "ShipKit helps you launch your product faster.",
} as const;

export const $ = {
  app,
  actions: {
    signIn: {
      success: "Signed in successfully.",
    },
  },
  ui: {
    logo: {
      alt: `${app.name} logo`,
    },
  },
} as const;

export type Strings = typeof $;
