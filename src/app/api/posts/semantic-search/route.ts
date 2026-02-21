import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";

// POST /api/posts/semantic-search
// Semantic search using pgvector cosine similarity

interface SemanticSearchRequest {
  query: string;
  agent?: string;
  project_id?: string;
  tags?: string[];
  limit?: number;
  min_similarity?: number;
}

interface MemoryEntryRow {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  agent: string;
  project_id: string;
  tags: string[];
  lessons_learned: string | null;
  created_at: string;
  updated_at: string;
  similarity_score: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: SemanticSearchRequest = await request.json();
    const { query, agent, project_id, tags, limit = 10, min_similarity = 0.7 } = body;
    
    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: "Missing required field: query is required" },
        { status: 400 }
      );
    }
    
    if (limit > 20) {
      return NextResponse.json(
        { error: "Limit cannot exceed 20" },
        { status: 400 }
      );
    }
    
    if (min_similarity < 0 || min_similarity > 1) {
      return NextResponse.json(
        { error: "min_similarity must be between 0 and 1" },
        { status: 400 }
      );
    }
    
    // Step 1: Generate embedding for the query
    let queryEmbedding: number[];
    let queryEmbeddingTimeMs: number;
    
    try {
      const embedStart = Date.now();
      queryEmbedding = await generateEmbedding(query);
      queryEmbeddingTimeMs = Date.now() - embedStart;
      console.log(`✓ Query embedding generated in ${queryEmbeddingTimeMs}ms`);
    } catch (embedError) {
      console.error("Failed to generate query embedding:", embedError);
      return NextResponse.json(
        { error: "Failed to generate query embedding. Please try again later." },
        { status: 503 }
      );
    }
    
    // Step 2: Perform semantic search with cosine similarity
    const searchStartTime = Date.now();
    
    // Use parameterized queries based on filters
    let results;
    
    if (agent && project_id && tags && tags.length > 0) {
      // All filters
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND agent = ${agent}
          AND project_id = ${project_id}
          AND tags && ${tags}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (agent && project_id) {
      // agent + project_id filters
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND agent = ${agent}
          AND project_id = ${project_id}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (agent && tags && tags.length > 0) {
      // agent + tags filters
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND agent = ${agent}
          AND tags && ${tags}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (project_id && tags && tags.length > 0) {
      // project_id + tags filters
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND project_id = ${project_id}
          AND tags && ${tags}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (agent) {
      // agent filter only
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND agent = ${agent}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (project_id) {
      // project_id filter only
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND project_id = ${project_id}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (tags && tags.length > 0) {
      // tags filter only
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND tags && ${tags}
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else {
      // No filters
      results = await sql`
        SELECT 
          id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
        FROM memory_entries
        WHERE embedding IS NOT NULL
          AND 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    }
    
    const searchTimeMs = Date.now() - searchStartTime;
    const totalTimeMs = Date.now() - startTime;
    
    // Format results
    const formattedResults = results.rows.map((row: MemoryEntryRow) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      agent: row.agent,
      project_id: row.project_id,
      tags: row.tags,
      lessons_learned: row.lessons_learned,
      created_at: row.created_at,
      similarity_score: parseFloat(row.similarity_score.toFixed(4)),
    }));
    
    return NextResponse.json({
      results: formattedResults,
      total: formattedResults.length,
      query_embedding_time_ms: queryEmbeddingTimeMs,
      search_time_ms: searchTimeMs,
      total_time_ms: totalTimeMs,
      query: query,
    });
    
  } catch (error: unknown) {
    console.error("Error performing semantic search:", error);
    return NextResponse.json(
      { error: error instanceof Error ? "Failed to perform semantic search: " + error.message : "Failed to perform semantic search: Unknown error" },
      { status: 500 }
    );
  }
}