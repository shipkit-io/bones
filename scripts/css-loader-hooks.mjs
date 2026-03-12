/**
 * ESM loader hooks to handle CSS file imports
 * Returns an empty module for CSS files to prevent Node.js from failing
 */

export async function resolve(specifier, context, nextResolve) {
  // Handle CSS file imports by returning a virtual module
  if (specifier.endsWith(".css") || specifier.endsWith(".scss")) {
    return {
      shortCircuit: true,
      url: `css-stub:${specifier}`,
    };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  // Return an empty module for CSS stubs
  if (url.startsWith("css-stub:")) {
    return {
      shortCircuit: true,
      format: "module",
      source: "export default {};",
    };
  }

  return nextLoad(url, context);
}
