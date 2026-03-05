export const STATUS_CODES = {
	AUTH: {
		code: "AUTH",
		message: "Please sign in and try again.",
	},
	AUTH_ERROR: {
		code: "AUTH_ERROR",
		message: "An error occurred while authenticating, please try again.",
	},
	AUTH_REFRESH: {
		code: "AUTH_REFRESH",
		message: "Your session has expired. Please sign in again.",
	},
	AUTH_LOGIN: {
		code: "AUTH_LOGIN",
		message: "There was a problem logging you in.",
	},
	AUTH_ROLE: {
		code: "AUTH_ROLE",
		message: "You are not authorized to access this resource.",
	},
	CREDENTIALS: {
		code: "CREDENTIALS",
		message: "Invalid email or password.",
	},
	EMAIL_EXISTS_DIFFERENT_PROVIDER: {
		code: "EMAIL_EXISTS_DIFFERENT_PROVIDER",
		message:
			"An account with this email already exists. Please sign in using your original sign-in method.",
	},
	LOGIN: {
		code: "LOGIN",
		message: "Signed in successfully.",
	},
	LOGOUT: {
		code: "LOGOUT",
		message: "You have been signed out.",
	},

	CONNECT_GITHUB: {
		code: "CONNECT_GITHUB",
		message: "GitHub connected successfully.",
	},
	GITHUB_INVITATION_PENDING: {
		code: "GITHUB_INVITATION_PENDING",
		message:
			"You have a pending GitHub repository invitation. Please accept it to continue.",
	},
	GITHUB_OAUTH_FAILED: {
		code: "GITHUB_OAUTH_FAILED",
		message: "Failed to connect with GitHub. Please try again.",
	},
	GITHUB_TOKEN_INVALID: {
		code: "GITHUB_TOKEN_INVALID",
		message: "Your GitHub connection has expired. Please reconnect.",
	},

	// Vercel connection status codes
	CONNECT_VERCEL: {
		code: "CONNECT_VERCEL",
		message: "Vercel account connected successfully.",
	},
	CONNECT_VERCEL_FAILED: {
		code: "CONNECT_VERCEL_FAILED",
		message: "Unable to connect your Vercel account. Please try again.",
	},
	CONNECT_VERCEL_ERROR: {
		code: "CONNECT_VERCEL_ERROR",
		message: "Something went wrong. Please try again later.",
	},

	// Vercel connection status codes
	VERCEL_CONNECTED: {
		code: "VERCEL_CONNECTED",
		message: "Vercel account connected successfully.",
	},
	VERCEL_CONNECTION_FAILED: {
		code: "VERCEL_CONNECTION_FAILED",
		message: "Unable to connect your Vercel account. Please try again.",
	},
	VERCEL_ERROR: {
		code: "VERCEL_ERROR",
		message: "Something went wrong. Please try again later.",
	},

	// Deployment status codes
	DEPLOYMENT_CREATED: {
		code: "DEPLOYMENT_CREATED",
		message: "Deployment started successfully.",
	},

	UNKNOWN: {
		code: "UNKNOWN",
		message: "Something went wrong, please try again.",
	},
} as const;

export type ErrorCodes = typeof STATUS_CODES;
