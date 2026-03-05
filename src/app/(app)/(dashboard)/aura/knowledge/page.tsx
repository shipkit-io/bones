import { getKnowledge } from "@/server/actions/aura/queries";

export default async function KnowledgePage() {
  const entries = await getKnowledge();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge</h1>
        <p className="text-muted-foreground">
          {entries.length} extracted facts, commitments, and events
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No knowledge extracted yet.
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                  {entry.kind}
                </span>
                {entry.subject && (
                  <span className="text-xs text-muted-foreground">
                    {entry.subject}
                  </span>
                )}
                {entry.confidence && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {Math.round(entry.confidence * 100)}%
                  </span>
                )}
              </div>
              <p className="text-sm">{entry.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {entry.createdAt?.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
