// Stub — returns null when Payload CMS is not installed
export async function getPayloadContent<T>(_collection: string, _slug?: string): Promise<T | null> {
  return null;
}
