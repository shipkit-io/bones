import type { Metadata } from "next";
import { noIndexRobots } from "@/config/metadata";

// Auth utility pages are deliberately excluded from the sitemap; mark them
// noindex so crawlers agree with that choice (Ahrefs "Indexable page not in
// sitemap", LAC-3521).
export const metadata: Metadata = {
  robots: noIndexRobots,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container grid place-items-center py-header">
      {children}
    </div>
  );
}
