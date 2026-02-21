/**
 * Unit tests for embedding service
 */

import { generateEmbedding, generateEmbeddings, prepareTextForEmbedding } from './embeddings';

// Mock fetch globally
global.fetch = jest.fn();

describe('generateEmbedding', () => {
  const mockApiKey = 'test-api-key';
  const mockEmbedding = new Array(1024).fill(0).map((_, i) => i / 1024);
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VENICE_TEXT_EMBEDDING_API_KEY = mockApiKey;
  });
  
  afterEach(() => {
    delete process.env.VENICE_TEXT_EMBEDDING_API_KEY;
    jest.useRealTimers();
  });

  it('should generate embedding successfully', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{
          embedding: mockEmbedding,
          index: 0,
          object: 'embedding'
        }],
        model: 'text-embedding-bge-m3',
        object: 'list'
      })
    });

    const result = await generateEmbedding('Test text');
    
    expect(result).toHaveLength(1024);
    expect(result).toEqual(mockEmbedding);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.venice.ai/v1/embeddings',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-bge-m3',
          input: 'Test text'
        })
      })
    );
  });

  it('should throw error for empty text', async () => {
    await expect(generateEmbedding('')).rejects.toThrow('Cannot generate embedding for empty text');
    await expect(generateEmbedding('   ')).rejects.toThrow('Cannot generate embedding for empty text');
  });

  it('should throw error when API key is missing', async () => {
    delete process.env.VENICE_TEXT_EMBEDDING_API_KEY;
    
    await expect(generateEmbedding('Test text')).rejects.toThrow('VENICE_TEXT_EMBEDDING_API_KEY');
  });

  it('should throw error for non-retryable status codes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Bad request' } })
    });

    await expect(generateEmbedding('Test text')).rejects.toThrow('Venice API error: Bad request');
    expect(fetch).toHaveBeenCalledTimes(1); // No retries for 400
  });

  it('should throw error for invalid API key (401)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: 'Invalid API key' } })
    });

    await expect(generateEmbedding('Test text')).rejects.toThrow('Invalid API key');
    expect(fetch).toHaveBeenCalledTimes(1); // No retries for 401
  });

  it('should retry on rate limit (429) and succeed', async () => {
    jest.useFakeTimers();
    
    // First call fails with rate limit
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limited' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ embedding: mockEmbedding, index: 0, object: 'embedding' }],
          model: 'text-embedding-bge-m3',
          object: 'list'
        })
      });

    const promise = generateEmbedding('Test text');
    
    // Fast-forward timers
    await jest.advanceTimersByTimeAsync(1000);
    
    const result = await promise;
    
    expect(result).toEqual(mockEmbedding);
    expect(fetch).toHaveBeenCalledTimes(2);
    
    jest.useRealTimers();
  });

  it('should retry on server error (500) up to 3 times then fail', async () => {
    jest.useFakeTimers();
    
    // All calls fail with server error
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Server error' } })
    });

    const promise = generateEmbedding('Test text');
    
    // Fast-forward through retries: 1s, 2s, 4s
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    await jest.advanceTimersByTimeAsync(4000);
    
    await expect(promise).rejects.toThrow('Retryable error: Server error');
    expect(fetch).toHaveBeenCalledTimes(3);
    
    jest.useRealTimers();
  });

  it('should validate embedding dimensions', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{
          embedding: new Array(768).fill(0.1), // Wrong dimensions
          index: 0,
          object: 'embedding'
        }],
        model: 'text-embedding-bge-m3',
        object: 'list'
      })
    });

    await expect(generateEmbedding('Test text')).rejects.toThrow('Expected 1024 dimensions, got 768');
  });

  it('should handle missing embedding data', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        model: 'text-embedding-bge-m3',
        object: 'list'
      })
    });

    await expect(generateEmbedding('Test text')).rejects.toThrow('Invalid response from Venice API');
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(generateEmbedding('Test text')).rejects.toThrow('Network error');
  });
});

describe('generateEmbeddings', () => {
  const mockEmbedding = new Array(1024).fill(0.1);
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.VENICE_TEXT_EMBEDDING_API_KEY = 'test-key';
    
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ embedding: mockEmbedding, index: 0, object: 'embedding' }],
        model: 'text-embedding-bge-m3',
        object: 'list'
      })
    });
  });

  it('should generate embeddings for multiple texts', async () => {
    const texts = ['Text 1', 'Text 2', 'Text 3'];
    
    const results = await generateEmbeddings(texts);
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(mockEmbedding);
    expect(results[1]).toEqual(mockEmbedding);
    expect(results[2]).toEqual(mockEmbedding);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle empty array', async () => {
    const results = await generateEmbeddings([]);
    
    expect(results).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('prepareTextForEmbedding', () => {
  it('should concatenate title and content', () => {
    const result = prepareTextForEmbedding('My Title', 'My content');
    
    expect(result).toBe('My Title\n\nMy content');
  });

  it('should include summary when provided', () => {
    const result = prepareTextForEmbedding('Title', 'Content', 'Summary text');
    
    expect(result).toBe('Title\n\nContent\n\nSummary text');
  });

  it('should include lessons learned when provided', () => {
    const result = prepareTextForEmbedding('Title', 'Content', undefined, 'Some lesson');
    
    expect(result).toBe('Title\n\nContent\n\nLessons learned:\n\nSome lesson');
  });

  it('should include all fields when provided', () => {
    const result = prepareTextForEmbedding('Title', 'Content', 'Summary', 'Lesson');
    
    expect(result).toBe('Title\n\nContent\n\nSummary\n\nLessons learned:\n\nLesson');
  });

  it('should skip empty summary', () => {
    const result = prepareTextForEmbedding('Title', 'Content', '   ', 'Lesson');
    
    expect(result).not.toContain('Summary');
  });

  it('should skip empty lessons learned', () => {
    const result = prepareTextForEmbedding('Title', 'Content', 'Summary', '   ');
    
    expect(result).not.toContain('Lessons learned');
  });
});