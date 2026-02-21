import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting pgvector migration...');
    
    const results: Record<string, any> = {};
    
    // Check if pgvector extension exists
    const extCheck = await sql`SELECT * FROM pg_extension WHERE extname = 'vector'`;
    results.extensionExists = extCheck.rows.length > 0;
    
    if (!results.extensionExists) {
      // Enable pgvector extension
      console.log('Enabling pgvector extension...');
      await sql`CREATE EXTENSION IF NOT EXISTS vector`;
      results.extensionEnabled = true;
      console.log('✓ pgvector extension enabled');
    } else {
      results.extensionEnabled = false;
      console.log('pgvector extension already enabled');
    }
    
    // Check if embedding column exists
    const colCheck = await sql`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'memory_entries' AND column_name = 'embedding'
    `;
    results.columnExists = colCheck.rows.length > 0;
    
    if (!results.columnExists) {
      // Add embedding column
      console.log('Adding embedding column to memory_entries...');
      await sql`ALTER TABLE memory_entries ADD COLUMN embedding vector(1024)`;
      results.columnAdded = true;
      console.log('✓ embedding column added (vector(1024))');
    } else {
      results.columnAdded = false;
      console.log('embedding column already exists');
    }
    
    // Check if HNSW index exists
    const idxCheck = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'memory_entries' AND indexname = 'idx_memory_entries_embedding'
    `;
    results.indexExists = idxCheck.rows.length > 0;
    
    if (!results.indexExists) {
      // Create HNSW index
      console.log('Creating HNSW index for fast similarity search...');
      await sql`CREATE INDEX idx_memory_entries_embedding ON memory_entries USING hnsw (embedding vector_cosine_ops)`;
      results.indexCreated = true;
      console.log('✓ HNSW index created');
    } else {
      results.indexCreated = false;
      console.log('HNSW index already exists');
    }
    
    // Final verification
    const verification = await sql`
      SELECT 
        (SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector') as has_vector,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'memory_entries' AND column_name = 'embedding') as has_column,
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'memory_entries' AND indexname = 'idx_memory_entries_embedding') as has_index
    `;
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Verification:', verification.rows[0]);
    
    return NextResponse.json({
      success: true,
      message: 'pgvector migration completed',
      results: {
        ...results,
        verification: verification.rows[0]
      }
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}