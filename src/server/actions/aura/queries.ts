"use server";

import { desc, eq, sql, count } from "drizzle-orm";
import { auraDb, auraSchema } from "@/server/db/aura-db";

const {
  recordings,
  conversations,
  speakers,
  people,
  knowledgeEntries,
  conversationSpeakers,
} = auraSchema;

// ── Dashboard Stats ─────────────────────────────────────────

export async function getDashboardStats() {
  if (!auraDb) return null;

  const [recordingCount] = await auraDb
    .select({ count: count() })
    .from(recordings);
  const [conversationCount] = await auraDb
    .select({ count: count() })
    .from(conversations);
  const [speakerCount] = await auraDb
    .select({ count: count() })
    .from(speakers);
  const [personCount] = await auraDb.select({ count: count() }).from(people);
  const [knowledgeCount] = await auraDb
    .select({ count: count() })
    .from(knowledgeEntries);

  const [totalDuration] = await auraDb
    .select({
      total: sql<number>`coalesce(sum(${recordings.durationSeconds}), 0)`,
    })
    .from(recordings);

  return {
    recordings: recordingCount.count,
    conversations: conversationCount.count,
    speakers: speakerCount.count,
    people: personCount.count,
    knowledgeEntries: knowledgeCount.count,
    totalDurationSeconds: totalDuration.total,
  };
}

// ── Recordings ──────────────────────────────────────────────

export async function getRecordings(limit = 50) {
  if (!auraDb) return [];

  return auraDb
    .select()
    .from(recordings)
    .orderBy(desc(recordings.createdAt))
    .limit(limit);
}

export async function getRecording(id: string) {
  if (!auraDb) return null;

  const [result] = await auraDb
    .select()
    .from(recordings)
    .where(eq(recordings.id, id));
  return result ?? null;
}

// ── Conversations ───────────────────────────────────────────

export async function getConversations(limit = 50) {
  if (!auraDb) return [];

  return auraDb
    .select({
      id: conversations.id,
      recordingId: conversations.recordingId,
      summary: conversations.summary,
      topics: conversations.topics,
      sentiment: conversations.sentiment,
      createdAt: conversations.createdAt,
      recordingFilename: recordings.filename,
      recordingDuration: recordings.durationSeconds,
      numSpeakers: recordings.numSpeakers,
    })
    .from(conversations)
    .leftJoin(recordings, eq(conversations.recordingId, recordings.id))
    .orderBy(desc(conversations.createdAt))
    .limit(limit);
}

export async function getConversation(id: string) {
  if (!auraDb) return null;

  const [result] = await auraDb
    .select()
    .from(conversations)
    .where(eq(conversations.id, id));

  if (!result) return null;

  // Get speakers for this conversation
  const convSpeakers = await auraDb
    .select({
      diarizationLabel: conversationSpeakers.diarizationLabel,
      speechSeconds: conversationSpeakers.speechSeconds,
      speakerName: speakers.name,
      speakerLabel: speakers.label,
      speakerId: speakers.id,
    })
    .from(conversationSpeakers)
    .leftJoin(speakers, eq(conversationSpeakers.speakerId, speakers.id))
    .where(eq(conversationSpeakers.conversationId, id));

  // Get knowledge entries
  const knowledge = await auraDb
    .select()
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.conversationId, id));

  return { ...result, speakers: convSpeakers, knowledge };
}

// ── People ──────────────────────────────────────────────────

export async function getPeople(limit = 100) {
  if (!auraDb) return [];

  return auraDb
    .select({
      id: people.id,
      name: people.name,
      facts: people.facts,
      mentionCount: people.mentionCount,
      relationshipToOwner: people.relationshipToOwner,
      firstMentioned: people.firstMentioned,
      lastMentioned: people.lastMentioned,
      speakerId: people.speakerId,
      speakerName: speakers.name,
    })
    .from(people)
    .leftJoin(speakers, eq(people.speakerId, speakers.id))
    .orderBy(desc(people.mentionCount))
    .limit(limit);
}

export async function getPerson(id: string) {
  if (!auraDb) return null;

  const [result] = await auraDb
    .select()
    .from(people)
    .where(eq(people.id, id));

  if (!result) return null;

  // Get knowledge about this person (match by subject)
  const knowledge = await auraDb
    .select()
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.subject, result.name));

  return { ...result, knowledge };
}

// ── Speakers ────────────────────────────────────────────────

export async function getSpeakers() {
  if (!auraDb) return [];

  return auraDb
    .select({
      id: speakers.id,
      name: speakers.name,
      label: speakers.label,
      isOwner: speakers.isOwner,
      embeddingCount: speakers.embeddingCount,
      totalSpeechSeconds: speakers.totalSpeechSeconds,
      firstSeen: speakers.firstSeen,
      lastSeen: speakers.lastSeen,
    })
    .from(speakers)
    .orderBy(desc(speakers.totalSpeechSeconds));
}

// ── Knowledge ───────────────────────────────────────────────

export async function getKnowledge(limit = 100) {
  if (!auraDb) return [];

  return auraDb
    .select()
    .from(knowledgeEntries)
    .orderBy(desc(knowledgeEntries.createdAt))
    .limit(limit);
}

// ── Morning Briefing ────────────────────────────────────────

export async function getMorningBriefing() {
  if (!auraDb) return null;

  // Last 24 hours of recordings
  const recentRecordings = await auraDb
    .select()
    .from(recordings)
    .where(sql`${recordings.createdAt} > now() - interval '24 hours'`)
    .orderBy(desc(recordings.createdAt));

  // Recent knowledge
  const recentKnowledge = await auraDb
    .select()
    .from(knowledgeEntries)
    .where(
      sql`${knowledgeEntries.createdAt} > now() - interval '24 hours'`
    )
    .orderBy(desc(knowledgeEntries.createdAt));

  // Recent people mentioned
  const recentPeople = await auraDb
    .select()
    .from(people)
    .where(sql`${people.lastMentioned} > now() - interval '24 hours'`)
    .orderBy(desc(people.lastMentioned));

  // Recent conversations
  const recentConversations = await auraDb
    .select({
      id: conversations.id,
      summary: conversations.summary,
      topics: conversations.topics,
      createdAt: conversations.createdAt,
      recordingFilename: recordings.filename,
    })
    .from(conversations)
    .leftJoin(recordings, eq(conversations.recordingId, recordings.id))
    .where(
      sql`${conversations.createdAt} > now() - interval '24 hours'`
    )
    .orderBy(desc(conversations.createdAt));

  const totalDuration = recentRecordings.reduce(
    (sum, r) => sum + (r.durationSeconds ?? 0),
    0
  );

  return {
    recordings: recentRecordings,
    conversations: recentConversations,
    people: recentPeople,
    knowledge: recentKnowledge,
    totalDurationSeconds: totalDuration,
  };
}
