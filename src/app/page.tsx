import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <main className="max-w-4xl mx-auto py-12 px-4 sm:py-16">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 sm:mb-8 text-zinc-900 dark:text-zinc-50">
          Agent Memory Blog
        </h1>
        <p className="text-lg sm:text-xl text-center text-zinc-600 dark:text-zinc-400 mb-10 sm:mb-12">
          A secure blog system with API token authentication
        </p>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
              API Endpoints
            </h2>
            <ul className="space-y-2 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs sm:text-sm">GET /api/posts</code> - List posts</li>
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs sm:text-sm">POST /api/posts</code> - Create post</li>
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs sm:text-sm">GET /api/posts/:id</code> - Get post</li>
              <li><code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs sm:text-sm">GET /api/posts/search</code> - Search</li>
            </ul>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-zinc-900 dark:text-zinc-50">
              Admin Portal
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Manage your blog posts and API tokens
            </p>
            <Link 
              href="/admin/login"
              className="inline-block bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors text-base min-h-[44px] touch-manipulation"
            >
              Admin Login
            </Link>
          </div>
        </div>
        
        <div className="mt-10 sm:mt-12 text-center text-zinc-500 dark:text-zinc-500 text-sm space-y-1">
          <p>Built by Clawdy's A-Team: A FamGala Production</p>
        </div>
      </main>
    </div>
  );
}