"use server";

import { revalidateTag } from "next/cache";
import { logger } from "@/lib/logger";
import { fileSchema } from "@/server/actions/schemas";
import { auth } from "@/server/auth";
import { deleteFile, uploadFile } from "@/server/services/file";
import { userService } from "@/server/services/user-service";

export const uploadFileAction = async (
	formData: FormData
): Promise<{ fileName: string; fileId: number | undefined }> => {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	const file = formData.get("file") as File;
	if (!file) {
		throw new Error("No file provided");
	}

	const validatedFile = fileSchema.parse(file);
	const { fileName, url } = await uploadFile(validatedFile);

	// Log the file name and URL
	logger.info(`File uploaded - Name: ${fileName}, URL: ${url}`);

	// Add the file to the user's profile
	const userFile = await userService.addUserFile(session.user.id, {
		title: fileName,
		location: url,
	});
	revalidateTag("files", "max");
	if (!userFile) {
		throw new Error("Failed to create user file");
	}
	return { fileName, fileId: userFile.id };
};

export async function deleteFileAction({
	fileId,
	fileName,
}: {
	fileId: number;
	fileName: string;
}): Promise<void> {
	const session = await auth();
	if (!session?.user?.id) {
		throw new Error("Unauthorized");
	}

	try {
		await userService.deleteUserFile(session.user.id, fileId);
		await deleteFile(fileName);
		// Remove the file from the user's profile
		revalidateTag("files", "max");

		logger.info(`File deleted successfully: ${fileId}`);
	} catch (error) {
		logger.error("Error deleting file", { error, fileId });
		throw new Error("Failed to delete file");
	}
}
