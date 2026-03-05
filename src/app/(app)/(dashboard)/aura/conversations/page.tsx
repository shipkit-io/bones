import Link from "next/link";
import { getConversations } from "@/server/actions/aura/queries";

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">
          {conversations.length} processed recordings
        </p>
      </div>

      {conversations.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No conversations yet. Process audio files with{" "}
          <code>aura process --db &lt;file&gt;</code>
        </p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/aura/conversations/${conv.id}`}
              className="block p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {conv.recordingFilename ?? "Unknown"}
                </span>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {conv.recordingDuration && (
                    <span>
                      {Math.round(conv.recordingDuration)}s
                    </span>
                  )}
                  <span>{conv.createdAt?.toLocaleDateString()}</span>
                </div>
              </div>
              {conv.summary && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
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
    </div>
  );
}
