"use client";

import { useCallback, useEffect, useState } from "react";

// Types matching the pipeline output
interface ProcessingResult {
  status: "idle" | "uploading" | "processing" | "done" | "error";
  filename?: string;
  error?: string;
  conversation?: {
    id: string;
    summary: string;
    topics: string[];
    transcript_text: string;
    sentiment: string;
    num_speakers: number;
    duration_seconds: number;
    extraction_json: {
      summary?: string;
      topics?: string[];
      people_mentioned?: Array<{
        name: string;
        facts?: string[];
        relationship?: string;
      }>;
      commitments?: Array<{
        description: string;
        speaker: string;
        deadline?: string;
      }>;
      facts?: Array<{
        subject: string;
        fact: string;
        confidence?: number;
      }>;
      events?: Array<{
        description: string;
        date?: string;
      }>;
    };
  };
  speakers?: Array<{
    label: string;
    name: string | null;
    total_speech_seconds: number;
  }>;
  people?: Array<{
    name: string;
    facts: unknown;
    mention_count: number;
  }>;
  knowledge?: Array<{
    kind: string;
    subject: string;
    content: string;
    confidence: number;
  }>;
}

// Demo data from the test recording we already processed
const DEMO_RESULT: ProcessingResult = {
  status: "done",
  filename: "demo_conversation.wav",
  conversation: {
    id: "demo",
    summary:
      "A conversation between two people discussing daily life, plans, and personal topics.",
    topics: ["daily life", "plans", "relationships"],
    transcript_text:
      "(This is a demo — process a real recording to see actual transcripts)",
    sentiment: "neutral",
    num_speakers: 2,
    duration_seconds: 30,
    extraction_json: {
      summary:
        "A conversation between two people discussing daily life, plans, and personal topics.",
      topics: ["daily life", "plans", "relationships"],
      people_mentioned: [
        {
          name: "Diane",
          facts: [
            "Regular conversation partner",
            "Discusses daily activities",
          ],
          relationship: "acquaintance",
        },
        {
          name: "Sheila",
          facts: ["Mentioned in conversation"],
          relationship: "acquaintance",
        },
      ],
      commitments: [
        {
          description: "Follow up on discussed topic",
          speaker: "SPEAKER_00",
        },
      ],
      facts: [
        {
          subject: "Diane",
          fact: "Regular conversation partner",
          confidence: 0.85,
        },
        {
          subject: "Sheila",
          fact: "Known to both speakers",
          confidence: 0.7,
        },
      ],
    },
  },
  speakers: [
    { label: "SPEAKER_00", name: "Diane", total_speech_seconds: 12 },
    { label: "SPEAKER_01", name: "Sheila", total_speech_seconds: 18 },
  ],
  people: [
    { name: "Diane", facts: ["Regular conversation partner"], mention_count: 3 },
    { name: "Sheila", facts: ["Known to both speakers"], mention_count: 2 },
  ],
  knowledge: [
    {
      kind: "fact",
      subject: "Diane",
      content: "Regular conversation partner",
      confidence: 0.85,
    },
    {
      kind: "fact",
      subject: "Sheila",
      content: "Known to both speakers",
      confidence: 0.7,
    },
    {
      kind: "commitment",
      subject: "SPEAKER_00",
      content: "Follow up on discussed topic",
      confidence: 0.8,
    },
  ],
};

const INGEST_URL =
  process.env.NEXT_PUBLIC_AURA_INGEST_URL || "http://100.111.32.113:8080";

export default function AuraDemoPage() {
  const [result, setResult] = useState<ProcessingResult>({ status: "idle" });
  const [dragActive, setDragActive] = useState(false);
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Check server status on mount
  useEffect(() => {
    fetch(`${INGEST_URL}/ingest/status`, { mode: "cors" })
      .then((r) => r.json())
      .then(() => setServerStatus("online"))
      .catch(() => setServerStatus("offline"));
  }, []);

  // Poll for results after upload
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const uploadFile = useCallback(
    async (file: File) => {
      setResult({ status: "uploading", filename: file.name });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("device_id", "web-demo");
        formData.append(
          "timestamp",
          new Date().toISOString()
        );
        formData.append("format", file.name.endsWith(".opus") ? "opus" : "wav");

        const resp = await fetch(`${INGEST_URL}/ingest`, {
          method: "POST",
          body: formData,
          mode: "cors",
        });

        if (!resp.ok) {
          const err = await resp.text();
          setResult({
            status: "error",
            filename: file.name,
            error: `Upload failed: ${resp.status} ${err}`,
          });
          return;
        }

        const data = await resp.json();
        setResult({
          status: "processing",
          filename: data.filename || file.name,
        });

        // Poll the dashboard API for results (check every 10s for up to 10 min)
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          if (attempts > 60) {
            clearInterval(interval);
            setResult((prev) => ({
              ...prev,
              status: "error",
              error: "Processing timed out. Check the dashboard for results.",
            }));
            return;
          }

          try {
            const checkResp = await fetch(`/api/aura/latest?filename=${encodeURIComponent(data.filename || file.name)}`);
            if (checkResp.ok) {
              const conversation = await checkResp.json();
              if (conversation?.id) {
                clearInterval(interval);
                setResult({
                  status: "done",
                  filename: data.filename || file.name,
                  conversation,
                  speakers: conversation.speakers,
                  people: conversation.people,
                  knowledge: conversation.knowledge,
                });
              }
            }
          } catch {
            // Keep polling
          }
        }, 10000);
        setPollInterval(interval);
      } catch (err) {
        setResult({
          status: "error",
          filename: file.name,
          error: `Upload error: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Aura Demo</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a WAV file to process through the Aura pipeline, or view a demo
          result.
        </p>
      </div>

      {/* Server Status */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            serverStatus === "online"
              ? "bg-green-500"
              : serverStatus === "offline"
                ? "bg-red-500"
                : "bg-yellow-500 animate-pulse"
          }`}
        />
        <span className="text-muted-foreground">
          Processing server:{" "}
          {serverStatus === "online"
            ? "Online"
            : serverStatus === "offline"
              ? "Offline"
              : "Checking..."}
        </span>
      </div>

      {/* Upload Zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {result.status === "idle" || result.status === "error" ? (
          <>
            <div className="text-4xl">🎙️</div>
            <p className="mt-4 text-lg font-medium">
              Drop a WAV file here to process
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or click to select a file
            </p>
            <input
              type="file"
              accept=".wav,.opus,.mp3,.m4a,.ogg,.flac"
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
              style={{ position: "absolute", inset: 0 }}
            />
            <div className="relative mt-4">
              <label
                htmlFor="file-upload"
                className="inline-flex cursor-pointer items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Select File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".wav,.opus,.mp3,.m4a,.ogg,.flac"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </div>
            {result.status === "error" && (
              <p className="mt-4 text-sm text-red-500">{result.error}</p>
            )}
          </>
        ) : result.status === "uploading" ? (
          <div className="space-y-2">
            <div className="text-4xl animate-bounce">📤</div>
            <p className="text-lg font-medium">
              Uploading {result.filename}...
            </p>
          </div>
        ) : result.status === "processing" ? (
          <div className="space-y-2">
            <div className="text-4xl animate-spin">⚙️</div>
            <p className="text-lg font-medium">Processing audio...</p>
            <p className="text-sm text-muted-foreground">
              Running: VAD → Transcription → Diarization → Speaker ID →
              Knowledge Extraction
            </p>
            <p className="text-xs text-muted-foreground">
              This can take 1-3 minutes for a 30s file. Checking every 10s...
            </p>
          </div>
        ) : null}
      </div>

      {/* Demo Button */}
      {result.status === "idle" && (
        <div className="text-center">
          <button
            onClick={() => setResult(DEMO_RESULT)}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            📋 Load Demo Result
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            See what pipeline output looks like (pre-processed sample)
          </p>
        </div>
      )}

      {/* Reset */}
      {result.status !== "idle" && result.status !== "uploading" && result.status !== "processing" && (
        <div className="text-center">
          <button
            onClick={() => {
              if (pollInterval) clearInterval(pollInterval);
              setResult({ status: "idle" });
            }}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
          >
            ← Upload Another
          </button>
        </div>
      )}

      {/* Results */}
      {result.status === "done" && result.conversation && (
        <div className="space-y-6">
          {/* Summary */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Summary</h2>
            <p className="mt-2 text-muted-foreground">
              {result.conversation.extraction_json?.summary ||
                result.conversation.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                result.conversation.extraction_json?.topics ||
                result.conversation.topics ||
                []
              ).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {topic}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="text-2xl font-bold">
                  {result.conversation.num_speakers}
                </div>
                <div className="text-muted-foreground">Speakers</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(result.conversation.duration_seconds)}s
                </div>
                <div className="text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {result.conversation.sentiment || "neutral"}
                </div>
                <div className="text-muted-foreground">Sentiment</div>
              </div>
            </div>
          </section>

          {/* People */}
          {result.conversation.extraction_json?.people_mentioned &&
            result.conversation.extraction_json.people_mentioned.length > 0 && (
              <section className="rounded-xl border bg-card p-6">
                <h2 className="text-xl font-semibold">People Mentioned</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {result.conversation.extraction_json.people_mentioned.map(
                    (person) => (
                      <div
                        key={person.name}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">👤</span>
                          <div>
                            <div className="font-semibold">{person.name}</div>
                            {person.relationship && (
                              <div className="text-xs text-muted-foreground">
                                {person.relationship}
                              </div>
                            )}
                          </div>
                        </div>
                        {person.facts && person.facts.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {person.facts.map((fact, i) => (
                              <li
                                key={i}
                                className="text-sm text-muted-foreground"
                              >
                                • {fact}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          {/* Speakers */}
          {result.speakers && result.speakers.length > 0 && (
            <section className="rounded-xl border bg-card p-6">
              <h2 className="text-xl font-semibold">Speaker Identification</h2>
              <div className="mt-4 space-y-3">
                {result.speakers.map((speaker) => (
                  <div
                    key={speaker.label}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🎤</span>
                      <div>
                        <div className="font-medium">
                          {speaker.name || speaker.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {speaker.label}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.round(speaker.total_speech_seconds)}s speech
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Knowledge */}
          {result.knowledge && result.knowledge.length > 0 && (
            <section className="rounded-xl border bg-card p-6">
              <h2 className="text-xl font-semibold">Extracted Knowledge</h2>
              <div className="mt-4 space-y-3">
                {result.knowledge.map((entry, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          entry.kind === "fact"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : entry.kind === "commitment"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : entry.kind === "event"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                        }`}
                      >
                        {entry.kind}
                      </span>
                      <span className="text-sm font-medium">
                        {entry.subject}
                      </span>
                      {entry.confidence && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {Math.round(entry.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entry.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Commitments */}
          {result.conversation.extraction_json?.commitments &&
            result.conversation.extraction_json.commitments.length > 0 && (
              <section className="rounded-xl border bg-card p-6">
                <h2 className="text-xl font-semibold">Commitments</h2>
                <div className="mt-4 space-y-2">
                  {result.conversation.extraction_json.commitments.map(
                    (c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border p-3"
                      >
                        <span className="mt-0.5">📌</span>
                        <div>
                          <div className="text-sm">{c.description}</div>
                          <div className="text-xs text-muted-foreground">
                            by {c.speaker}
                            {c.deadline && ` — due ${c.deadline}`}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          {/* Transcript */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Transcript</h2>
            <pre className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
              {result.conversation.transcript_text}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
