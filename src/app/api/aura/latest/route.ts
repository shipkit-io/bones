import { NextRequest, NextResponse } from "next/server";
import { getAuraDb } from "@/server/db/aura-db";
import { conversations, recordings, knowledgeEntries, speakers, people } from "@/server/db/aura-schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("filename");
  
  try {
    const db = getAuraDb();
    
    // Get the most recent conversation (or one matching the filename)
    let conversation;
    if (filename) {
      // Try to find by recording filename
      const recording = await db
        .select()
        .from(recordings)
        .where(eq(recordings.fileName, filename))
        .limit(1);
      
      if (recording.length > 0) {
        const convos = await db
          .select()
          .from(conversations)
          .where(eq(conversations.recordingId, recording[0].id))
          .limit(1);
        conversation = convos[0];
      }
    }
    
    if (!conversation) {
      // Fall back to most recent conversation
      const convos = await db
        .select()
        .from(conversations)
        .orderBy(desc(conversations.createdAt))
        .limit(1);
      conversation = convos[0];
    }
    
    if (!conversation) {
      return NextResponse.json(null, { status: 404 });
    }
    
    // Get associated speakers
    const speakerList = await db
      .select({
        label: speakers.label,
        name: speakers.name,
        total_speech_seconds: speakers.totalSpeechSeconds,
      })
      .from(speakers);
    
    // Get people
    const peopleList = await db
      .select({
        name: people.name,
        facts: people.facts,
        mention_count: people.mentionCount,
      })
      .from(people);
    
    // Get knowledge entries for this conversation
    const knowledge = await db
      .select({
        kind: knowledgeEntries.kind,
        subject: knowledgeEntries.subject,
        content: knowledgeEntries.content,
        confidence: knowledgeEntries.confidence,
      })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.conversationId, conversation.id));
    
    return NextResponse.json({
      id: conversation.id,
      summary: conversation.summary,
      topics: conversation.topics,
      transcript_text: conversation.transcriptText,
      sentiment: conversation.sentiment,
      num_speakers: conversation.numSpeakers,
      duration_seconds: conversation.durationSeconds,
      extraction_json: conversation.extractionJson,
      speakers: speakerList,
      people: peopleList,
      knowledge,
    });
  } catch (error) {
    console.error("Error fetching latest conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
