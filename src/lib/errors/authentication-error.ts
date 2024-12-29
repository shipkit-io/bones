import { STATUS_CODES } from "@/config/status-codes";
import { AuthError } from "next-auth";

/*
Custom Error message for login
@see: https://github.com/nextauthjs/next-auth/issues/9099
*/
export class AuthenticationError extends AuthError {
  constructor(options?: string) {
    super(options);

    if (typeof options === "string") {
      this.message = options;
    } else {
      this.message = STATUS_CODES.AUTH_ERROR.message;
    }
  }
  code = STATUS_CODES.AUTH_ERROR.code;
}
