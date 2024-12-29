import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useCopyToClipboard } from "../../../src/hooks/use-copy-to-clipboard";

describe("useCopyToClipboard", () => {
    // Mock clipboard API
    const mockWriteText = vi.fn(() => Promise.resolve());
    const originalNavigator = global.navigator;

    beforeEach(() => {
        vi.useFakeTimers();
        Object.defineProperty(global, "navigator", {
            value: {
                clipboard: {
                    writeText: mockWriteText,
                },
            },
            writable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        Object.defineProperty(global, "navigator", {
            value: originalNavigator,
            writable: true,
        });
    });

    test("should copy text to clipboard and set isCopied to true", async () => {
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(mockWriteText).toHaveBeenCalledWith("test text");
        expect(result.current.isCopied).toBe(true);
    });

    test("should reset isCopied after timeout", async () => {
        const { result } = renderHook(() => useCopyToClipboard({ timeout: 1000 }));

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(result.current.isCopied).toBe(true);

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.isCopied).toBe(false);
    });

    test("should call onCopy callback when provided", async () => {
        const onCopy = vi.fn();
        const { result } = renderHook(() => useCopyToClipboard({ onCopy }));

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(onCopy).toHaveBeenCalled();
    });

    test("should not copy empty text", async () => {
        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard("");
        });

        expect(mockWriteText).not.toHaveBeenCalled();
        expect(result.current.isCopied).toBe(false);
    });

    test("should handle missing clipboard API gracefully", async () => {
        Object.defineProperty(global, "navigator", {
            value: {},
            writable: true,
        });

        const { result } = renderHook(() => useCopyToClipboard());

        await act(async () => {
            result.current.copyToClipboard("test text");
        });

        expect(result.current.isCopied).toBe(false);
    });
});
