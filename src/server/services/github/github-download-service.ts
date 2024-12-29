/**
 * GitHub download service
 *
 * Downloads the latest release from the GitHub repository
 * and caches it for 1 hour
 */

import { siteConfig } from "@/config/site";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { createWriteStream } from "fs";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import https from "https";
import { join } from "path";
import { pipeline } from "stream/promises";

const CACHE_DIR = join(process.cwd(), ".cache", "downloads");
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface DownloadMetadata {
	url: string;
	timestamp: number;
	version: string;
}

/**
 * Make an authenticated GitHub API request with redirect following
 */
async function makeGitHubRequest(url: string): Promise<{
	statusCode: number;
	headers: Record<string, string | string[] | undefined>;
	data: any;
}> {
	if (!env?.GITHUB_ACCESS_TOKEN) {
		logger.error("GITHUB_ACCESS_TOKEN is not set in the environment.");
		return;
	}

	return new Promise((resolve, reject) => {
		const makeRequest = (requestUrl: string) => {
			const options = {
				headers: {
					"User-Agent": "ShipKit-Downloader",
					Authorization: `Bearer ${env.GITHUB_ACCESS_TOKEN}`,
					Accept: "application/vnd.github.v3+json",
				},
			};

			https
				.get(requestUrl, options, (response) => {
					if (
						response.statusCode === 301 ||
						response.statusCode === 302 ||
						response.statusCode === 307
					) {
						const redirectUrl = response.headers.location;
						if (!redirectUrl) {
							reject(new Error("Redirect location not found"));
							return;
						}
						makeRequest(redirectUrl);
						return;
					}

					let data = "";
					response.on("data", (chunk) => {
						data += chunk;
					});

					response.on("end", () => {
						try {
							resolve({
								statusCode: response.statusCode || 500,
								headers: response.headers,
								data: data ? JSON.parse(data) : null,
							});
						} catch (e) {
							reject(new Error("Failed to parse response"));
						}
					});
				})
				.on("error", reject);
		};

		makeRequest(url);
	});
}

/**
 * Verify GitHub token has required permissions for private repository access
 */
async function verifyTokenPermissions(): Promise<{
	isValid: boolean;
	scopes?: string[];
	error?: string;
}> {
	try {
		const apiUrl = `https://api.github.com/repos/${siteConfig.repo.owner}/${siteConfig.repo.name}`;
		const { statusCode, headers, data } = await makeGitHubRequest(apiUrl);

		// Check OAuth scopes
		const scopes = headers["x-oauth-scopes"]?.toString().split(", ");
		logger.info("GitHub token scopes", { scopes });

		if (statusCode === 200) {
			return { isValid: true, scopes };
		}

		logger.error("GitHub token verification failed", {
			statusCode,
			headers,
			data,
		});

		return {
			isValid: false,
			scopes,
			error: data?.message || "Unknown error",
		};
	} catch (error) {
		logger.error("GitHub token verification request failed", { error });
		return {
			isValid: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Ensures the cache directory exists
 */
async function ensureCacheDir() {
	try {
		await stat(CACHE_DIR);
	} catch {
		await mkdir(CACHE_DIR, { recursive: true });
	}
}

/**
 * Gets the cached file path for a given version
 */
function getCacheFilePath(version: string) {
	return join(CACHE_DIR, `shipkit-${version}.zip`);
}

/**
 * Gets the metadata file path
 */
function getMetadataPath() {
	return join(CACHE_DIR, "metadata.json");
}

/**
 * Reads the metadata file
 */
async function readMetadata(): Promise<DownloadMetadata | null> {
	try {
		const metadataPath = getMetadataPath();
		const content = await readFile(metadataPath, "utf-8");
		return JSON.parse(content);
	} catch {
		return null;
	}
}

/**
 * Writes metadata to the cache
 */
async function writeMetadata(metadata: DownloadMetadata) {
	const metadataPath = getMetadataPath();
	await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Downloads a file from a URL to a local path
 */
async function downloadFile(url: string, filePath: string): Promise<void> {
	if (!env?.GITHUB_ACCESS_TOKEN) {
		logger.error("GITHUB_ACCESS_TOKEN is not set in the environment.");
		return;
	}

	return new Promise((resolve, reject) => {
		const makeRequest = (requestUrl: string) => {
			const options = {
				headers: {
					"User-Agent": "ShipKit-Downloader",
					Authorization: `Bearer ${env.GITHUB_ACCESS_TOKEN}`,
					Accept: "application/vnd.github.v3+json",
				},
			};

			https
				.get(requestUrl, options, (response) => {
					if (
						response.statusCode === 301 ||
						response.statusCode === 302 ||
						response.statusCode === 307
					) {
						const redirectUrl = response.headers.location;
						if (!redirectUrl) {
							reject(new Error("Redirect location not found"));
							return;
						}
						makeRequest(redirectUrl);
						return;
					}

					if (response.statusCode !== 200) {
						let data = "";
						response.on("data", (chunk) => {
							data += chunk;
						});
						response.on("end", () => {
							try {
								const errorDetails = JSON.parse(data);
								logger.error("GitHub API error details", {
									errorDetails,
									statusCode: response.statusCode,
									headers: response.headers,
									url: requestUrl,
								});
							} catch (e) {
								logger.error("Failed to parse GitHub API error response", {
									data,
									error: e,
								});
							}
							reject(
								new Error(
									`Failed to download: ${response.statusCode} - ${response.statusMessage}`,
								),
							);
						});
						return;
					}

					const fileStream = createWriteStream(filePath);
					pipeline(response, fileStream)
						.then(() => resolve())
						.catch(reject);
				})
				.on("error", (error) => {
					logger.error("Download request failed", { error, url: requestUrl });
					reject(error);
				});
		};

		makeRequest(url);
	});
}

/**
 * Downloads the latest release
 */
async function downloadLatestRelease(): Promise<{
	filePath: string;
	version: string;
}> {
	await ensureCacheDir();

	// First, verify token permissions
	const { isValid, scopes, error } = await verifyTokenPermissions();
	if (!isValid) {
		throw new Error(
			`GitHub token verification failed: ${error}. Required scopes: repo. Current scopes: ${
				scopes?.join(", ") || "none"
			}`,
		);
	}

	try {
		// Use the main branch as version since we're not using releases
		const version = "main";
		const filePath = getCacheFilePath(version);

		// Check if we already have this version cached
		try {
			await stat(filePath);
			logger.info("Using cached archive", { version });
			return { filePath, version };
		} catch {
			// File doesn't exist, continue with download
		}

		// Download using GitHub API
		logger.info("Downloading repository archive", { version });
		const downloadUrl = `https://api.github.com/repos/${siteConfig.repo.owner}/${siteConfig.repo.name}/zipball/main`;

		logger.info("Starting download", { url: downloadUrl });
		await downloadFile(downloadUrl, filePath);

		// Update metadata
		await writeMetadata({
			url: downloadUrl,
			timestamp: Date.now(),
			version,
		});

		return { filePath, version };
	} catch (error) {
		logger.error("Error downloading archive", { error });
		throw error;
	}
}

/**
 * Gets the path to the latest ZIP file
 * Downloads it if necessary or if cache is expired
 */
export async function getLatestReleaseFile(): Promise<string> {
	const metadata = await readMetadata();
	const cacheExpired =
		!metadata || Date.now() - metadata.timestamp > CACHE_DURATION;

	if (cacheExpired) {
		logger.info("Cache expired, downloading new archive");
		const { filePath } = await downloadLatestRelease();
		return filePath;
	}

	const filePath = getCacheFilePath(metadata.version);
	try {
		await stat(filePath);
		logger.info("Using cached archive", { version: metadata.version });
		return filePath;
	} catch {
		// File missing, download again
		logger.info("Cache file missing, downloading new archive");
		const { filePath: newPath } = await downloadLatestRelease();
		return newPath;
	}
}
