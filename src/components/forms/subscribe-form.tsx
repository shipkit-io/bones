"use client";

import { ArrowRightIcon } from "@radix-ui/react-icons";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addAudienceUser } from "@/server/actions/resend-actions";

export const SubscribeForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("loading");

    try {
      const result = await addAudienceUser(email);

      if (result.success) {
        setStatus("success");
        setEmail("");
        toast.success("Subscribed!", {
          description: "You've been successfully subscribed to our newsletter.",
        });
      } else {
        console.error("Error adding contact:", result.error);
        setStatus("error");
        toast.error("Subscription failed", {
          description: result.error ?? "Failed to subscribe. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
      toast.error("Subscription failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      // Reset status after a delay
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md">
      <p className="">Sign up to be notified of new features and updates.</p>
      <div className="relative flex items-center justify-center">
        <Input
          type="email"
          placeholder="me@shipkit.io"
          className=""
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="outline"
          disabled={status === "loading"}
          className={cn(
            "absolute top-0 right-0 bottom-0 z-10 rounded-s-none border-0 border-s-0 bg-transparent text-primary"
          )}
        >
          {status === "loading" ? (
            "Subscribing..."
          ) : (
            <>
              Subscribe
              <ArrowRightIcon className="ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
