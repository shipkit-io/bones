"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { routes } from "@/config/routes";
import { signUpSchema } from "@/lib/schemas/auth";
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";
import { signUpWithCredentialsAction } from "@/server/actions/auth";

type SignUpFormValues = z.infer<typeof signUpSchema>;

export const SignUpForm = () => {
	const router = useRouter();
	const { update: updateSession } = useSession();
	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			...getSchemaDefaults<typeof signUpSchema>(signUpSchema),
			redirectTo: routes.home,
			redirect: true,
		},
	});

	async function onSubmit(values: SignUpFormValues) {
		try {
			// Create FormData to match the expected function signature
			const formData = new FormData();
			formData.append("email", values.email);
			formData.append("password", values.password);
			formData.append("redirect", "false");
			formData.append("redirectTo", routes.home);

			const result = await signUpWithCredentialsAction({}, formData);

			// Check if the sign-up was okful
			if (result?.ok) {
				toast.success("Account created successfully");
				// Update the session before redirecting
				await updateSession();
				router.push(routes.home);
				router.refresh(); // Refresh to update the session
				return;
			}

			if (result?.error) {
				// Handle error from result object
				throw new Error(result.error);
			}

			// If we get here, something unexpected happened
			throw new Error("Sign up failed");
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("User already exists")) {
					form.setError("email", {
						type: "manual",
						message: "An account with this email already exists.",
					});
				} else {
					toast.error("Error creating account", {
						description: error.message,
					});
				}
			} else {
				toast.error("Error creating account", {
					description: "Something went wrong. Please try again.",
				});
			}
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="me@example.com" type="email" autoComplete="email" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input type="password" autoComplete="new-password" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					className="w-full"
					disabled={form.formState.isSubmitting || !form.formState.isValid}
				>
					{form.formState.isSubmitting ? "Creating account..." : "Create account"}
				</Button>
			</form>
		</Form>
	);
};
