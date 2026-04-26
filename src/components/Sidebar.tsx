'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/app/(app)/actions'

const navLinks = [
  { href: '/dashboard',  label: 'Dashboard',  icon: '🏠' },
  { href: '/attendance', label: 'Attendance',  icon: '📋' },
  { href: '/employees',  label: 'Employees',   icon: '👷' },
  { href: '/sites',      label: 'Sites',       icon: '📍' },
  { href: '/expenses',   label: 'Expenses',    icon: '💰' },
  { href: '/reports',    label: 'Reports',     icon: '📊' },
]

interface SidebarProps {
  userEmail: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Active: exact match for /dashboard to avoid matching all sub-paths, startsWith for others
  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
    return pathname.startsWith(href)
  }

  const NavContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
        <span className="text-green-600 text-lg">🌿</span>
        <span className="text-base font-semibold text-green-700 tracking-tight">
          EasyPagar
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navLinks.map(({ href, label, icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm transition-colors
                ${active
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-normal'
                }
              `}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer: user + sign out */}
      <div className="border-t border-gray-100 px-4 py-4 space-y-2">
        <p
          className="truncate text-xs text-gray-400 leading-tight"
          title={userEmail}
        >
          {userEmail}
        </p>
        <form action={signOut}>
          <button
            id="sign-out-btn"
            type="submit"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-gray-200 h-full">
        <NavContent />
      </aside>

      {/* ── Mobile: hamburger button ─────────────── */}
      <button
        id="mobile-menu-btn"
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-40 rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
        onClick={() => setMobileOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Mobile: drawer overlay ───────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer panel ────────────────── */}
      <aside
        className={`
          md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button */}
        <button
          aria-label="Close menu"
          className="absolute top-3 right-3 rounded-lg p-1.5 text-gray-400 hover:text-gray-600"
          onClick={() => setMobileOpen(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <NavContent />
      </aside>
    </>
  )
}
