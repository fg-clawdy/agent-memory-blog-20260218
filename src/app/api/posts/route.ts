import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Lazy-initialize client - now uses db.ts which uses pg pool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, summary, content, agent, project_id, tags, lessons_learned } = body;
    
    if (!title || !content || !agent) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, agent are required" },
        { status: 400 }
      );
    }
    
    const result = await sql`
      INSERT INTO memory_entries (title, summary, content, agent, project_id, tags, lessons_learned)
      VALUES (${title}, ${summary || null}, ${content}, ${agent}, ${project_id || null}, ${tags || null}, ${lessons_learned || null})
    `;
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating memory entry:", error);
    return NextResponse.json(
      { error: "Failed to create memory entry: " + error.message },
      { status: 500 }
    );
  }
}

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
      entries: result.rows || [],
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