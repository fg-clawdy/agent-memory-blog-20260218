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
      router.push('/admin/login');
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">API Tokens</h1>

      {/* Create Token Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create New Token</h2>
        
        {createdToken && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 rounded">
            <p className="font-semibold text-green-800">Token Created!</p>
            <p className="text-sm text-green-700 mb-2">
              Copy this token now - you won&apos;t be able to see it again:
            </p>
            <code className="block bg-white p-2 rounded text-sm break-all">
              {createdToken}
            </code>
            <button
              onClick={() => setCreatedToken(null)}
              className="mt-2 text-sm text-green-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}
        
        <form onSubmit={handleCreateToken} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Name *
            </label>
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., Cito Bot Production"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent Tag (optional)
            </label>
            <input
              type="text"
              value={newTokenAgent}
              onChange={(e) => setNewTokenAgent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., cito, archie, deb"
            />
          </div>
          
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Token'}
          </button>
        </form>
      </div>

      {/* Token List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Agent Tag
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tokens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No tokens yet
                </td>
              </tr>
            ) : (
              tokens.map((token) => (
                <tr key={token.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {token.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {token.agent_tag || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(token.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {token.last_used_at 
                      ? new Date(token.last_used_at).toLocaleDateString() 
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {token.is_revoked ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Revoked
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!token.is_revoked && (
                      <button
                        onClick={() => handleRevokeToken(token.id)}
                        className="text-red-600 hover:text-red-900"
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