import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { getChangelogEntries } from "@/lib/changelog";
import { formatDate } from "@/lib/utils/format-date";

export const revalidate = 3600;

export const metadata: Metadata = constructMetadata({
  title: `Changelog | ${siteConfig.title}`,
  description: `See what's new in ${siteConfig.title}. Latest updates, features, and fixes.`,
});

export default async function ChangelogPage() {
  const entries = await getChangelogEntries();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
        <p className="mt-2 text-lg text-muted-foreground">New updates, features, and fixes.</p>
      </header>

      {entries.length === 0 && (
        <p className="text-muted-foreground">No changelog entries yet. Check back soon.</p>
      )}

      <div className="relative space-y-0">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        {entries.map((entry) => {
          const date = formatDate(entry.publishedAt);
          return (
            <div key={entry.slug} className="relative pl-8 pb-10">
              <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-primary bg-background" />

              <div className="flex items-center gap-3 mb-1">
                {entry.badge && (
                  <Badge variant="secondary" className="text-xs font-mono">
                    {entry.badge}
                  </Badge>
                )}
                {date && <span className="text-sm text-muted-foreground">{date}</span>}
                <span className="text-xs text-muted-foreground">
                  {entry.commitCount} commit
                  {entry.commitCount !== 1 ? "s" : ""}
                </span>
              </div>

              <Link href={`/changelog/${entry.slug}`} className="group">
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {entry.title}
                </h2>
              </Link>

              {entry.description && (
                <p className="mt-1 text-muted-foreground">{entry.description}</p>
              )}

              {entry.categories.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {entry.categories.map((cat) => (
                    <Badge key={cat} variant="outline" className="text-[10px] px-1.5 py-0">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
