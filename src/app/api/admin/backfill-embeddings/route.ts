import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";
import { generateEmbedding, prepareTextForEmbedding } from "@/lib/embeddings";

// POST /api/admin/backfill-embeddings
// Generate embeddings for entries that don't have them yet

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { batch_size = 10, dry_run = false } = body;
    
    if (batch_size < 1 || batch_size > 50) {
      return NextResponse.json(
        { error: "batch_size must be between 1 and 50" },
        { status: 400 }
      );
    }
    
    // Find entries without embeddings
    const entriesToProcess = await sql`
      SELECT id, title, summary, content, lessons_learned
      FROM memory_entries
      WHERE embedding IS NULL
      LIMIT ${batch_size}
    `;
    
    if (entriesToProcess.rows.length === 0) {
      return NextResponse.json({
        message: "No entries need embedding backfill",
        processed: 0,
        remaining: 0,
      });
    }
    
    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
      entries: [] as { id: number; status: string; error?: string }[],
    };
    
    if (dry_run) {
      // Dry run - just report what would be processed
      return NextResponse.json({
        dry_run: true,
        would_process: entriesToProcess.rows.length,
        entries: entriesToProcess.rows.map((e: any) => ({
          id: e.id,
          title: e.title,
        })),
      });
    }
    
    // Process each entry
    for (const entry of entriesToProcess.rows) {
      try {
        const textToEmbed = prepareTextForEmbedding(
          entry.title,
          entry.content,
          entry.summary,
          entry.lessons_learned
        );
        
        const embedding = await generateEmbedding(textToEmbed);
        
        // Update the entry with the embedding
        await sql`
          UPDATE memory_entries
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${entry.id}
        `;
        
        results.processed++;
        results.entries.push({ id: entry.id, status: "success" });
        console.log(`✓ Generated embedding for entry ${entry.id}`);
        
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        results.errors.push(`Entry ${entry.id}: ${errorMsg}`);
        results.entries.push({ id: entry.id, status: "failed", error: errorMsg });
        console.error(`✗ Failed to generate embedding for entry ${entry.id}:`, error);
      }
    }
    
    // Get count of remaining entries without embeddings
    const remainingCount = await sql`
      SELECT COUNT(*) as count
      FROM memory_entries
      WHERE embedding IS NULL
    `;
    const remaining = parseInt(remainingCount.rows[0]?.count || "0");
    
    return NextResponse.json({
      message: results.failed > 0 
        ? `Backfill completed with ${results.failed} failures` 
        : "Backfill completed successfully",
      processed: results.processed,
      failed: results.failed,
      remaining,
      details: results.entries,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
    
  } catch (error: any) {
    console.error("Error during backfill:", error);
    return NextResponse.json(
      { error: "Failed to backfill embeddings: " + error.message },
      { status: 500 }
    );
  }
}