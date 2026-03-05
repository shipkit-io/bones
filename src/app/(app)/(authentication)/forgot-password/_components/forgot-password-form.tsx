"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { forgotPasswordSchema } from "@/lib/schemas/auth";
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";
import { forgotPasswordAction } from "@/server/actions/auth";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
	const form = useForm<ForgotPasswordFormValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: getSchemaDefaults<typeof forgotPasswordSchema>(forgotPasswordSchema),
	});

	async function onSubmit(values: ForgotPasswordFormValues) {
		try {
			const result = await forgotPasswordAction(values);

			// Handle different result types
			if (Array.isArray(result)) {
				// If result is a tuple [data, error], check the first element
				const [data, error] = result;
				if (error) {
					toast.error("Error sending password reset email", {
						description: error.message || "Please try again.",
					});
				} else if (
					data &&
					typeof data === "object" &&
					"ok" in data &&
					(data as { ok: boolean }).ok
				) {
					toast.success("Email sent", {
						description: "Please check your email for a link to reset your password.",
					});
					form.reset();
				}
			} else if (result && typeof result === "object" && "ok" in result) {
				// If result is a direct object with ok property
				const typedResult = result as { ok: boolean; error?: string };
				if (typedResult.ok) {
					toast.success("Email sent", {
						description: "Please check your email for a link to reset your password.",
					});
					form.reset();
				} else {
					toast.error("Error sending password reset email", {
						description: typedResult.error || "Please try again.",
					});
				}
			}
		} catch (error) {
			toast.error("Error sending password reset email", {
				description: "Please try again.",
			});
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-sm">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder="m@example.com" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button className="self-end" type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "Sending..." : "Submit"}
				</Button>
			</form>
		</Form>
	);
}
