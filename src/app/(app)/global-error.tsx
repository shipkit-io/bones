/* Global Error Boundary
 * Last resort: renders only when the root layout itself throws. It replaces
 * the whole document, so no stylesheet, fonts, or providers are available.
 * Everything here is inline on purpose. Route errors normally stop at
 * (app)/error.tsx and never reach this file.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
"use client";

import type { CSSProperties } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const styles = {
  body: {
    margin: 0,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    background: "#fafafa",
    color: "#171717",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    textAlign: "center",
    WebkitFontSmoothing: "antialiased",
  },
  card: { maxWidth: "28rem" },
  title: { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 0.75rem" },
  text: { color: "#525252", lineHeight: 1.6, margin: "0 0 1.5rem" },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" },
  primary: {
    background: "#171717",
    color: "#fafafa",
    border: "1px solid #171717",
    borderRadius: "0.5rem",
    padding: "0.6rem 1.1rem",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  secondary: {
    display: "inline-block",
    background: "#fff",
    color: "#171717",
    border: "1px solid #d4d4d4",
    borderRadius: "0.5rem",
    padding: "0.6rem 1.1rem",
    fontSize: "0.9rem",
    fontWeight: 500,
    textDecoration: "none",
  },
  meta: { fontSize: "0.75rem", color: "#737373", marginTop: "1.5rem" },
  pre: {
    marginTop: "1.5rem",
    padding: "0.75rem",
    background: "#f5f5f5",
    borderRadius: "0.5rem",
    fontSize: "0.75rem",
    textAlign: "left",
    overflow: "auto",
  },
} satisfies Record<string, CSSProperties>;

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <body style={styles.body}>
        <main style={styles.card}>
          <h1 style={styles.title}>Something went wrong</h1>
          <p style={styles.text}>
            The rest of the site is working. Try again, or head back to the homepage.
          </p>
          <div style={styles.actions}>
            <button type="button" onClick={reset} style={styles.primary}>
              Try again
            </button>
            {/* Plain <a>, not <Link>: this page renders outside the app router, and a
                full reload is what we want after a root-layout failure. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={styles.secondary}>
              Go to homepage
            </a>
          </div>
          {error.digest && !isDevelopment && <p style={styles.meta}>Reference {error.digest}</p>}
          {isDevelopment && <pre style={styles.pre}>{error.message}</pre>}
        </main>
      </body>
    </html>
  );
}
