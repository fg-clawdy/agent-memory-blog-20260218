import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function initDb() {
  // Create admin_users table
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  
  // Create api_tokens table
  await sql`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id SERIAL PRIMARY KEY,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      agent_tag VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      last_used_at TIMESTAMP,
      revoked_at TIMESTAMP,
      is_revoked BOOLEAN DEFAULT FALSE
    )
  `;
  
  // Create memory_entries table  
  await sql`
    CREATE TABLE IF NOT EXISTS memory_entries (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      summary TEXT,
      content TEXT NOT NULL,
      agent VARCHAR(100) NOT NULL,
      project_id VARCHAR(100),
      tags TEXT[],
      lessons_learned TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  
  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_entries(agent)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_memory_date ON memory_entries(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_memory_project ON memory_entries(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_tokens_revoked ON api_tokens(is_revoked)`;
  
  return { success: true, message: 'Database tables created successfully' };
}

export async function GET() {
  try {
    const result = await initDb();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize database' },
      { status: 500 }
    );
  }
}