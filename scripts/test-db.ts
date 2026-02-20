// Test database connection
import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function main() {
  try {
    const result = await pool.query('SELECT 1');
    console.log('✅ Database connected!');
    console.log(result.rows);
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows);
    
    await pool.end();
  } catch (e) {
    console.error('❌ Database error:', e);
  }
}

main();