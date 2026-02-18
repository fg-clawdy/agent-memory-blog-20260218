import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createApiToken, getAllApiTokens, revokeApiToken } from "@/lib/token-auth";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const tokens = await getAllApiTokens();
    
    return NextResponse.json({
      tokens: tokens.map(t => ({
        id: t.id,
        name: t.name,
        agent_tag: t.agent_tag,
        created_at: t.created_at,
        last_used_at: t.last_used_at,
        is_revoked: t.is_revoked,
      })),
    });
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch tokens" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { name, agent_tag } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Token name is required" },
        { status: 400 }
      );
    }
    
    const { token } = await createApiToken(name, agent_tag);
    
    return NextResponse.json({ token }, { status: 201 });
  } catch (error) {
    console.error("Error creating token:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "");
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid token ID" },
        { status: 400 }
      );
    }
    
    await revokeApiToken(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking token:", error);
    return NextResponse.json(
      { error: "Failed to revoke token" },
      { status: 500 }
    );
  }
}