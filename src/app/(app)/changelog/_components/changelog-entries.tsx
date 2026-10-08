import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getChangelogEntries } from "@/lib/changelog";
import { type ChangelogEntry, describeEntrySize } from "@/lib/changelog-types";
import { formatDate } from "@/lib/utils/format-date";

/** How many releases render open before the "Show older releases" disclosure.
 *  The rest stay in the SSR DOM so Cmd+F and crawlers still see them. */
const VISIBLE_RELEASES = 15;

/**
 * The slow part of /changelog. It lives in its own async component so the
 * page can wrap it in <Suspense> and stream a skeleton, instead of relying on
 * a segment loading.tsx. A segment-level loading file would also wrap
 * /changelog/[...slug] and turn its notFound() into a soft 404.
 */
export async function ChangelogEntries() {
  await headers();
  const entries = await getChangelogEntries();

  if (entries.length === 0) {
    return <p className="text-muted-foreground">No changelog entries yet. Check back soon.</p>;
  }

  const visible = entries.slice(0, VISIBLE_RELEASES);
  const hidden = entries.slice(VISIBLE_RELEASES);

  return (
    <div className="relative space-y-0">
      <div className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />

      {visible.map(renderEntry)}

      {hidden.length > 0 && (
        <details className="group">
          <summary className="relative list-none cursor-pointer select-none pb-10 pl-8 text-sm text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span className="absolute top-1.5 left-0 h-[15px] w-[15px] rounded-full border-2 border-muted-foreground/40 bg-background" />
            <span className="group-open:hidden">
              Show {hidden.length} older release{hidden.length === 1 ? "" : "s"}
            </span>
            <span className="hidden group-open:inline">Hide older releases</span>
          </summary>
          {hidden.map(renderEntry)}
        </details>
      )}
    </div>
  );
}

function renderEntry(entry: ChangelogEntry) {
  const date = formatDate(entry.publishedAt);
  const size = describeEntrySize(entry);
  return (
    <div key={entry.slug} className="relative pb-10 pl-8">
      <div className="absolute top-1.5 left-0 h-[15px] w-[15px] rounded-full border-2 border-primary bg-background" />

      <div className="mb-1 flex items-center gap-3">
        {entry.badge && (
          <Badge variant="secondary" className="font-mono text-xs">
            {entry.badge}
          </Badge>
        )}
        {date && <span className="text-sm text-muted-foreground">{date}</span>}
        {size && <span className="text-xs text-muted-foreground">{size}</span>}
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
}
