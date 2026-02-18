import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

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
    
    if (result.rowCount === 0) {
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