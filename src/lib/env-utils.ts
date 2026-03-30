/**
 * Get an environment variable with a fallback value
 */
export function getEnvVar(name: string, defaultValue = ""): string {
  return process.env[name] || defaultValue;
}

/**
 * Get a boolean environment variable
 */
export function getBooleanEnvVar(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
}

/**
 * Get a numeric environment variable
 */
export function getNumericEnvVar(name: string, defaultValue = 0): number {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Check if an environment feature flag is enabled
 */
export function isFeatureEnabled(
  featureName: string,
  defaultValue = false,
): boolean {
  return getBooleanEnvVar(
    `FEATURE_${featureName.toUpperCase()}_ENABLED`,
    defaultValue,
  );
}
