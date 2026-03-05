import Link from "next/link";
import {
  getDashboardStats,
  getMorningBriefing,
} from "@/server/actions/aura/queries";

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function AuraDashboard() {
  const stats = await getDashboardStats();
  const briefing = await getMorningBriefing();

  if (!stats) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Aura</h1>
        <p className="text-muted-foreground">
          Database not connected. Set <code>AURA_DATABASE_URL</code> in your
          environment.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Aura</h1>
        <p className="text-muted-foreground mt-1">
          Your personal knowledge graph from conversations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Recordings"
          value={stats.recordings}
          href="/aura/conversations"
        />
        <StatCard
          label="Conversations"
          value={stats.conversations}
          href="/aura/conversations"
        />
        <StatCard
          label="Speakers"
          value={stats.speakers}
          href="/aura/speakers"
        />
        <StatCard label="People" value={stats.people} href="/aura/people" />
        <StatCard
          label="Knowledge"
          value={stats.knowledgeEntries}
          href="/aura/knowledge"
        />
        <StatCard
          label="Audio"
          value={formatDuration(stats.totalDurationSeconds)}
        />
      </div>

      {/* Morning Briefing */}
      {briefing && (briefing.conversations.length > 0 || briefing.people.length > 0) && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Last 24 Hours</h2>

          {briefing.conversations.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Conversations
              </h3>
              {briefing.conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/aura/conversations/${conv.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{conv.recordingFilename}</span>
                    <span className="text-sm text-muted-foreground">
                      {conv.createdAt?.toLocaleString()}
                    </span>
                  </div>
                  {conv.summary && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {conv.summary}
                    </p>
                  )}
                  {conv.topics && Array.isArray(conv.topics) && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {(conv.topics as string[]).map((topic: string) => (
                        <span
                          key={topic}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {briefing.people.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                People Mentioned
              </h3>
              <div className="flex gap-2 flex-wrap">
                {briefing.people.map((person) => (
                  <Link
                    key={person.id}
                    href={`/aura/people/${person.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                      {person.name[0]}
                    </div>
                    <div>
                      <span className="font-medium text-sm">{person.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {person.mentionCount}x
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickLink
          href="/aura/conversations"
          title="Conversations"
          desc="Browse all processed recordings"
          icon="💬"
        />
        <QuickLink
          href="/aura/people"
          title="People"
          desc="Everyone mentioned in conversations"
          icon="👥"
        />
        <QuickLink
          href="/aura/speakers"
          title="Speakers"
          desc="Identified voice profiles"
          icon="🎙️"
        />
        <QuickLink
          href="/aura/demo"
          title="Demo"
          desc="Upload a WAV and see pipeline output"
          icon="🚀"
        />
        <QuickLink
          href="/aura/knowledge"
          title="Knowledge"
          desc="Facts, commitments, events"
          icon="🧠"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <div className="p-4 rounded-lg border bg-card">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="hover:opacity-80 transition-opacity">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function QuickLink({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="p-5 rounded-lg border hover:bg-accent/50 transition-colors"
    >
      <span className="text-2xl">{icon}</span>
      <h3 className="font-semibold mt-2">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{desc}</p>
    </Link>
  );
}
