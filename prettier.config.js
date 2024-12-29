/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  // semi: true,
  // singleQuote: false,
  // tabWidth: 2,
  // trailingComma: "es5",
  // printWidth: 100,
  useTabs: true,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: "./tailwind.config.ts",
};

export default config;
