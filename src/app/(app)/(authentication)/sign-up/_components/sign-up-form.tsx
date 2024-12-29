"use client";

import { signUpSchema } from "@/schemas/auth";
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

export const SignUpForm = () => {
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: getSchemaDefaults(signUpSchema),
  });

  function onSubmit(values: z.infer<typeof signUpSchema>) {
    console.log(values);
    // return void createUserAction({
    //   email: values.email,
    //   password: values.password,
    // })
    //   .then((_response) => {
    //     toast.success("Account created successfully.");
    //   })
    //   .catch((error) => {
    //     toast.error(String(error));
    //   });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={() => void form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="me@example.com" {...field} />
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
              <div className="flex items-center">
                <FormLabel>Password</FormLabel>
              </div>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Create an account
        </Button>
      </form>
    </Form>
  );
};
