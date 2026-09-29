"use client";

import { ExternalLink, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverForm,
  PopoverHeader,
  PopoverRoot,
  PopoverSubmitButton,
  PopoverTextarea,
  PopoverTrigger,
} from "@/components/ui/cults/animated-popover";
import { submitFeedback } from "@/server/actions/feedback-actions";

export const FeedbackPopover = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [mailtoLink, setMailtoLink] = useState<string | null>(null);

  const handleSubmit = async (content: string) => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setShowEmailFallback(false);
    setFeedbackContent(content);

    try {
      const result = await submitFeedback({
        content,
        source: "popover",
      });

      if (result.success) {
        if (result.requiresEmailFallback) {
          setShowEmailFallback(true);
          if (result.mailtoLink) setMailtoLink(result.mailtoLink);
        } else {
          setSuccess(true);
        }
      } else {
        setError(result.error ?? "Failed to send feedback. Please try again.");
      }
    } catch (error) {
      setError("Failed to send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailFallback = () => {
    if (mailtoLink) window.open(mailtoLink, "_blank");
    setSuccess(true);
    setShowEmailFallback(false);
  };

  return (
    <div>
      <PopoverRoot>
        <PopoverTrigger disabled={loading}>
          {loading ? <span className="">Sending...</span> : "Feedback"}
        </PopoverTrigger>
        <PopoverContent align="end">
          <PopoverForm onSubmit={(data) => void handleSubmit(data)}>
            <PopoverHeader>Let us know what you think</PopoverHeader>
            <PopoverTextarea />
            <PopoverFooter>
              <PopoverCloseButton />
              <PopoverSubmitButton />
            </PopoverFooter>
          </PopoverForm>
        </PopoverContent>
      </PopoverRoot>
      <div className="mt-2 space-y-2">
        {success && <span className="text-green-500">Sent 🚀</span>}
        {error && <span className="text-red-500">{error}</span>}
        {showEmailFallback && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
              <div className="space-y-2">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Email service not configured. Click to open your email client:
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleEmailFallback}
                  className="h-7 bg-blue-600 px-2 text-xs text-white hover:bg-blue-700"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Open Email
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
