import { Pool } from 'pg';

// Lazy-initialize pool only when needed
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const p = getPool();
  
  // Build query using template literal directly
  const query = strings.reduce((acc, str, i) => {
    let result = acc + str;
    if (i < values.length) {
      const val = values[i];
      if (val === null) {
        result += 'NULL';
      } else if (typeof val === 'string') {
        // Escape single quotes for SQL
        result += `'${String(val).replace(/'/g, "''")}'`;
      } else {
        result += String(val);
      }
    }
    return result;
  }, '');
  
  const client = await p.connect();
  try {
    const result = await client.query(query);
    return { rows: result.rows };
  } finally {
    client.release();
  }
};