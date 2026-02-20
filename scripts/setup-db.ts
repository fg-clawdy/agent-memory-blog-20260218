// Run database schema
import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || "postgres://bc6f6ed428e9cfd9ed6f308949618bafb43adaffef5233a918d8472d7204f636:sk_ld8WSgKGEUS8dZvqN8Juw@db.prisma.io:5432/postgres?sslmode=require";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const schema = `
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
`;

async function main() {
  console.log('Running schema...');
  await pool.query(schema);
  console.log('✅ Schema created successfully!');
  
  // Create admin user
  const bcrypt = await import('bcrypt');
  const hash = await bcrypt.hash('admin123', 10);
  
  try {
    await pool.query(
      'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)',
      ['admin@example.com', hash]
    );
    console.log('✅ Admin user created: admin@example.com / admin123');
  } catch (e: any) {
    if (e.code === '23505') { // unique violation
      console.log('ℹ️  Admin user already exists');
    } else {
      throw e;
    }
  }
  
  await pool.end();
}

main().catch(console.error);