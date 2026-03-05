/**
 * Aura database schema — maps to tables created by the Python pipeline.
 * These tables are NOT prefixed (the Python side creates them directly).
 * Column names match the actual postgres columns on Otto.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ── Recordings ──────────────────────────────────────────────

export const recordings = pgTable(
  "recordings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    filename: varchar("filename", { length: 512 }).notNull(),
    fileHash: varchar("file_hash", { length: 64 }).notNull(),
    fileSizeBytes: integer("file_size_bytes"),
    durationSeconds: doublePrecision("duration_seconds").notNull(),
    sampleRate: integer("sample_rate"),
    language: varchar("language", { length: 10 }),
    speechRatio: doublePrecision("speech_ratio"),
    numSpeakers: integer("num_speakers"),
    numSegments: integer("num_segments"),
    processingTimeSeconds: doublePrecision("processing_time_seconds"),
    status: varchar("status", { length: 20 }).default("pending"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow(),
    processedAt: timestamp("processed_at"),
    outputDir: varchar("output_dir", { length: 512 }),
  },
  (t) => [
    uniqueIndex("ix_recordings_file_hash").on(t.fileHash),
    index("ix_recordings_status").on(t.status),
  ]
);

// ── Speakers ────────────────────────────────────────────────

export const speakers = pgTable("speakers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }),
  label: varchar("label", { length: 50 }),
  isOwner: boolean("is_owner").default(false),
  embedding: json("embedding"), // float[] stored as JSON
  embeddingCount: integer("embedding_count").default(1),
  totalSpeechSeconds: doublePrecision("total_speech_seconds").default(0),
  firstSeen: timestamp("first_seen").defaultNow(),
  lastSeen: timestamp("last_seen").defaultNow(),
  metadata: json("metadata"),
});

// ── Conversations ───────────────────────────────────────────

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recordingId: uuid("recording_id")
      .notNull()
      .references(() => recordings.id),
    summary: text("summary"),
    topics: text("topics").array(), // varchar[] in postgres
    sentiment: varchar("sentiment", { length: 20 }),
    transcriptText: text("transcript_text"),
    transcriptJson: json("transcript_json"),
    extractionJson: json("extraction_json"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("ix_conversations_created").on(t.createdAt)]
);

// ── Conversation ↔ Speaker junction ─────────────────────────

export const conversationSpeakers = pgTable("conversation_speakers", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id),
  speakerId: uuid("speaker_id")
    .notNull()
    .references(() => speakers.id),
  diarizationLabel: varchar("diarization_label", { length: 50 }),
  speechSeconds: doublePrecision("speech_seconds"),
  isOwner: boolean("is_owner").default(false),
});

// ── Knowledge Entries ───────────────────────────────────────

export const knowledgeEntries = pgTable(
  "knowledge_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    kind: varchar("kind", { length: 20 }).notNull(), // fact, commitment, event
    subject: varchar("subject", { length: 256 }),
    content: text("content").notNull(),
    confidence: doublePrecision("confidence"),
    speakerLabel: varchar("speaker_label", { length: 50 }),
    deadline: varchar("deadline", { length: 100 }),
    eventDate: varchar("event_date", { length: 100 }),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("ix_knowledge_kind_subject").on(t.kind, t.subject)]
);

// ── People (extracted from conversations) ───────────────────

export const people = pgTable(
  "people",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 256 }).notNull(),
    speakerId: uuid("speaker_id").references(() => speakers.id),
    relationshipToOwner: varchar("relationship_to_owner", { length: 256 }),
    facts: json("facts"), // string[]
    firstMentioned: timestamp("first_mentioned").defaultNow(),
    lastMentioned: timestamp("last_mentioned").defaultNow(),
    mentionCount: integer("mention_count").default(1),
    metadata: json("metadata"),
  },
  (t) => [index("ix_people_name").on(t.name)]
);

// ── Person ↔ Knowledge junction ─────────────────────────────

export const personKnowledge = pgTable("person_knowledge", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id),
  knowledgeEntryId: uuid("knowledge_entry_id")
    .notNull()
    .references(() => knowledgeEntries.id),
});

// ── Relations ───────────────────────────────────────────────

export const recordingsRelations = relations(recordings, ({ many }) => ({
  conversations: many(conversations),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    recording: one(recordings, {
      fields: [conversations.recordingId],
      references: [recordings.id],
    }),
    speakers: many(conversationSpeakers),
    knowledge: many(knowledgeEntries),
  })
);

export const conversationSpeakersRelations = relations(
  conversationSpeakers,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationSpeakers.conversationId],
      references: [conversations.id],
    }),
    speaker: one(speakers, {
      fields: [conversationSpeakers.speakerId],
      references: [speakers.id],
    }),
  })
);

export const speakersRelations = relations(speakers, ({ many }) => ({
  conversations: many(conversationSpeakers),
  people: many(people),
}));

export const peopleRelations = relations(people, ({ one, many }) => ({
  speaker: one(speakers, {
    fields: [people.speakerId],
    references: [speakers.id],
  }),
  knowledge: many(personKnowledge),
}));

export const knowledgeEntriesRelations = relations(
  knowledgeEntries,
  ({ one, many }) => ({
    conversation: one(conversations, {
      fields: [knowledgeEntries.conversationId],
      references: [conversations.id],
    }),
    people: many(personKnowledge),
  })
);

export const personKnowledgeRelations = relations(
  personKnowledge,
  ({ one }) => ({
    person: one(people, {
      fields: [personKnowledge.personId],
      references: [people.id],
    }),
    knowledge: one(knowledgeEntries, {
      fields: [personKnowledge.knowledgeEntryId],
      references: [knowledgeEntries.id],
    }),
  })
);
