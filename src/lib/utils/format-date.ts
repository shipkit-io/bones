/**
 * Safely formats a date string for display
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string or empty string for invalid dates
 */
export function formatDate(date: string | Date | null | undefined): string {
	if (!date) return "";

	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;

		// Check if date is valid
		if (Number.isNaN(dateObj.getTime())) {
			return "";
		}

		return dateObj.toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return "";
	}
}

/**
 * Safely formats a date for HTML datetime attribute
 * @param date - Date string, Date object, or null/undefined
 * @returns ISO string or empty string for invalid dates
 */
export function formatDateTimeAttribute(date: string | Date | null | undefined): string {
	if (!date) return "";

	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;

		// Check if date is valid
		if (Number.isNaN(dateObj.getTime())) {
			return "";
		}

		return dateObj.toISOString();
	} catch {
		return "";
	}
}

/**
 * Safely formats a date to YYYY-MM-DD format for blog display
 * @param date - Date string, Date object, or null/undefined
 * @returns Date string in YYYY-MM-DD format or empty string for invalid dates
 */
export function formatDateForBlog(date: string | Date | null | undefined): string {
	if (!date) return "";

	try {
		const dateObj = typeof date === "string" ? new Date(date) : date;

		// Check if date is valid
		if (Number.isNaN(dateObj.getTime())) {
			return "";
		}

		const isoString = dateObj.toISOString();
		return isoString?.split("T")[0] ?? "";
	} catch {
		return "";
	}
}
