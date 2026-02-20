// Test database connection and tables
import { sql } from '@vercel/postgres';

async function main() {
  try {
    console.log('Testing database connection...');
    const test = await sql`SELECT 1 as test`;
    console.log('✅ Connection OK:', test.rows);
    
    console.log('Checking admin_users table...');
    const users = await sql`SELECT * FROM admin_users LIMIT 1`;
    console.log('✅ admin_users:', users.rows);
    
    console.log('✅ All checks passed!');
  } catch (e: any) {
    console.error('❌ Error:', e.message);
  }
}

main();