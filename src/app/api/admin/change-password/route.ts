import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new passwords are required" },
        { status: 400 }
      );
    }
    
    // Get current password hash
    const result = await sql`
      SELECT password_hash FROM admin_users WHERE email = ${session.user.email}
    `;
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const { password_hash: currentHash } = result.rows[0];
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, currentHash);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    
    // Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 10);
    
    await sql`
      UPDATE admin_users 
      SET password_hash = ${newHash}, updated_at = NOW()
      WHERE email = ${session.user.email}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}