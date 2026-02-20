'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApiToken {
  id: number;
  name: string;
  agent_tag: string | null;
  created_at: string;
  last_used_at: string | null;
  is_revoked: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg shadow dark:shadow-zinc-800 p-6 border border-gray-200 dark:border-zinc-800">
          <div className="h-5 w-1/3 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse mb-3"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export default function AdminTokensPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenAgent, setNewTokenAgent] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchTokens();
    }
  }, [status, router]);

  async function fetchTokens() {
    try {
      const res = await fetch('/api/admin/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens);
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newTokenName, 
          agent_tag: newTokenAgent || undefined 
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCreatedToken(data.token);
        setNewTokenName('');
        setNewTokenAgent('');
        fetchTokens();
      }
    } catch (error) {
      console.error('Failed to create token:', error);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevokeToken(id: number) {
    if (!confirm('Are you sure you want to revoke this token?')) return;
    
    try {
      const res = await fetch(`/api/admin/tokens?id=${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchTokens();
      }
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">API Tokens</h1>

      {/* Create Token Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow dark:shadow-zinc-800 p-6 mb-6 border border-gray-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Create New Token</h2>
        
        {createdToken && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded">
            <p className="font-semibold text-green-800 dark:text-green-200">Token Created!</p>
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">
              Copy this token now - you won't be able to see it again:
            </p>
            <code className="block bg-white dark:bg-zinc-800 p-2 rounded text-sm break-all text-gray-800 dark:text-gray-200">
              {createdToken}
            </code>
            <button
              onClick={() => setCreatedToken(null)}
              className="mt-2 text-sm text-green-700 dark:text-green-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Name *
            </label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., Cito Bot Production"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agent Tag (optional)
            </label>
            <input
              type="text"
              value={newTokenAgent}
              onChange={(e) => setNewTokenAgent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., cito, archie, deb"
            />
          </div>
          
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Token'}
          </button>
        </form>
      </div>

      {/* Token List */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow dark:shadow-zinc-800 overflow-hidden border border-gray-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Agent Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No tokens yet
                </td>
              </tr>
            ) : (
              tokens.map((token) => (
                <tr key={token.id} className="dark:hover:bg-zinc-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {token.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {token.agent_tag || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(token.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {token.last_used_at 
                      ? new Date(token.last_used_at).toLocaleDateString() 
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {token.is_revoked ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        Revoked
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!token.is_revoked && (
                      <button
                        onClick={() => handleRevokeToken(token.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}