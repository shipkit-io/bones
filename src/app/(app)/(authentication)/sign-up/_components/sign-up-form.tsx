"use client";

import { signUpSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useToast } from "@/hooks/use-toast";
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";
import { signUpWithCredentialsAction } from "@/server/actions/auth";

export const SignUpForm = () => {
	const { toast } = useToast();
	const form = useForm<z.infer<typeof signUpSchema>>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			...getSchemaDefaults(signUpSchema),
			redirectTo: routes.home,
			redirect: true,
		},
	});

	async function onSubmit(values: z.infer<typeof signUpSchema>) {
		try {
			const formData = new FormData();
			for (const [key, value] of Object.entries(values)) {
				if (value !== undefined && value !== null) {
					formData.append(key, value.toString());
				}
			}

			await signUpWithCredentialsAction(values, formData);

			toast({
				title: "Success",
				description: "Account created successfully.",
			});
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("User already exists")) {
					form.setError("email", {
						type: "manual",
						message: "An account with this email already exists.",
					});
				} else {
					toast({
						title: "Error",
						description: error.message,
						variant: "destructive",
					});
				}
			} else {
				toast({
					title: "Error",
					description: "Something went wrong. Please try again.",
					variant: "destructive",
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
