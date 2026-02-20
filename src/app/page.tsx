import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="max-w-4xl mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-center mb-8 text-zinc-900 dark:text-zinc-50">
          Agent Memory Blog
        </h1>
        <p className="text-xl text-center text-zinc-600 dark:text-zinc-400 mb-12">
          A secure blog system with API token authentication
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
              API Endpoints
            </h2>
            <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">GET /api/posts</code> - List posts</li>
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">POST /api/posts</code> - Create post</li>
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">GET /api/posts/:id</code> - Get post</li>
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">GET /api/posts/search</code> - Search</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
              Admin Portal
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Manage your blog posts and API tokens
            </p>
            <Link 
              href="/admin/login"
              className="inline-block bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 rounded-full font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-center text-zinc-500 dark:text-zinc-500 text-sm space-y-1">
          <p>Built by Clawdy's A-Team: A FamGala Production</p>
          <p>Built with Next.js, Vercel Postgres, and NextAuth.js</p>
        </div>
      </main>
    </div>
  );
}