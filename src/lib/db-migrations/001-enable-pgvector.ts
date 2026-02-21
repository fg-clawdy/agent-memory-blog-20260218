import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting pgvector migration...');
    
    // Enable pgvector extension
    console.log('Enabling pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✓ pgvector extension enabled');
    
    // Add embedding column
    console.log('Adding embedding column to memory_entries...');
    await client.query(`
      ALTER TABLE memory_entries 
      ADD COLUMN IF NOT EXISTS embedding vector(1024)
    `);
    console.log('✓ embedding column added (vector(1024))');
    
    // Create HNSW index
    console.log('Creating HNSW index for fast similarity search...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_memory_entries_embedding 
      ON memory_entries USING hnsw (embedding vector_cosine_ops)
    `);
    console.log('✓ HNSW index created');
    
    // Verify
    const extResult = await client.query(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'
    `);
    console.log('\nVerification:');
    console.log('  pgvector extension:', extResult.rows[0]);
    
    const colResult = await client.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'memory_entries' AND column_name = 'embedding'
    `);
    console.log('  embedding column:', colResult.rows[0]);
    
    const idxResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'memory_entries' AND indexname = 'idx_memory_entries_embedding'
    `);
    console.log('  HNSW index:', idxResult.rows[0]?.indexname || 'Not found');
    
    console.log('\n✅ Migration vec-001 completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  migrate().catch(console.error);
}