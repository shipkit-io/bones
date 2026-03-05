import { notFound } from "next/navigation";
import Link from "next/link";
import { getConversation, getRecording } from "@/server/actions/aura/queries";

interface Segment {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const recording = conversation.recordingId
    ? await getRecording(conversation.recordingId)
    : null;

  const transcriptSegments = (
    (conversation.transcriptJson as { segments?: Segment[] })?.segments ??
    (Array.isArray(conversation.transcriptJson)
      ? (conversation.transcriptJson as Segment[])
      : [])
  );
  const extraction = conversation.extractionJson as Record<string, unknown> | null;
  const topics = (conversation.topics ?? []) as string[];

  // Build speaker name map
  const speakerNames: Record<string, string> = {};
  for (const s of conversation.speakers) {
    if (s.diarizationLabel) {
      speakerNames[s.diarizationLabel] =
        s.speakerName || s.speakerLabel || s.diarizationLabel;
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/aura/conversations"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Conversations
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {recording?.filename ?? "Conversation"}
        </h1>
        {recording && (
          <div className="flex gap-4 text-sm text-muted-foreground mt-1">
            <span>{Math.round(recording.durationSeconds ?? 0)}s</span>
            <span>{recording.numSpeakers} speakers</span>
            <span>{recording.numSegments} segments</span>
            <span>
              Processed in {recording.processingTimeSeconds?.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* Summary */}
      {conversation.summary && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p className="text-muted-foreground">{conversation.summary}</p>
          {topics.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {topics.map((t: string) => (
                <span
                  key={t}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Speakers */}
      {conversation.speakers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Speakers</h2>
          <div className="flex gap-3 flex-wrap">
            {conversation.speakers.map((s) => (
              <div
                key={s.diarizationLabel}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                  {(s.speakerName || s.diarizationLabel || "?")[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {s.speakerName || s.diarizationLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(s.speechSeconds ?? 0).toFixed(0)}s speech
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transcript */}
      {transcriptSegments.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <div className="space-y-2 font-mono text-sm">
            {transcriptSegments.map((seg: Segment, i: number) => (
              <div key={i} className="flex gap-3">
                <span className="text-muted-foreground shrink-0 w-16 text-right">
                  [{formatTime(seg.start)}]
                </span>
                <span className="font-semibold text-primary shrink-0">
                  {speakerNames[seg.speaker] || seg.speaker}:
                </span>
                <span>{seg.text}</span>
              </div>
            ))}
          </div>
        </section>
      ) : conversation.transcriptText ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Transcript</h2>
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {conversation.transcriptText}
          </pre>
        </section>
      ) : null}

      {/* Knowledge */}
      {conversation.knowledge.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Knowledge Extracted</h2>
          <div className="space-y-2">
            {conversation.knowledge.map((k) => (
              <div key={k.id} className="flex gap-3 p-3 rounded-lg border">
                <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground shrink-0 h-fit">
                  {k.kind}
                </span>
                <div>
                  <p className="text-sm">{k.content}</p>
                  {k.subject && (
                    <p className="text-xs text-muted-foreground mt-1">
                      About: {k.subject}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Raw Extraction */}
      {extraction && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Raw extraction data
          </summary>
          <pre className="mt-2 p-4 rounded-lg bg-muted text-xs overflow-auto max-h-96">
            {JSON.stringify(extraction, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
