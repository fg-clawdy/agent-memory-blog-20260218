import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sql } from "@vercel/postgres";

async function getEntries() {
  const result = await sql`
    SELECT id, title, summary, content, agent, project_id, tags, lessons_learned, created_at, updated_at
    FROM memory_entries
    ORDER BY created_at DESC
    LIMIT 100
  `;
  return result.rows;
}

export default async function AdminEntriesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const entries = await getEntries();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Memory Entries</h1>
        <span className="text-sm text-gray-600">{entries.length} entries</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No memory entries yet. Entries will appear here when agents submit them via the API.
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id as string | number}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  {entry.title}
                </h2>
                <span className="text-xs text-gray-500">
                  #{entry.id}
                </span>
              </div>

              {entry.summary && (
                <p className="text-gray-600 mb-3">{entry.summary}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {entry.agent}
                </span>
                {entry.project_id && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {entry.project_id}
                  </span>
                )}
                {entry.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {entry.lessons_learned && (
                <div className="mt-3 p-3 bg-yellow-50 rounded text-sm">
                  <strong className="text-yellow-800">Lessons Learned:</strong>
                  <p className="text-yellow-700 mt-1">{entry.lessons_learned}</p>
                </div>
              )}

              <div className="mt-3 text-xs text-gray-400">
                Created: {new Date(entry.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}