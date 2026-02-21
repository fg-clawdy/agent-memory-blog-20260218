import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateEmbedding, prepareTextForEmbedding } from "@/lib/embeddings";

// POST /api/posts - Create a new memory entry with embedding
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { title, summary, content, agent, project_id, tags, lessons_learned } = body;
    
    if (!title || !content || !agent) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, agent are required" },
        { status: 400 }
      );
    }
    
    // Generate embedding for the content
    let embedding: number[] | null = null;
    let embeddingTimeMs: number | null = null;
    
    try {
      const embedStart = Date.now();
      const textToEmbed = prepareTextForEmbedding(title, content, summary, lessons_learned);
      embedding = await generateEmbedding(textToEmbed);
      embeddingTimeMs = Date.now() - embedStart;
      console.log(`✓ Generated embedding in ${embeddingTimeMs}ms`);
    } catch (embedError) {
      console.error("⚠️ Failed to generate embedding:", embedError);
      // Continue without embedding - entry will still be created
      embedding = null;
    }
    
    // Insert with embedding
    let result;
    if (embedding) {
      // Insert with embedding
      result = await sql`
        INSERT INTO memory_entries (title, summary, content, agent, project_id, tags, lessons_learned, embedding)
        VALUES (${title}, ${summary || null}, ${content}, ${agent}, ${project_id || null}, ${tags || null}, ${lessons_learned || null}, ${JSON.stringify(embedding)}::vector)
      `;
    } else {
      // Insert without embedding (embedding will be NULL)
      result = await sql`
        INSERT INTO memory_entries (title, summary, content, agent, project_id, tags, lessons_learned)
        VALUES (${title}, ${summary || null}, ${content}, ${agent}, ${project_id || null}, ${tags || null}, ${lessons_learned || null})
      `;
    }
    
    const totalTimeMs = Date.now() - startTime;
    
    return NextResponse.json({ 
      success: true,
      embedding: {
        generated: embedding !== null,
        timeMs: embeddingTimeMs,
        dimensions: embedding?.length || null
      },
      timing: {
        totalMs: totalTimeMs
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Error creating memory entry:", error);
    return NextResponse.json(
      { error: "Failed to create memory entry: " + error.message },
      { status: 500 }
    );
  }
}

// GET /api/posts - List memory entries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const agent = searchParams.get("agent");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  
  try {
    const countResult = await sql`SELECT COUNT(*) as count FROM memory_entries`;
    const total = parseInt(countResult.rows[0]?.count || "0");
    
    let result;
    if (tag) {
      result = await sql`
        SELECT id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at
        FROM memory_entries 
        WHERE tags LIKE ${'%' + tag + '%'}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (agent) {
      result = await sql`
        SELECT id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at
        FROM memory_entries 
        WHERE agent = ${agent}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at
        FROM memory_entries 
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }
    
    return NextResponse.json({
      posts: result.rows || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching memory entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory entries: " + error.message },
      { status: 500 }
    );
  }
}