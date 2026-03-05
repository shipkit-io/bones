"use server";

import crypto from "crypto";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { promisify } from "util";
import { z } from "zod";
import { db } from "@/server/db";
import { permissions, rolePermissions, roles, users } from "@/server/db/schema";

// Constants for password hashing
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = {
	N: 16384, // CPU/memory cost parameter
	r: 8, // Block size parameter
	p: 1, // Parallelization parameter
} as const;

// Promisify scrypt
const scrypt = promisify<string | Buffer, Buffer, number, crypto.ScryptOptions, Buffer>(
	crypto.scrypt
);

/**
 * Hash a password using scrypt
 * @param password The plain text password to hash
 * @returns A string containing the salt and hash, separated by a colon
 */
async function hashPassword(password: string): Promise<string> {
	const salt = crypto.randomBytes(SALT_LENGTH);
	const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
	return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

const setupSchema = z.object({
	databaseUrl: z.string().url(),
	adminEmail: z.string().email(),
	adminPassword: z.string().min(8),
	resendApiKey: z.string().optional(),
	builderPublicKey: z.string().optional(),
});

export type SetupInput = z.infer<typeof setupSchema>;

const DEFAULT_ADMIN_PERMISSIONS = [
	{
		name: "all:manage",
		description: "Full system access",
		resource: "*",
		action: "*",
	},
	{
		name: "users:manage",
		description: "Manage all users",
		resource: "users",
		action: "manage",
	},
	{
		name: "roles:manage",
		description: "Manage roles and permissions",
		resource: "roles",
		action: "manage",
	},
] as const;

export async function configureSetup(input: SetupInput) {
	try {
		// Validate input
		const validatedInput = setupSchema.parse(input);

		// Test database connection
		try {
			await db?.execute(sql`SELECT 1`);
		} catch (error) {
			throw new Error("Failed to connect to database");
		}

		// Create admin role and permissions
		await db?.transaction(async (tx) => {
			// Create admin role if it doesn't exist
			const existingRole = await tx.query.roles.findFirst({
				where: (roles, { eq }) => eq(roles.name, "admin"),
			});

			const roleId = existingRole?.id ?? nanoid();

			if (!existingRole) {
				await tx.insert(roles).values({
					id: roleId,
					name: "admin",
					description: "System administrator with full access",
					isSystem: true,
				});
			}

			// Create default permissions
			for (const perm of DEFAULT_ADMIN_PERMISSIONS) {
				const existingPerm = await tx.query.permissions.findFirst({
					where: (permissions, { eq }) => eq(permissions.name, perm.name),
				});

				if (!existingPerm) {
					const permId = nanoid();
					await tx.insert(permissions).values({
						id: permId,
						...perm,
					});

					// Link permission to admin role
					await tx.insert(rolePermissions).values({
						roleId,
						permissionId: permId,
					});
				}
			}

			// Create admin user if it doesn't exist
			const normalizedEmail = validatedInput.adminEmail.toLowerCase();
			const existingAdmin = await tx.query.users.findFirst({
				where: (users, { eq }) => eq(users.email, normalizedEmail),
			});

			if (!existingAdmin) {
				const hashedPassword = await hashPassword(validatedInput.adminPassword);
				await tx.insert(users).values({
					email: normalizedEmail,
					password: hashedPassword,
					role: "admin", // This is the basic role field
					emailVerified: new Date(),
				});
			}
		});

		return {
			success: true,
			message: "Setup completed successfully",
		};
	} catch (error) {
		console.error("Setup failed:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Setup failed",
		};
	}
}
