/**
 * File upload configuration
 */

export const BYTES_IN_A_MEGABYTE = 1024 * 1024;
export const FILE_UPLOAD_MAX_SIZE = 2 * BYTES_IN_A_MEGABYTE; // 2 MB

const FILE_TYPES_IMAGES = [
	"image/png",
	"image/jpeg",
	"image/jpg",
	"image/gif",
	"image/bmp",
	"image/webp",
	"image/svg+xml",
	"image/tiff",
	"image/x-icon",
	"image/heic",
	"image/heif",
	"image/heif-sequence",
	"image/heic-sequence",
	"image/avif",
	"image/avif-sequence",
	"image/apng",
	"image/bmp",
	"image/dib",
	"image/ico",
];

const FILE_TYPES_DOCUMENTS = [
	"application/pdf",
	"application/msword",
	"text/plain",
	"text/markdown",
	"text/csv",
	"text/xml",
	"text/html",
];

export const ALLOWED_FILE_TYPES = [
	...FILE_TYPES_IMAGES,
	...FILE_TYPES_DOCUMENTS,
];
