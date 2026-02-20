#!/bin/bash
# Setup script for Agent Memory Blog
# Run this after setting DATABASE_URL in Vercel

set -e

echo "=== Agent Memory Blog Setup ==="

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not set"
  echo "Set it with: export DATABASE_URL='postgres://...'"
  exit 1
fi

# Get admin credentials from env or use defaults
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"

echo "Using admin email: $ADMIN_EMAIL"

# Run the schema
echo "Running database schema..."
psql "$DATABASE_URL" -f src/lib/schema.sql

# Create admin user using a temporary Node script
echo "Creating admin user..."

# Create a temp script
TEMP_SCRIPT=$(mktemp)
cat > "$TEMP_SCRIPT" << 'EOF'
import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

const email = process.env.ADMIN_EMAIL || 'admin@example.com';
const password = process.env.ADMIN_PASSWORD || 'admin123';

async function main() {
  const hash = await bcrypt.hash(password, 10);
  try {
    await sql`INSERT INTO admin_users (email, password_hash) VALUES (${email}, ${hash})`;
    console.log(`Admin user created: ${email} / ${password}`);
  } catch (e) {
    if (e.message.includes('duplicate')) {
      console.log('Admin user already exists');
    } else {
      throw e;
    }
  }
}

main().catch(console.error);
EOF

# Run the script
ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" npx tsx "$TEMP_SCRIPT"

rm "$TEMP_SCRIPT"

echo ""
echo "=== Setup Complete ==="
echo "Login at: /admin/login"
echo "Email: $ADMIN_EMAIL"
echo "Password: $ADMIN_PASSWORD"