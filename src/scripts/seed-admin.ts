import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

const ADMIN_EMAIL = 'aja@ateam.local';
const ADMIN_PASSWORD = 'Ag3ntM3m0ry#2026!Xq';

async function seedAdmin() {
  console.log('Starting seed...');
  
  // Create tables
  console.log('Creating tables...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS api_tokens (
      id SERIAL PRIMARY KEY,
      token_hash VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      agent_tag VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      last_used_at TIMESTAMP,
      revoked_at TIMESTAMP,
      is_revoked BOOLEAN DEFAULT FALSE
    )
  `;
  
  await sql`
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
    )
  `;
  
  // Create indexes
  console.log('Creating indexes...');
  
  await sql`CREATE INDEX IF NOT EXISTS idx_memory_agent ON memory_entries(agent)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_memory_date ON memory_entries(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_memory_tags ON memory_entries USING GIN(tags)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_memory_project ON memory_entries(project_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_tokens_revoked ON api_tokens(is_revoked)`;
  
  // Hash password
  console.log('Hashing password...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  
  // Check if admin exists
  const existingAdmin = await sql`
    SELECT id FROM admin_users WHERE email = ${ADMIN_EMAIL}
  `;
  
  if (existingAdmin.rowCount === 0) {
    console.log('Creating admin user...');
    await sql`
      INSERT INTO admin_users (email, password_hash)
      VALUES (${ADMIN_EMAIL}, ${passwordHash})
    `;
    console.log('Admin user created successfully!');
  } else {
    console.log('Admin user already exists.');
  }
  
  console.log('Seed complete!');
}

seedAdmin().catch(console.error);