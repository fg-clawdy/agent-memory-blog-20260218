import { sql } from "@/lib/db";
import crypto from "crypto";

export interface ApiToken {
  id: number;
  token_hash: string;
  name: string;
  agent_tag: string | null;
  created_at: Date;
  last_used_at: Date | null;
  revoked_at: Date | null;
  is_revoked: boolean;
}

// Hash token with SHA-256
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Validate API token
export async function validateApiToken(token: string): Promise<ApiToken | null> {
  const tokenHash = hashToken(token);
  
  const result = await sql`
    SELECT id, token_hash, name, agent_tag, created_at, last_used_at, revoked_at, is_revoked
    FROM api_tokens
    WHERE token_hash = ${tokenHash} AND is_revoked = FALSE
  `;
  
  if (!result.rows || result.rows.length === 0) {
    return null;
  }
  
  // Update last_used_at
  await sql`
    UPDATE api_tokens
    SET last_used_at = NOW()
    WHERE token_hash = ${tokenHash}
  `;
  
  return result.rows[0] as ApiToken;
}

// Create new API token
export async function createApiToken(
  name: string,
  agentTag?: string
): Promise<{ token: string; tokenHash: string }> {
  // Generate random token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  
  await sql`
    INSERT INTO api_tokens (token_hash, name, agent_tag)
    VALUES (${tokenHash}, ${name}, ${agentTag || null})
  `;
  
  return { token, tokenHash };
}

// Revoke API token (soft delete)
export async function revokeApiToken(tokenId: number): Promise<void> {
  await sql`
    UPDATE api_tokens
    SET is_revoked = TRUE, revoked_at = NOW()
    WHERE id = ${tokenId}
  `;
}

// Get all API tokens (for admin)
export async function getAllApiTokens(): Promise<ApiToken[]> {
  const result = await sql`
    SELECT id, token_hash, name, agent_tag, created_at, last_used_at, revoked_at, is_revoked
    FROM api_tokens
    ORDER BY created_at DESC
  `;
  
  return result.rows as ApiToken[];
}

// Middleware helper for API routes
export async function authApiRequest(
  authHeader: string | null
): Promise<{ authorized: boolean; token?: ApiToken; error?: string }> {
  if (!authHeader) {
    return { authorized: false, error: "Missing Authorization header" };
  }
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return { authorized: false, error: "Invalid Authorization header format" };
  }
  
  const token = await validateApiToken(parts[1]);
  if (!token) {
    return { authorized: false, error: "Invalid or revoked API token" };
  }
  
  return { authorized: true, token };
}