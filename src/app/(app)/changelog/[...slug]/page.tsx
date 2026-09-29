import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { constructMetadata } from "@/config/metadata";
import { siteConfig } from "@/config/site-config";
import { getChangelogEntries, getChangelogEntry } from "@/lib/changelog";
import { describeEntrySize } from "@/lib/changelog-types";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTimeAttribute } from "@/lib/utils/format-date";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const entries = await getChangelogEntries();
  return entries.map((entry) => ({
    slug: entry.slug.includes("/") ? entry.slug.split("/") : [entry.slug],
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug.join("/");
  const entry = await getChangelogEntry(slug);

  if (!entry) {
    return constructMetadata({
      title: `Changelog | ${siteConfig.title}`,
    });
  }

  return constructMetadata({
    title: `${entry.title} | ${siteConfig.title} Changelog`,
    description: entry.description,
  });
}

export default async function ChangelogEntryPage({ params }: Props) {
  await headers();
  const resolvedParams = await params;
  const slug = resolvedParams.slug.join("/");
  const entry = await getChangelogEntry(slug);

  if (!entry) {
    notFound();
  }

  const dateTimeAttr = formatDateTimeAttribute(entry.publishedAt);
  const displayDate = formatDate(entry.publishedAt);
  const entrySize = describeEntrySize(entry);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/changelog"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mb-8 h-auto p-0 text-muted-foreground hover:text-foreground"
        )}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Changelog
      </Link>

      <article>
        <header className="mb-8 border-b pb-6">
          <div className="mb-2 flex items-center gap-3">
            {entry.badge && (
              <Badge variant="secondary" className="font-mono">
                {entry.badge}
              </Badge>
            )}
            {displayDate && (
              <time dateTime={dateTimeAttr} className="text-sm text-muted-foreground">
                {displayDate}
              </time>
            )}
            {entrySize && <span className="text-xs text-muted-foreground">{entrySize}</span>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{entry.title}</h1>
          {entry.description && (
            <p className="mt-2 text-lg text-muted-foreground">{entry.description}</p>
          )}
        </header>

        <div className="prose max-w-none prose-neutral dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
