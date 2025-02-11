/**
 * Error Toast
 *
 * Displays an error toast when a code is passed in the search params
 * The code is a status code from the STATUS_CODES object in @/config/status-codes.ts
 *
 * @example
 * <ErrorToast />
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/searchparams
 */

"use client";

import { STATUS_CODES } from "@/config/status-codes";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export const ErrorToast = () => {
	const searchParams = useSearchParams();
	const errorCode = searchParams.get("code");

	useEffect(() => {
		if (errorCode && Object.keys(STATUS_CODES).includes(errorCode)) {
			const error = STATUS_CODES[errorCode as keyof typeof STATUS_CODES];

			if (error) {
				// Renders twice in strict mode
				setTimeout(() => {
					toast.error(error.message);
				}, 500);
			}
		}
	}, [errorCode]);

	return null;
};
