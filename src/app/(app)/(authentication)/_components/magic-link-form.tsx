"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { routes } from "@/config/routes";
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { signInWithOAuthAction } from "@/server/actions/auth";

const magicLinkSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

interface MagicLinkFormProps {
	className?: string;
}

export function MagicLinkForm({ className }: MagicLinkFormProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const searchParams = useSearchParams();
	const nextUrl = searchParams?.get(SEARCH_PARAM_KEYS.nextUrl);

	const form = useForm<MagicLinkFormValues>({
		resolver: zodResolver(magicLinkSchema),
		defaultValues: {
			email: "",
		},
	});

	async function onSubmit(values: MagicLinkFormValues) {
		setIsSubmitting(true);
		try {
			// Pass the email as a custom parameter to the Resend provider
			await signInWithOAuthAction({
				providerId: "resend",
				options: {
					redirectTo: nextUrl || routes.home,
					email: values.email,
				},
			});

			toast.success("Magic link sent", {
				description: "Please check your email for a link to sign in.",
			});

			form.reset();
		} catch (error) {
			console.error("Error sending magic link:", error);
			toast.error("Failed to send magic link", {
				description: "Please try again or use another sign-in method.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className={className}>
				<div className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<Input
										placeholder="me@example.com"
										type="email"
										autoComplete="email"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button
						type="submit"
						className="w-full"
						disabled={isSubmitting || !form.formState.isValid}
					>
						{isSubmitting ? (
							"Sending link..."
						) : (
							<>
								<EnvelopeClosedIcon className="mr-2 h-4 w-4" />
								Send Magic Link
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
