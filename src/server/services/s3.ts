// Stub. Install the @shipkit/storage registry item to replace this file.

import { logger } from "@/lib/logger";

const NOT_INSTALLED = "S3 storage is not installed; add @shipkit/storage";

/**
 * Generates a presigned URL for uploading a file to S3.
 * Throws until the storage item is installed, matching the installed
 * module's behavior when S3 is disabled.
 */
export async function generatePresignedUrl(fileName: string, contentType: string): Promise<string> {
  logger.debug(NOT_INSTALLED, { fileName, contentType });
  throw new Error(NOT_INSTALLED);
}

/**
 * Deletes a file from S3. No-op until the storage item is installed.
 */
export const deleteFromS3 = async (fileName: string): Promise<void> => {
  logger.debug(NOT_INSTALLED, { fileName });
};
