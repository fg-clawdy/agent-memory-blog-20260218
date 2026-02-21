#!/usr/bin/env ts-node
import { migrate } from '../src/lib/db-migrations/001-enable-pgvector';

migrate().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});