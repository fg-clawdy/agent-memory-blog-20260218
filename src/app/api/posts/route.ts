import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { authApiRequest } from "@/lib/token-auth";

export async function POST(request: NextRequest) {
  // Validate API token
  const auth = await authApiRequest(request.headers.get("authorization"));
  
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { title, summary, content, agent, project_id, tags, lessons_learned } = body;
    
    // Validate required fields
    if (!title || !content || !agent) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, agent are required" },
        { status: 400 }
      );
    }
    
    // Insert into database
    const result = await sql`
      INSERT INTO memory_entries (title, summary, content, agent, project_id, tags, lessons_learned)
      VALUES (${title}, ${summary || null}, ${content}, ${agent}, ${project_id || null}, ${tags || null}, ${lessons_learned || null})
      RETURNING id, title, summary, content, agent, project_id, tags, lessons_learned, created_at
    `;
    
    const entry = result.rows[0];
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating memory entry:", error);
    return NextResponse.json(
      { error: "Failed to create memory entry" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Get query parameters for filtering
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const agent = searchParams.get("agent");
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  
  try {
    // Get total count first
    const totalResult = await sql`SELECT COUNT(*) as count FROM memory_entries`;
    const total = parseInt(totalResult.rows[0].count);
    
    // Simple query without complex filters (can add later with prepared statements)
    let result;
    
    if (tag) {
      result = await sql`
        SELECT id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at
        FROM memory_entries 
        WHERE $${tag} = ANY(tags)
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
      entries: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching memory entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory entries" },
      { status: 500 }
    );
  }
}