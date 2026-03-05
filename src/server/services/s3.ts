import { env } from "@/env";
import { logger } from "@/lib/logger";

// Lazy-loaded S3 client and SDK types
let s3Client: InstanceType<
  typeof import("@aws-sdk/client-s3").S3Client
> | null = null;
let isInitialized = false;

// Cache for dynamically imported modules
let S3ClientClass: typeof import("@aws-sdk/client-s3").S3Client | null = null;
let PutObjectCommandClass:
  | typeof import("@aws-sdk/client-s3").PutObjectCommand
  | null = null;
let DeleteObjectCommandClass:
  | typeof import("@aws-sdk/client-s3").DeleteObjectCommand
  | null = null;
let getSignedUrlFn:
  | typeof import("@aws-sdk/s3-request-presigner").getSignedUrl
  | null = null;

/**
 * Lazily loads the AWS SDK modules to prevent Turbopack bundling issues.
 * The SDK is only loaded when S3 functionality is actually used.
 */
async function loadAwsSdk() {
  if (!S3ClientClass) {
    const s3Module = await import("@aws-sdk/client-s3");
    S3ClientClass = s3Module.S3Client;
    PutObjectCommandClass = s3Module.PutObjectCommand;
    DeleteObjectCommandClass = s3Module.DeleteObjectCommand;
  }
  if (!getSignedUrlFn) {
    const presignerModule = await import("@aws-sdk/s3-request-presigner");
    getSignedUrlFn = presignerModule.getSignedUrl;
  }
}

/**
 * Initializes the S3 client if the feature is enabled and credentials are available.
 * Uses dynamic imports to avoid Turbopack bundling issues.
 */
async function initializeS3Client() {
  if (isInitialized) return s3Client;

  if (!env.NEXT_PUBLIC_FEATURE_S3_ENABLED) {
    isInitialized = true;
    return null;
  }

  if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    logger.error(
      "❌ S3 feature is enabled, but required AWS credentials or region are missing.",
    );
    isInitialized = true;
    return null;
  }

  try {
    await loadAwsSdk();

    if (!S3ClientClass) {
      throw new Error("Failed to load S3Client class");
    }

    s3Client = new S3ClientClass({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });

    logger.info("✅ S3 Client Initialized");
    isInitialized = true;
    return s3Client;
  } catch (error) {
    logger.error("❌ Failed to initialize S3 client:", error);
    isInitialized = true;
    return null;
  }
}

/**
 * Gets the S3 client, initializing it if necessary.
 */
async function getS3Client() {
  if (!isInitialized) {
    await initializeS3Client();
  }
  return s3Client;
}

/**
 * Generates a presigned URL for uploading a file to S3.
 * Throws an error if S3 is not configured or enabled.
 */
export async function generatePresignedUrl(fileName: string, contentType: string) {
	if (!s3Client) {
		logger.error("Attempted to generate presigned URL but S3 is disabled or not configured.");
		throw new Error("S3 storage is not enabled or configured.");
	}

	const command = new PutObjectCommand({
		Bucket: env.AWS_BUCKET_NAME,
		Key: fileName,
		ContentType: contentType,
	});

	try {
		const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
		return signedUrl;
	} catch (error) {
		logger.error("Error generating presigned URL", { error, fileName, contentType });
		throw new Error("Failed to generate presigned URL for S3");
	}
}

/**
 * Deletes a file from S3.
 * Throws an error if S3 is not configured or enabled.
 */
export const deleteFromS3 = async (fileName: string): Promise<void> => {
	if (!s3Client) {
		logger.error("Attempted to delete from S3 but S3 is disabled or not configured.");
		throw new Error("S3 storage is not enabled or configured.");
	}

	try {
		await s3Client.send(
			new DeleteObjectCommand({
				Bucket: env.AWS_BUCKET_NAME,
				Key: fileName,
			})
		);
	} catch (error) {
		logger.error("Error deleting file from S3", { error, fileName });
		throw new Error("Failed to delete file from S3");
	}
};
