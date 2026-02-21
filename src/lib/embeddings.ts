/**
 * Embedding Service - Venice.ai text-embedding-bge-m3
 * Generates 1024-dimension embeddings for semantic search
 */

const VENICE_API_URL = 'https://api.venice.ai/v1/embeddings';
const MODEL = 'text-embedding-bge-m3';
const EMBEDDING_DIMENSION = 1024;

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

interface VeniceEmbeddingResponse {
  data: {
    embedding: number[];
    index: number;
    object: string;
  }[];
  model: string;
  object: string;
}

interface VeniceErrorResponse {
  error?: {
    message: string;
    type: string;
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getApiKey(): string {
  const apiKey = process.env.VENICE_TEXT_EMBEDDING_API_KEY;
  if (!apiKey) {
    throw new Error('VENICE_TEXT_EMBEDDING_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Generate embedding for a text using Venice.ai bge-m3 model
 * @param text - The text to embed (max ~8000 tokens)
 * @returns 1024-dimension float array
 * @throws Error if API call fails after retries
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const apiKey = getApiKey();
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`Generating embedding (attempt ${attempt + 1}/${MAX_RETRIES})...`);
      
      const response = await fetch(VENICE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          input: text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as VeniceErrorResponse;
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        
        // Check for rate limiting or server errors - retryable
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Retryable error: ${errorMessage} (status: ${response.status})`);
        }
        
        // Non-retryable errors
        throw new Error(`Venice API error: ${errorMessage} (status: ${response.status})`);
      }

      const data = await response.json() as VeniceEmbeddingResponse;
      
      if (!data.data?.[0]?.embedding) {
        throw new Error('Invalid response from Venice API: missing embedding data');
      }
      
      const embedding = data.data[0].embedding;
      
      // Validate embedding dimensions
      if (embedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(`Expected ${EMBEDDING_DIMENSION} dimensions, got ${embedding.length}`);
      }
      
      console.log(`✓ Embedding generated: ${embedding.length} dimensions`);
      return embedding;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is the last attempt, throw the error
      if (attempt === MAX_RETRIES - 1) {
        break;
      }
      
      // Check if error is retryable (contains "Retryable error")
      if (!lastError.message.includes('Retryable error')) {
        throw lastError;
      }
      
      // Exponential backoff
      const backoffDelay = INITIAL_DELAY_MS * Math.pow(2, attempt);
      console.log(`Retry ${attempt + 1}/${MAX_RETRIES - 1}: Waiting ${backoffDelay}ms before retry...`);
      await delay(backoffDelay);
    }
  }
  
  throw lastError || new Error('Failed to generate embedding after retries');
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts - Array of texts to embed
 * @returns Array of 1024-dimension float arrays
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }
  
  return embeddings;
}

/**
 * Prepare text for embedding by concatenating relevant fields
 * @param title - Entry title
 * @param summary - Entry summary (optional)
 * @param content - Entry content
 * @param lessonsLearned - Lessons learned (optional)
 * @returns Concatenated text ready for embedding
 */
export function prepareTextForEmbedding(
  title: string,
  content: string,
  summary?: string,
  lessonsLearned?: string
): string {
  const parts: string[] = [title, content];
  
  if (summary?.trim()) {
    parts.push(summary);
  }
  
  if (lessonsLearned?.trim()) {
    parts.push('Lessons learned:', lessonsLearned);
  }
  
  return parts.join('\n\n');
}