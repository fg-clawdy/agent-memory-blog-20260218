# Task: Configure NextAuth.js with credentials provider

## Objective
Set up NextAuth for admin login with aja@ateam.local

## Acceptance Criteria
- NextAuth.js installed and configured
- Credentials provider for admin login
- Session management working
- Protected /admin routes

## Tech Stack
- Frontend: Next.js 14 App Router
- Backend: Next.js API Routes  
- Database: Vercel Postgres
- Auth: NextAuth.js v5 (or v4)

## Dependencies
- story-002: ✅ Complete

## Implementation Steps

### 1. Install NextAuth
```bash
npm install next-auth
```

### 2. Create auth configuration
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `src/lib/auth.ts` - Auth configuration with credentials provider
- `src/middleware.ts` - For protecting /admin routes

### 3. Auth Config (src/lib/auth.ts)
```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { sql } from "@vercel/postgres";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const result = await sql`
          SELECT id, email, password_hash 
          FROM admin_users 
          WHERE email = ${credentials.email}
        `;
        
        if (result.rowCount === 0) {
          return null;
        }
        
        const user = result.rows[0];
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        
        if (!isValid) {
          return null;
        }
        
        return {
          id: user.id.toString(),
          email: user.email,
        };
      }
    })
  ],
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};
```

### 4. Create API route (src/app/api/auth/[...nextauth]/route.ts)
```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 5. Create middleware (src/middleware.ts)
```typescript
export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/admin/:path*"],
};
```

### 6. Create login page (src/app/admin/login/page.tsx)
- Simple form with email/password
- Uses NextAuth signIn()

### 7. Create admin layout (src/app/admin/layout.tsx)
- Check session, redirect to login if not authenticated

## Commit Format
When done: `git add -A && git commit -m "feat: configure-nextauthjs-with-credentials-provider"`

## CRITICAL
- Use NextAuth v4 or v5 (check what's latest stable)
- Protect /admin routes with middleware
- Do NOT store plain passwords - use bcrypt (already installed)
- Do NOT start other tasks — only implement THIS task