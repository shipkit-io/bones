import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getChangelogEntries } from "@/lib/changelog";
import { formatDate } from "@/lib/utils/format-date";

/**
 * The slow part of /changelog (a GitHub fetch, cached for an hour). It lives
 * in its own async component so the page can wrap it in <Suspense> and stream
 * a skeleton, instead of relying on a segment loading.tsx. A segment-level
 * loading file would also wrap /changelog/[...slug] and turn its notFound()
 * into a soft 404.
 */
export async function ChangelogEntries() {
  const entries = await getChangelogEntries();

  if (entries.length === 0) {
    return <p className="text-muted-foreground">No changelog entries yet. Check back soon.</p>;
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />

      {entries.map((entry) => {
        const date = formatDate(entry.publishedAt);
        return (
          <div key={entry.slug} className="relative pb-10 pl-8">
            <div className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-primary bg-background" />

            <div className="mb-1 flex items-center gap-3">
              {entry.badge && (
                <Badge variant="secondary" className="font-mono text-xs">
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
              <h2 className="text-xl font-semibold transition-colors group-hover:text-primary">
                {entry.title}
              </h2>
            </Link>

            {entry.description && <p className="mt-1 text-muted-foreground">{entry.description}</p>}

            {entry.categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {entry.categories.map((cat) => (
                  <Badge key={cat} variant="outline" className="px-1.5 py-0 text-[10px]">
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
