import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db";

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