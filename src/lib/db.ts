import { sql } from '@vercel/postgres';

export async function getDatabase() {
  return sql;
}

// For query building
export { sql };