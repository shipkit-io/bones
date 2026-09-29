import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/hooks/use-sign-in-redirect-url", () => ({ useSignInRedirectUrl: () => "/sign-in" }));
vi.mock("@/lib/utils/redirect-with-code", () => ({ redirectWithCode: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), info: vi.fn() } }));
// authentication-error imports next-auth, which needs the real Next runtime.
vi.mock("@/lib/errors/authentication-error", () => ({
  AuthenticationError: class extends Error {},
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import GlobalError from "@/app/(app)/global-error";
import { ErrorBoundary } from "@/components/primitives/error-boundary";

/**
 * Both error pages must follow the Next.js contract ({ error, reset }). They
 * previously took `resetAction`, which Next never passes, so "Try again" was
 * a no-op. Visitors must not see raw error messages in production.
 */
const boom = Object.assign(new Error("db password is hunter2"), { digest: "abc123" });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("(app)/error.tsx page (ErrorBoundary)", () => {
  it("calls reset when Try again is clicked", () => {
    const reset = vi.fn();
    render(<ErrorBoundary error={boom} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("offers a way home", () => {
    render(<ErrorBoundary error={boom} reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Go to homepage" })).toHaveAttribute("href", "/");
  });

  it("shows the digest, never the raw message, outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<ErrorBoundary error={boom} reset={vi.fn()} />);
    expect(screen.getByText("Reference abc123")).toBeInTheDocument();
    expect(screen.queryByText(/hunter2/)).not.toBeInTheDocument();
  });

  it("shows the raw message in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(<ErrorBoundary error={boom} reset={vi.fn()} />);
    expect(screen.getByText(/hunter2/)).toBeInTheDocument();
  });
});

describe("(app)/global-error.tsx", () => {
  it("renders a full document with inline styles only and wires reset", () => {
    vi.stubEnv("NODE_ENV", "production");
    const html = renderToStaticMarkup(<GlobalError error={boom} reset={vi.fn()} />);
    expect(html.startsWith("<html")).toBe(true);
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
    expect(html).toContain("Reference abc123");
    expect(html).not.toContain("hunter2");
    // No class attributes: there is no stylesheet when this page renders.
    expect(html).not.toMatch(/class="/);
  });

  it("calls reset when Try again is clicked", () => {
    const reset = vi.fn();
    const { container } = render(<GlobalError error={boom} reset={reset} />);
    fireEvent.click(container.querySelector("button") as HTMLButtonElement);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
