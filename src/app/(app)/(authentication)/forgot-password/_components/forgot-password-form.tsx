"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { type z } from "zod";

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
import { getSchemaDefaults } from "@/lib/utils/get-schema-defaults";
import { forgotPasswordSchema } from "@/schemas/auth";
import { forgotPasswordAction } from "@/server/actions/auth";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: getSchemaDefaults(forgotPasswordSchema),
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    await forgotPasswordAction(values)
      .then(() => {
        toast.success("Email sent", {
          description:
            "Please check your email for a link to reset your password.",
        });
      })
      .catch(() => {
        toast.error("Error sending password reset email", {
          description: "Please try again.",
        });
      });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={() => void form.handleSubmit(onSubmit)}
        className="flex flex-col gap-sm"
      >
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
        <Button className="self-end" type="submit">
          Submit
        </Button>
      </form>
    </Form>
  );
}
