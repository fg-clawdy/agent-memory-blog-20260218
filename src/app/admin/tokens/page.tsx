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
        <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-zinc-700">
          <div className="h-5 w-1/3 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse mb-3"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-700 rounded animate-pulse"></div>
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          API Tokens
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage API tokens for agent authentication
        </p>
      </div>

      {/* Create Token Form */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New Token</h2>
        
        {createdToken && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="font-semibold text-green-800 dark:text-green-300 text-sm sm:text-base">Token Created!</p>
            <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 mb-2">
              Copy this token now - you won't be able to see it again:
            </p>
            <code className="block bg-white dark:bg-zinc-900 p-2 sm:p-3 rounded text-xs sm:text-sm break-all text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700">
              {createdToken}
            </code>
            <button
              onClick={() => setCreatedToken(null)}
              className="mt-2 text-xs sm:text-sm text-green-700 dark:text-green-400 underline hover:text-green-800 dark:hover:text-green-300 min-h-[32px]"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Token Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-600 rounded-md 
                         bg-white dark:bg-zinc-700 text-gray-900 dark:text-white
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="e.g., Cito Bot Production"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Agent Tag <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={newTokenAgent}
              onChange={(e) => setNewTokenAgent(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-600 rounded-md 
                         bg-white dark:bg-zinc-700 text-gray-900 dark:text-white
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="e.g., cito, archie, deb"
            />
          </div>
          
          <button
            type="submit"
            disabled={creating || !newTokenName.trim()}
            className="w-full sm:w-auto bg-blue-600 dark:bg-blue-700 text-white px-6 py-2.5 rounded-md 
                       hover:bg-blue-700 dark:hover:bg-blue-800 active:bg-blue-800
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors font-medium text-base min-h-[44px]"
          >
            {creating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Token'
            )}
          </button>
        </form>
      </div>

      {/* Token List */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow border border-gray-200 dark:border-zinc-700 overflow-hidden">
        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-gray-200 dark:divide-zinc-700">
          {tokens.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No tokens yet
            </div>
          ) : (
            tokens.map((token) => (
              <div key={token.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">{token.name}</h3>
                  {token.is_revoked ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      Revoked
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Active
                    </span>
                  )}
                </div>
                
                {token.agent_tag && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Agent: <span className="font-medium">{token.agent_tag}</span>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                  <div>Created: {new Date(token.created_at).toLocaleDateString()}</div>
                  <div>Last used: {token.last_used_at ? new Date(token.last_used_at).toLocaleDateString() : 'Never'}</div>
                </div>
                
                {!token.is_revoked && (
                  <button
                    onClick={() => handleRevokeToken(token.id)}
                    className="w-full text-center py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300
                               border border-red-200 dark:border-red-800 rounded-md text-sm font-medium
                               active:bg-red-50 dark:active:bg-red-900/20 min-h-[40px]"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
            <thead className="bg-gray-50 dark:bg-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Agent Tag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-800 divide-y divide-gray-200 dark:divide-zinc-700">
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No tokens yet
                  </td>
                </tr>
              ) : (
                tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
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
    </div>
  );
}
