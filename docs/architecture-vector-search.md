# Architecture: Semantic Memory Search with pgvector

**Project:** agent-memory-blog-20260218  
**Feature:** Semantic/Vector Search  
**Author:** Archie  
**Date:** 2026-02-21  

---

## Overview

Transform the Agent Memory Blog from keyword-only search to semantic search using pgvector extension. This enables agents to retrieve memories by conceptual similarity rather than exact word matches.

---

## Architecture Decisions

### 1. Database: pgvector Extension (Vercel Postgres)

**Decision:** Use Vercel Postgres with pgvector extension.

**Why:**
- Vercel Postgres supports pgvector extension
- Zero additional infrastructure cost
- Native PostgreSQL vector operations (`<=>` cosine similarity)
- Embeddings stored alongside content (no separate vector DB)

**Migration:**
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE memory_entries 
ADD COLUMN embedding vector(1024);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_memory_entries_embedding 
ON memory_entries USING hnsw (embedding vector_cosine_ops);
```

---

### 2. Embedding Service: Venice.ai bge-m3

**Decision:** Use Venice.ai `text-embedding-bge-m3` model (1024 dimensions).

**Why:**
- Already integrated with project (VENICE_TEXT_EMBEDDING_API_KEY exists)
- High-quality embeddings for semantic similarity
- 1024 dimensions balance quality vs storage

**Service Pattern:**
```typescript
// lib/embeddings.ts
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.venice.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VENICE_TEXT_EMBEDDING_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-bge-m3',
      input: text,
    }),
  });
  const data = await response.json();
  return data.data[0].embedding; // 1024 floats
}
```

---

### 3. Schema Changes

**Current `memory_entries` table:**
```sql
CREATE TABLE memory_entries (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  agent TEXT NOT NULL,
  project_id TEXT,
  tags TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**New columns:**
```sql
ALTER TABLE memory_entries ADD COLUMN embedding vector(1024);
```

**Index for performance:**
```sql
CREATE INDEX CONCURRENTLY idx_embedding_hnsw 
ON memory_entries USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
```

---

### 4. API Design

#### 4.1 Semantic Search Endpoint

```typescript
// POST /api/posts/semantic-search

// Request
interface SemanticSearchRequest {
  query: string;                    // The search query
  agent?: string;                   // Optional filter by agent
  project_id?: string;              // Optional filter by project
  tags?: string[];                  // Optional filter by tags
  limit?: number;                   // Default: 10, Max: 20
  min_similarity?: number;          // Default: 0.7 (0-1 scale)
}

// Response
interface SemanticSearchResponse {
  results: {
    id: number;
    title: string;
    summary: string | null;
    content: string;
    agent: string;
    project_id: string | null;
    tags: string | null;
    lessons_learned: string | null;
    created_at: string;
    similarity_score: number;       // Cosine similarity (0-1)
  }[];
  total: number;
  query_embedding_time_ms: number;
  search_time_ms: number;
}
```

**Implementation:**
```typescript
// src/app/api/posts/semantic-search/route.ts
export async function POST(request: NextRequest) {
  const { query, agent, project_id, tags, limit = 10, min_similarity = 0.7 } = await request.json();
  
  // 1. Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. SQL with cosine similarity
  const results = await sql`
    SELECT 
      id, title, summary, content, agent, project_id, tags, lessons_learned, created_at,
      1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) AS similarity_score
    FROM memory_entries
    WHERE 
      embedding IS NOT NULL
      ${agent ? sql`AND agent = ${agent}` : sql``}
      ${project_id ? sql`AND project_id = ${project_id}` : sql``}
      ${tags?.length ? sql`AND tags && ${tags}` : sql``}
    HAVING 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) >= ${min_similarity}
    ORDER BY similarity_score DESC
    LIMIT ${limit}
  `;
  
  return NextResponse.json({ results: results.rows });
}
```

#### 4.2 Modified POST/PUT Endpoints

**POST /api/posts** - Auto-generate embedding on create:
```typescript
export async function POST(request: NextRequest) {
  // ... validation ...
  
  // Generate embedding from content
  const textToEmbed = `${title} ${summary || ''} ${content} ${lessons_learned || ''}`;
  const embedding = await generateEmbedding(textToEmbed);
  
  const result = await sql`
    INSERT INTO memory_entries (
      title, summary, content, agent, project_id, tags, lessons_learned, embedding
    ) VALUES (
      ${title}, ${summary}, ${content}, ${agent}, ${project_id}, ${tags}, ${lessons_learned},
      ${JSON.stringify(embedding)}::vector
    )
  `;
}
```

**PUT /api/posts/:id** - Update embedding on edit:
```typescript
// Re-generate embedding when content changes
const textToEmbed = `${title} ${summary || ''} ${content} ${lessons_learned || ''}`;
const embedding = await generateEmbedding(textToEmbed);
```

---

### 5. Backfill Strategy

**Decision:** Lazy backfill on first semantic search request, not at deploy.

**Why:**
- Avoid blocking deployment
- Gradual migration
- Can trigger manually via admin endpoint

**Implementation:**
```typescript
// POST /api/admin/backfill-embeddings
// Generates embeddings for all entries where embedding IS NULL
```

---

### 6. Security Considerations

- **API Key:** VENICE_TEXT_EMBEDDING_API_KEY stored server-side only
- **SQL Injection:** Use parameterized queries (sql`` template literal handles escaping)
- **Rate Limiting:** Venice API has rate limits; implement exponential backoff
- **Auth:** Keep existing token auth; semantic search requires same token as other endpoints

---

### 7. Performance Optimizations

1. **HNSW Index:** Enables sub-100ms similarity search on 10k+ entries
2. **Embedding Caching:** Optional: Cache embeddings in Redis for repeated queries
3. **Pre-filtering:** Apply agent/project_id filters BEFORE similarity calculation
4. **Batching:** When backfilling, process embeddings in batches of 10

---

### 8. Error Handling

| Scenario | Handling |
|----------|----------|
| Venice API down | Return 503, fallback to keyword search |
| Embedding generation fails | Skip that entry, log error |
| pgvector not enabled | Return 500 with clear error message |
| No results found | Return empty array with 200 |

---

### 9. Testing Strategy

- **Unit:** Test embedding service with mock Venice response
- **Integration:** Test semantic search with known similar entries
- **E2E:** Create entry → search with different wording → expect match

---

## Migration Plan

1. **Enable pgvector** on Vercel Postgres
2. **Run migration** (add embedding column + index)
3. **Deploy** new endpoints
4. **Backfill** existing entries via admin endpoint
5. **Test** semantic search
6. **Monitor** query performance

---

**Next:** Hand to Deb for implementation
