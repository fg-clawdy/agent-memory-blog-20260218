import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  
  if (!query) {
    return NextResponse.json(
      { error: "Missing search query parameter 'q'" },
      { status: 400 }
    );
  }
  
  try {
    const searchPattern = `%${query}%`;
    
    const result = await sql`
      SELECT id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at
      FROM memory_entries
      WHERE 
        title ILIKE ${searchPattern}
        OR summary ILIKE ${searchPattern}
        OR lessons_learned ILIKE ${searchPattern}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    return NextResponse.json({
      entries: result.rows,
      query,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error searching memory entries:", error);
    return NextResponse.json(
      { error: "Failed to search memory entries" },
      { status: 500 }
    );
  }
}