import { getSpeakers } from "@/server/actions/aura/queries";

export default async function SpeakersPage() {
  const speakers = await getSpeakers();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Speakers</h1>
        <p className="text-muted-foreground">
          {speakers.length} identified voice profiles
        </p>
      </div>

      {speakers.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No speakers registered yet. Process audio with{" "}
          <code>aura process --db</code> to start building voiceprints.
        </p>
      ) : (
        <div className="space-y-3">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className="p-4 rounded-lg border flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-medium relative">
                {(speaker.name || speaker.label || "?")[0]}
                {speaker.isOwner && (
                  <span className="absolute -top-1 -right-1 text-sm">👑</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {speaker.name || speaker.label || "Unknown"}
                  </h3>
                  {speaker.isOwner && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      Owner
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>
                    {Math.round(speaker.totalSpeechSeconds ?? 0)}s speech
                  </span>
                  <span>{speaker.embeddingCount ?? 0} samples</span>
                  {speaker.firstSeen && (
                    <span>
                      First: {speaker.firstSeen.toLocaleDateString()}
                    </span>
                  )}
                  {speaker.lastSeen && (
                    <span>
                      Last: {speaker.lastSeen.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {speaker.id.slice(0, 8)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
