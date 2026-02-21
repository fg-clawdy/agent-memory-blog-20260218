import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { generateEmbedding, prepareTextForEmbedding } from "@/lib/embeddings";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  
  try {
    const numericId = parseInt(id);
    
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: "Invalid entry ID" },
        { status: 400 }
      );
    }
    
    const result = await sql`
      DELETE FROM memory_entries WHERE id = ${numericId}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting memory entry:", error);
    return NextResponse.json(
      { error: "Failed to delete memory entry" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const numericId = parseInt(id);
    
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: "Invalid entry ID" },
        { status: 400 }
      );
    }
    
    const result = await sql`
      SELECT id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at
      FROM memory_entries
      WHERE id = ${numericId}
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching memory entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory entry" },
      { status: 500 }
    );
  }
}

// PUT /api/posts/:id - Update a memory entry and regenerate embedding if content changed
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { id } = await params;
  const startTime = Date.now();
  
  try {
    const numericId = parseInt(id);
    
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: "Invalid entry ID" },
        { status: 400 }
      );
    }
    
    // Get current entry to check what changed
    const currentResult = await sql`
      SELECT title, summary, content, lessons_learned
      FROM memory_entries
      WHERE id = ${numericId}
    `;
    
    if (currentResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }
    
    const currentEntry = currentResult.rows[0];
    
    const body = await request.json();
    const { title, summary, content, agent, project_id, tags, lessons_learned } = body;
    
    // Use provided values or current values
    const newTitle = title ?? currentEntry.title;
    const newSummary = summary ?? currentEntry.summary;
    const newContent = content ?? currentEntry.content;
    const newAgent = agent ?? currentEntry.agent;
    const newProjectId = project_id ?? currentEntry.project_id;
    const newTags = tags ?? currentEntry.tags;
    const newLessonsLearned = lessons_learned ?? currentEntry.lessons_learned;
    
    // Check if content fields changed (these affect embedding)
    const contentChanged = 
      newTitle !== currentEntry.title ||
      newContent !== currentEntry.content ||
      newSummary !== currentEntry.summary ||
      newLessonsLearned !== currentEntry.lessons_learned;
    
    // Regenerate embedding if content changed
    let embedding: number[] | null = null;
    let embeddingTimeMs: number | null = null;
    
    if (contentChanged) {
      try {
        const embedStart = Date.now();
        const textToEmbed = prepareTextForEmbedding(newTitle, newContent, newSummary, newLessonsLearned);
        embedding = await generateEmbedding(textToEmbed);
        embeddingTimeMs = Date.now() - embedStart;
        console.log(`✓ Regenerated embedding in ${embeddingTimeMs}ms`);
      } catch (embedError) {
        console.error("⚠️ Failed to regenerate embedding:", embedError);
        // Continue without new embedding - old embedding remains
        embedding = null;
      }
    }
    
    // Update the entry
    let updateResult;
    if (contentChanged && embedding) {
      // Update with new embedding
      updateResult = await sql`
        UPDATE memory_entries
        SET 
          title = ${newTitle},
          summary = ${newSummary},
          content = ${newContent},
          agent = ${newAgent},
          project_id = ${newProjectId},
          tags = ${newTags},
          lessons_learned = ${newLessonsLearned},
          embedding = ${JSON.stringify(embedding)}::vector,
          updated_at = NOW()
        WHERE id = ${numericId}
      `;
    } else {
      // Update without changing embedding
      updateResult = await sql`
        UPDATE memory_entries
        SET 
          title = ${newTitle},
          summary = ${newSummary},
          content = ${newContent},
          agent = ${newAgent},
          project_id = ${newProjectId},
          tags = ${newTags},
          lessons_learned = ${newLessonsLearned},
          updated_at = NOW()
        WHERE id = ${numericId}
      `;
    }
    
    const totalTimeMs = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: "Entry updated successfully",
      changes: {
        contentChanged,
        embeddingRegenerated: contentChanged && embedding !== null
      },
      timing: {
        embeddingMs: embeddingTimeMs,
        totalMs: totalTimeMs
      }
    });
    
  } catch (error: any) {
    console.error("Error updating memory entry:", error);
    return NextResponse.json(
      { error: "Failed to update memory entry: " + error.message },
      { status: 500 }
    );
  }
}