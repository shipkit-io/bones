"use server";

import {
	forgotPasswordSchema,
	signInActionSchema,
	signUpSchema,
} from "@/lib/schemas/auth";
import { validatedAction } from "@/lib/utils/middleware";
import { AuthService } from "@/server/services/auth-service";
import { createServerAction } from "zsa";
import type { UserRole } from "@/types/user";

interface AuthOptions {
	redirectTo?: string;
	redirect?: boolean;
	protect?: boolean;
	role?: UserRole;
	nextUrl?: string;
	errorCode?: string;
}

interface SignInData {
	email: string;
	password: string;
	redirect?: boolean;
	redirectTo?: string;
}

interface SignUpData {
	email: string;
	password: string;
	redirect?: boolean;
	redirectTo?: string;
}

export const signInWithOAuthAction = async ({
	providerId,
	options,
}: {
	providerId: string;
	options?: AuthOptions;
}) => {
	return await AuthService.signInWithOAuth(providerId, options);
};

export const signInAction = createServerAction()
	.input(signInActionSchema)
	.handler(async ({ input }) => {
		await AuthService.signInWithCredentials({
			email: input.email,
			password: input.password,
			redirect: input.redirect,
			redirectTo: input.redirectTo,
		});
		return null;
	});

export const signInWithCredentialsAction = validatedAction(
	signInActionSchema,
	async (data: SignInData, _formData: FormData) => {
		await AuthService.signInWithCredentials({
			email: data.email,
			password: data.password,
			redirect: data.redirect,
			redirectTo: data.redirectTo,
		});
	},
);

export const signUpWithCredentialsAction = validatedAction(
	signUpSchema,
	async (data: SignUpData) => {
		return await AuthService.signUpWithCredentials({
			email: data.email,
			password: data.password,
			redirect: data.redirect,
			redirectTo: data.redirectTo,
		});
	},
);

export const signOutAction = async (options?: AuthOptions) => {
	return await AuthService.signOut(options);
};

// Todo: Implement forgot password
export const forgotPasswordAction = createServerAction()
	.input(forgotPasswordSchema)
	.handler(async () => {
		// return await forgotPassword(input);
	});
