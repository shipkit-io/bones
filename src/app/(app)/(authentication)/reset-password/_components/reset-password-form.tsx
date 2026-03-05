"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type ControllerRenderProps, useForm } from "react-hook-form";
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
import { resetPasswordSchema } from "@/lib/schemas/auth";
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";
import { resetPasswordAction } from "@/server/actions/auth";

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token?: string }) {
	const router = useRouter();

	const form = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			...getSchemaDefaults<typeof resetPasswordSchema>(resetPasswordSchema),
			token: token || "",
		},
	});

	async function onSubmit(values: ResetPasswordFormValues) {
		if (!values.token) {
			toast.error("Missing reset token", {
				description: "The password reset link is invalid or has expired.",
			});
			return;
		}

		try {
			const result = await resetPasswordAction(values);

			// Handle different result types
			if (Array.isArray(result)) {
				// If result is a tuple [data, error], check the first element
				const [data, error] = result;
				if (error) {
					toast.error("Error resetting password", {
						description: error.message || "The password reset link is invalid or has expired.",
					});
				} else if (
					data &&
					typeof data === "object" &&
					"ok" in data &&
					(data as { ok: boolean }).ok
				) {
					toast.success("Password reset successful", {
						description: "You can now sign in with your new password.",
					});
					router.push(routes.auth.signIn);
				}
			} else if (result && typeof result === "object" && "ok" in result) {
				// If result is a direct object with ok property
				const typedResult = result as { ok: boolean; error?: string };
				if (typedResult.ok) {
					toast.success("Password reset successful", {
						description: "You can now sign in with your new password.",
					});
					router.push(routes.auth.signIn);
				} else {
					toast.error("Error resetting password", {
						description: typedResult.error || "The password reset link is invalid or has expired.",
					});
				}
			}
		} catch (error) {
			toast.error("Error resetting password", {
				description: "An unexpected error occurred. Please try again.",
			});
		}
	}

	// Don't show the form if no token is provided
	if (!token) {
		return (
			<div className="text-center">
				<p className="mb-4">The password reset link is invalid or has expired.</p>
				<Button onClick={() => router.push(routes.auth.forgotPassword)}>
					Request a new password reset link
				</Button>
			</div>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-sm">
				<FormField
					control={form.control}
					name="password"
					render={({
						field,
					}: {
						field: ControllerRenderProps<ResetPasswordFormValues, "password">;
					}) => (
						<FormItem>
							<FormLabel>New Password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="••••••••" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="passwordConfirm"
					render={({
						field,
					}: {
						field: ControllerRenderProps<ResetPasswordFormValues, "passwordConfirm">;
					}) => (
						<FormItem>
							<FormLabel>Confirm Password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="••••••••" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className="self-end" type="submit">
					Reset Password
				</Button>
			</form>
		</Form>
	);
}
