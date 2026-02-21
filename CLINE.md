# Task: vec-001 — Enable pgvector extension and add embedding column

## Objective
Enable pgvector extension on Vercel Postgres and add embedding column to memory_entries table with HNSW index for fast similarity search.

## Acceptance Criteria
- [ ] pgvector extension enabled on database
- [ ] embedding column added to memory_entries (vector(1024))
- [ ] HNSW index created for fast similarity search
- [ ] Migration script tested locally
- [ ] Migration runs successfully on production

## Tech Stack
- Next.js 16
- Vercel Postgres with pgvector
- Venice.ai text-embedding-bge-m3

## Implementation Details

### Migration SQL
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (1024 dimensions for bge-m3)
ALTER TABLE memory_entries 
ADD COLUMN IF NOT EXISTS embedding vector(1024);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_memory_entries_embedding 
ON memory_entries USING hnsw (embedding vector_cosine_ops);
```

### Files to Create
1. `src/lib/db-migrations/001-enable-pgvector.ts` - Migration script
2. `src/lib/db-migrations/run-migrations.ts` - Migration runner
3. `scripts/migrate-pgvector.ts` - CLI script to run migrations

### Verification
- Check extension: `SELECT * FROM pg_extension WHERE extname = 'vector'`
- Check column: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'memory_entries'`
- Check index: `SELECT indexname FROM pg_indexes WHERE tablename = 'memory_entries'`

## Known Pitfalls
- Vercel Postgres requires superuser to enable extensions - may need to use Vercel CLI or dashboard
- HNSW index creation may take time on large tables
- vector(1024) matches Venice.ai bge-m3 model output dimensions

## Commit
When complete: git commit -m "[Agent3-Deb] vec-001: Enable pgvector and add embedding column"