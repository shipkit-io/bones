/**
 * Fetch content from Payload CMS with fallback to static content.
 * Without Payload installed, this always returns the static fallback.
 */
export async function getPayloadContent<_T extends string, F>({
  fallbackImport,
}: {
  collection: string;
  options?: Record<string, unknown>;
  fallbackImport: () => Promise<{ content: F }>;
}): Promise<F> {
  const { content } = await fallbackImport();
  return content;
}
