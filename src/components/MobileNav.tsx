'use client';

import { useState } from 'react';
import Link from 'next/link';

export function MobileNav({ session }: { session: { user?: { email?: string | null } | null } }) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/admin/entries", label: "Entries" },
    { href: "/admin/tokens", label: "API Tokens" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <div className="flex items-center justify-between h-14 px-4 bg-white border-b">
        <Link href="/admin/entries" className="text-lg font-bold text-gray-800">
          Agent Memory Blog
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="bg-white border-b shadow-lg">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md min-h-[44px] flex items-center"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t">
              <span className="block px-4 text-sm text-gray-500">
                {session.user?.email}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}