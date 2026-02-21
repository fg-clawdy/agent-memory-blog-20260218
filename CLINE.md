# Task: vec-002 — Create embedding service module

## Objective
Create lib/embeddings.ts service to generate embeddings via Venice.ai API using text-embedding-bge-m3 model.

## Acceptance Criteria
- [ ] lib/embeddings.ts exports generateEmbedding(text: string) function
- [ ] Uses VENICE_TEXT_EMBEDDING_API_KEY from env
- [ ] Calls https://api.venice.ai/v1/embeddings with text-embedding-bge-m3 model
- [ ] Returns 1024-dimension float array
- [ ] Handles API errors with exponential backoff retry
- [ ] Unit tests with mocked Venice API

## Tech Stack
- Next.js 16
- Venice.ai text-embedding-bge-m3 (1024 dimensions)
- Environment: VENICE_TEXT_EMBEDDING_API_KEY

## Implementation Details

### API Endpoint
```
POST https://api.venice.ai/v1/embeddings
Authorization: Bearer {VENICE_TEXT_EMBEDDING_API_KEY}
Content-Type: application/json

{
  "model": "text-embedding-bge-m3",
  "input": "text to embed"
}
```

### Response Format
```json
{
  "data": [{
    "embedding": [0.023, -0.045, ...],  // 1024 floats
    "index": 0,
    "object": "embedding"
  }],
  "model": "text-embedding-bge-m3",
  "object": "list"
}
```

### Error Handling
- Venice API 429 (rate limit) → exponential backoff retry (3 attempts)
- Venice API 500+ → retry with backoff
- Invalid API key → throw clear error
- Network errors → retry with backoff

### Retry Logic
```typescript
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
  try {
    return await callVeniceAPI(text);
  } catch (error) {
    if (attempt === MAX_RETRIES - 1) throw error;
    const backoffDelay = INITIAL_DELAY * Math.pow(2, attempt);
    await delay(backoffDelay);
  }
}
```

## Files to Create
1. `src/lib/embeddings.ts` - Main embedding service
2. `src/lib/embeddings.test.ts` - Unit tests
3. Update `.env.example` with VENICE_TEXT_EMBEDDING_API_KEY

## Environment Variable
```
VENICE_TEXT_EMBEDDING_API_KEY=your_api_key_here
```

## Commit
When complete: git commit -m "[Agent3-Deb] vec-002: Create embedding service module"