'use client'

import { useState } from 'react'
import SiteDrawer from './SiteDrawer'
import type { Site } from '@/lib/types'

interface SitesClientProps {
  sites: Site[]
}

export default function SitesClient({ sites }: SitesClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Site | null>(null)

  function openAdd() {
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(s: Site) {
    setEditing(s)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditing(null)
  }

  const active = sites.filter((s) => s.is_active)
  const inactive = sites.filter((s) => !s.is_active)

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Sites</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {active.length} active {active.length === 1 ? 'site' : 'sites'}
          </p>
        </div>
        <button
          id="add-site-btn"
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </button>
      </div>

      {/* ── Table — sm and up (tablet + desktop) ─────────────────────────── */}
      {/* overflow-x-auto + min-w so the table scrolls rather than clipping  */}
      <div className="hidden sm:block rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[580px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site Name</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly Rate</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-400">
                  No sites yet. Click "Add Site" to get started.
                </td>
              </tr>
            )}
            {active.map((s) => (
              <SiteRow key={s.id} site={s} onEdit={openEdit} />
            ))}
            {inactive.map((s) => (
              <SiteRow key={s.id} site={s} onEdit={openEdit} inactive />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Cards — mobile only (below sm) ───────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {sites.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">
            No sites yet. Tap "Add Site" to get started.
          </div>
        )}
        {[...active, ...inactive].map((s) => (
          <SiteCard key={s.id} site={s} onEdit={openEdit} inactive={!s.is_active} />
        ))}
      </div>

      <SiteDrawer
        open={drawerOpen}
        site={editing}
        onClose={closeDrawer}
      />
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function SiteRow({
  site,
  onEdit,
  inactive = false,
}: {
  site: Site
  onEdit: (s: Site) => void
  inactive?: boolean
}) {
  return (
    <tr className={inactive ? 'opacity-50' : ''}>
      <td className="px-3 md:px-5 py-3.5 font-medium text-gray-900">{site.name}</td>
      <td className="px-3 md:px-5 py-3.5">
        <p className="text-gray-700">{site.client_name ?? '—'}</p>
        {site.client_phone && (
          <p className="text-xs text-gray-400 mt-0.5">{site.client_phone}</p>
        )}
      </td>
      <td className="px-3 md:px-5 py-3.5 font-semibold text-gray-800">
        ₹{site.monthly_rate.toLocaleString('en-IN')}/mo
      </td>
      <td className="px-3 md:px-5 py-3.5">
        <StatusBadge active={site.is_active} />
      </td>
      <td className="px-3 md:px-5 py-3.5">
        <button
          type="button"
          onClick={() => onEdit(site)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
        >
          Edit
        </button>
      </td>
    </tr>
  )
}

function SiteCard({
  site,
  onEdit,
  inactive = false,
}: {
  site: Site
  onEdit: (s: Site) => void
  inactive?: boolean
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white px-4 py-4 ${inactive ? 'opacity-50' : ''}`}>
      {/* Site name + status */}
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-gray-900 leading-tight">{site.name}</p>
        <StatusBadge active={site.is_active} />
      </div>

      {/* Client info */}
      {(site.client_name || site.client_phone) && (
        <p className="mt-1 text-sm text-gray-500">
          {site.client_name}
          {site.client_name && site.client_phone && ' · '}
          {site.client_phone}
        </p>
      )}

      {/* Rate — shown prominently like a price tag */}
      <div className="mt-3 inline-flex items-baseline gap-1">
        <span className="text-lg font-bold text-gray-800">
          ₹{site.monthly_rate.toLocaleString('en-IN')}
        </span>
        <span className="text-xs text-gray-400">/month</span>
      </div>

      {/* Full-width Edit — easy to tap */}
      <button
        type="button"
        onClick={() => onEdit(site)}
        className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:bg-green-100 transition-colors"
      >
        Edit
      </button>
    </div>
  )
}
