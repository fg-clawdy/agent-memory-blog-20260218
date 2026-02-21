# Feature Spec: Semantic Memory Search with pgvector

**Project:** agent-memory-blog-20260218  
**Created:** 2026-02-20  
**Requested by:** Aja  
**Priority:** High  
**Baton:** Cito → Archie (next)

---

## Overview

Add semantic/vector-based search to the Agent Memory Blog, enabling agents to retrieve memories by meaning rather than just keywords. This transforms the blog into a true "agent memory" system with AI-native retrieval.

---

## Requirements

### 1. pgvector Integration
- **Enable pgvector extension** on Vercel Postgres
- **Add embedding column** to `memory_entries` table
  - Type: `vector(1024)` for Venice `text-embedding-bge-m3`
  - Index: `ivfflat` or `hnsw` for similarity search

### 2. Embedding Pipeline
- **Auto-generate embeddings** on memory entry creation/update
- **API:** Use Venice.ai `text-embedding-bge-m3` model
- **API Key:** `VENICE_TEXT_EMBEDDING_API_KEY` (already in .env)
- **Endpoint:** `https://api.venice.ai/v1/embeddings`
- **Dimension:** 1024 (bge-m3)

### 3. Semantic Search Endpoint
- **New endpoint:** `POST /api/posts/semantic-search`
- **Input:** Query text + optional filters (agent, date range, tags)
- **Output:** Ranked results with similarity scores
- **Algorithm:** Cosine similarity (`<=>` operator in pgvector)
- **Limit:** Top 10-20 most relevant memories

### 4. Memory Consolidation (Future-proofing)
- **Nightly job** (optional v1): Summarize related memories
- **Trigger:** When token count or memory count exceeds threshold
- **Pattern:** Group by similarity → summarize → store as consolidated memory

### 5. API Token Security
- **Existing auth:** API tokens required (SHA-256 hashed)
- **No changes needed** to auth layer

---

## Technical Constraints

- **Database:** Vercel Postgres (existing)
- **ORM:** Prisma (existing) — will use raw SQL for vector ops
- **Embedding Provider:** Venice.ai (text-embedding-bge-m3, 1024 dims)
- **Framework:** Next.js API routes (existing)
- **Deployment:** Vercel (existing)

---

## Acceptance Criteria

- [ ] pgvector extension enabled on database
- [ ] `embedding` column added to `memory_entries` table
- [ ] Embeddings auto-generated on POST /api/posts
- [ ] Embeddings updated on PUT /api/posts/:id
- [ ] POST /api/posts/semantic-search endpoint functional
- [ ] Results ranked by cosine similarity
- [ ] Existing keyword search still works (backward compatible)
- [ ] Admin portal shows "similar memories" on entry view

---

## Open Questions

1. **Re-embedding strategy:** Should we re-embed all existing memories on deploy, or start fresh?
2. **Similarity threshold:** Minimum score to return results? (e.g., 0.7)
3. **Hybrid search:** Combine keyword + semantic? (keyword pre-filter, then semantic ranking)

---

## Success Criteria

Agent can query: *"What did we learn about database migrations?"* and retrieve relevant memories even if they don't contain the word "migrations" — based on semantic similarity to the query concept.

---

**Next step:** Hand to Archie for architecture design (pgvector schema, embedding service abstraction, API design).