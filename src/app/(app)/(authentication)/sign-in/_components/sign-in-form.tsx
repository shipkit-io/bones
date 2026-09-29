"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { SEARCH_PARAM_KEYS } from "@/config/search-param-keys";
import { signInSchema } from "@/lib/schemas/auth";
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";
import { signInWithCredentialsAction } from "@/server/actions/auth";

export const SignInForm = () => {
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get(SEARCH_PARAM_KEYS.nextUrl) ?? null;
  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      ...getSchemaDefaults(signInSchema),
      redirectTo: routes.home,
      redirect: true,
      mode: "onChange",
    },
  });

  async function onSubmit(values: z.infer<typeof signInSchema>) {
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      }

      // Redirect back to the page that the user was on before signing in
      if (nextUrl) {
        formData.append(SEARCH_PARAM_KEYS.nextUrl, nextUrl);
      }

      await signInWithCredentialsAction(values);

      toast.success("Success", {
        description: "Signed in successfully.",
      });
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("invalid credentials") ||
          errorMessage.includes("user not found")
        ) {
          toast.error("Error", {
            description: "Invalid email or password. Please try again.",
          });
        } else {
          toast.error("Error", {
            description: error.message,
          });
        }
      } else {
        toast.error("Error", {
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
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href={routes.auth.forgotPassword}
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
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
          {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Form>
  );
};
