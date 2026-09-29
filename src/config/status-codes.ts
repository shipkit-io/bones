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
  LOGIN: {
    code: "LOGIN",
    message: "Signed in successfully.",
  },
  LOGOUT: {
    code: "LOGOUT",
    message: "You have been signed out.",
  },

  UNKNOWN: {
    code: "UNKNOWN",
    message: "Something went wrong, please try again.",
  },
} as const;

export type ErrorCodes = typeof STATUS_CODES;
