import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert admin user
    const result = await sql`
      INSERT INTO admin_users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      ON CONFLICT (email) DO UPDATE SET password_hash = ${passwordHash}, updated_at = NOW()
      RETURNING id, email
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: result.rows[0]
    });
  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admin user' },
      { status: 500 }
    );
  }
}