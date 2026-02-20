export default function Loading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        <div className="h-5 w-20 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 rounded-lg shadow dark:shadow-zinc-800 p-6 border border-gray-200 dark:border-zinc-800"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="h-6 w-2/3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
              <div className="h-4 w-8 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
            <div className="flex gap-2 mt-3">
              <div className="h-5 w-20 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
              <div className="h-5 w-24 bg-gray-200 dark:bg-zinc-800 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}