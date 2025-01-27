import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { STATUS_CODES } from "@/config/status-codes";
import { signInSchema } from "@/lib/schemas/auth";
import { signIn, signOut } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { compare, hash } from "bcrypt";
import { nanoid } from "nanoid";

/**
 * Authentication service for handling user authentication and authorization
 */
export const AuthService = {
	/**
	 * Sign in with OAuth provider
	 */
	async signInWithOAuth(providerId: string, options?: any) {
		await signIn(
			providerId,
			{
				redirectTo: options?.redirectTo ?? routes.home,
				...options,
			},
			{ prompt: "select_account" },
		);
		return { success: STATUS_CODES.LOGIN.message };
	},

	/**
	 * Sign in with email and password
	 */
	async signInWithCredentials({
		email,
		password,
		redirect = true,
		redirectTo = routes.home,
	}: {
		email: string;
		password: string;
		redirect?: boolean;
		redirectTo?: string;
	}) {
		await signIn("credentials", {
			redirect,
			redirectTo,
			email,
			password,
		});
	},

	/**
	 * Sign up with email and password
	 */
	async signUpWithCredentials({
		email,
		password,
		redirect = true,
		redirectTo = routes.home,
	}: {
		email: string;
		password: string;
		redirect?: boolean;
		redirectTo?: string;
	}) {
		try {
			// Check if user already exists
			const existingUser = await db?.query.users.findFirst({
				where: (users, { eq }) => eq(users.email, email),
			});

			if (existingUser) {
				throw new Error("User already exists with this email");
			}

			// Hash password
			const hashedPassword = await hash(password, 10);

			// Create new user
			const result = await db
				?.insert(users)
				.values({
					id: nanoid(),
					email,
					password: hashedPassword,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();
			const newUser = result?.[0];

			if (!newUser) {
				throw new Error("Failed to create user");
			}

			// Sign in the user
			await signIn("credentials", {
				redirect,
				redirectTo,
				email,
				password,
			});

			return { success: true };
		} catch (error) {
			console.error("Sign up error:", error);
			throw error;
		}
	},

	/**
	 * Sign out the current user
	 */
	async signOut(options?: any) {
		await signOut({
			redirectTo: `${routes.home}?${SEARCH_PARAM_KEYS.statusCode}=${STATUS_CODES.LOGOUT.code}`,
			redirect: true,
			...options,
		});

		return { success: STATUS_CODES.LOGOUT.message };
	},

	/**
	 * Validate user credentials
	 */
	async validateCredentials(credentials: unknown) {
		try {
			const parsedCredentials = signInSchema.safeParse(credentials);

			if (!parsedCredentials.success) {
				throw new Error("Invalid credentials");
			}

			const { email, password } = parsedCredentials.data;

			const user = await db?.query.users.findFirst({
				where: (users, { eq }) => eq(users.email, email),
			});

			if (!user?.password) {
				throw new Error("Invalid credentials");
			}

			const isValidPassword = await compare(password, user.password);

			if (!isValidPassword) {
				throw new Error("Invalid credentials");
			}

			return {
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: null,
				image: user.image,
				bio: user.bio,
				githubUsername: user.githubUsername,
				theme: user.theme as "system" | "light" | "dark" | undefined,
				emailNotifications: user.emailNotifications ?? undefined,
			};
		} catch (error) {
			console.error("Auth error:", error);
			return null;
		}
	},
} as const;
