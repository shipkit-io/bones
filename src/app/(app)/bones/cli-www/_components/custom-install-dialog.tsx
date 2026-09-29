"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { Terminal as TerminalIcon } from "lucide-react";
import { type FormEvent, memo, useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatUrlToCommand, isValidCommand, isValidUrl } from "../_lib/registry-service";
import type { InstallationProgress } from "./types";

interface CustomInstallDialogProps {
  onInstall: (command: string) => void;
  installationProgress: InstallationProgress;
}

export const CustomInstallDialog = memo(({ onInstall }: CustomInstallDialogProps) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const trimmedInput = input.trim();
        const finalCommand = isValidUrl(trimmedInput)
          ? formatUrlToCommand(trimmedInput)
          : isValidCommand(trimmedInput)
            ? trimmedInput
            : null;

        if (!finalCommand) {
          throw new Error("Please enter a valid URL or install command");
        }

        setOpen(false);
        setInput("");
        toast.success("Command accepted", {
          description: "Starting installation...",
        });
        onInstall(finalCommand);
      } catch (error) {
        toast.error("Invalid input", {
          description: error instanceof Error ? error.message : "Please check the format",
        });
      } finally {
        setLoading(false);
      }
    },
    [input, onInstall]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!loading || !isOpen) {
        setOpen(isOpen);
      }
    },
    [loading]
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="w-full justify-start"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <TerminalIcon className="mr-2 h-4 w-4" />
          Install from URL or Command
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-4" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Install Component</h4>
            <p className="text-sm text-muted-foreground">
              Enter any component URL or install command.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">URL or Command</Label>
              <Input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="npx shadcn@latest add ..."
                required
                disabled={loading}
              />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Enter an install command or component URL...</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  "Install"
                )}
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
});
CustomInstallDialog.displayName = "CustomInstallDialog";
