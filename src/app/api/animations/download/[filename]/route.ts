import fs from "fs/promises";
import { type NextRequest } from "next/server";
import os from "os";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } },
) {
    try {
        const { filename } = params;
        const filePath = path.join(os.tmpdir(), "animation-exports", filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return Response.json({ error: "File not found" }, { status: 404 });
        }

        // Create a readable stream
        const fileStream = fs.createReadStream(filePath);

        // Get content type based on extension
        const extension = path.extname(filename).toLowerCase();
        const contentType =
            extension === ".gif"
                ? "image/gif"
                : extension === ".webm"
                    ? "video/webm"
                    : "video/mp4";

        // Return file stream with appropriate headers
        return new Response(fileStream as unknown as ReadableStream, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Download error:", error);
        return Response.json({ error: "Failed to download file" }, { status: 500 });
    }
}
