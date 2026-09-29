"use client";

import { AskAiGroup } from "@emblemvault/ask-ai";

interface AskAiButtonsProps {
  content: string;
  goal?: string;
  className?: string;
}

export const AskAiButtons = ({
  content,
  goal = "Summarize this page",
  className,
}: AskAiButtonsProps) => {
  return (
    <div className={className}>
      <AskAiGroup
        goal={goal}
        content={content}
        services={{
          claude: true,
          chatgpt: true,
          gemini: true,
          perplexity: true,
        }}
        size="sm"
        variant="outline"
      />
    </div>
  );
};
