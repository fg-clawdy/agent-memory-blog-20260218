-- Migration: Create tables for Agent Memory Blog
-- Run with: psql $DATABASE_URL -f src/lib/schema.sql

-- Table: admin_users
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: api_tokens
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  agent_tag VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);

-- Table: memory_entries
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
);

-- Indexes for memory_entries
CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_entries(agent);
CREATE INDEX IF NOT EXISTS idx_memory_date ON memory_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memory_project ON memory_entries(project_id);

-- Index for api_tokens
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_api_tokens_revoked ON api_tokens(is_revoked);