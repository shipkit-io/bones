import { logger } from "@/lib/logger";
import { type FileSchemaType, fileSchema } from "@/server/actions/schemas";
import { deleteFromS3, generatePresignedUrl } from "@/server/services/s3";

export const uploadFile = async (
	file: FileSchemaType
): Promise<{ fileName: string; url: string }> => {
	const validatedFile = fileSchema.parse(file);

	try {
		const fileName = `${Date.now()}-${validatedFile.name}`;
		const signedUrl = await generatePresignedUrl(fileName, validatedFile.type);

		if (!signedUrl) {
			throw new Error(`Failed to generate presigned URL for file: ${fileName}`);
		}

		const response = await fetch(signedUrl, {
			method: "PUT",
			body: validatedFile,
			headers: {
				"Content-Type": validatedFile.type,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to upload file: ${validatedFile.name}`);
		}

		logger.info(`File uploaded successfully: ${fileName}`);
		const s3Url = signedUrl.split("?")[0]; // This gets the S3 URL without the query parameters
		return { fileName, url: s3Url ?? signedUrl };
	} catch (error) {
		// Friendly error message
		const errorMessage = `Error uploading file: ${validatedFile.name}`;
		logger.error(errorMessage, error);
		throw new Error(errorMessage);
	}
};

export const deleteFile = async (fileName: string): Promise<void> => {
	try {
		await deleteFromS3(fileName);
		logger.info(`File deleted successfully: ${fileName}`);
	} catch (error) {
		const errorMessage = `Error deleting file: ${fileName}`;
		logger.error(errorMessage, error);
		throw new Error(errorMessage);
	}
};
