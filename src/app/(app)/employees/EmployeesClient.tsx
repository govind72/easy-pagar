'use client'

import { useState } from 'react'
import EmployeeDrawer from './EmployeeDrawer'
import type { Employee, Site } from '@/lib/types'

interface EmployeesClientProps {
  employees: Employee[]
  sites: Site[]
}

export default function EmployeesClient({ employees, sites }: EmployeesClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  function openAdd() {
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(emp: Employee) {
    setEditing(emp)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditing(null)
  }

  const active = employees.filter((e) => e.is_active)
  const inactive = employees.filter((e) => !e.is_active)

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Employees</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            {active.length} active {active.length === 1 ? 'employee' : 'employees'}
          </p>
        </div>
        <button
          id="add-employee-btn"
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Table — sm and up (tablet + desktop) */}
      <div className="hidden sm:block rounded-xl border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Rate</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Default Site</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-3 md:px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-400">
                  No employees yet. Click “Add Employee” to get started.
                </td>
              </tr>
            )}
            {active.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} onEdit={openEdit} />
            ))}
            {inactive.map((emp) => (
              <EmployeeRow key={emp.id} emp={emp} onEdit={openEdit} inactive />
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards — mobile only (below sm) */}
      <div className="sm:hidden space-y-3">
        {employees.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">
            No employees yet. Tap “Add Employee” to get started.
          </div>
        )}
        {[...active, ...inactive].map((emp) => (
          <EmployeeCard key={emp.id} emp={emp} onEdit={openEdit} inactive={!emp.is_active} />
        ))}
      </div>

      <EmployeeDrawer
        open={drawerOpen}
        employee={editing}
        sites={sites}
        onClose={closeDrawer}
      />
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────── */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
      ${active
        ? 'bg-green-50 text-green-700'
        : 'bg-gray-100 text-gray-400'
      }
    `}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function EmployeeRow({
  emp,
  onEdit,
  inactive = false,
}: {
  emp: Employee
  onEdit: (e: Employee) => void
  inactive?: boolean
}) {
  return (
    <tr className={inactive ? 'opacity-50' : ''}>
      <td className="px-3 md:px-5 py-3.5 font-medium text-gray-900">{emp.name}</td>
      <td className="px-3 md:px-5 py-3.5 text-gray-500">{emp.phone ?? '—'}</td>
      <td className="px-3 md:px-5 py-3.5 text-gray-700">₹{emp.daily_rate.toLocaleString('en-IN')}/day</td>
      <td className="px-3 md:px-5 py-3.5 text-gray-500">
        {/* @ts-ignore – Supabase join returns nested object */}
        {emp.default_site?.name ?? '—'}
      </td>
      <td className="px-3 md:px-5 py-3.5">
        <StatusBadge active={emp.is_active} />
      </td>
      <td className="px-3 md:px-5 py-3.5">
        <button
          type="button"
          onClick={() => onEdit(emp)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-colors"
        >
          Edit
        </button>
      </td>
    </tr>
  )
}

function EmployeeCard({
  emp,
  onEdit,
  inactive = false,
}: {
  emp: Employee
  onEdit: (e: Employee) => void
  inactive?: boolean
}) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white px-4 py-4 ${inactive ? 'opacity-50' : ''}`}>
      {/* Name + status row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{emp.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{emp.phone ?? 'No phone'}</p>
        </div>
        <StatusBadge active={emp.is_active} />
      </div>

      {/* Details row */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600">
        <span className="font-medium text-gray-800">₹{emp.daily_rate.toLocaleString('en-IN')}/day</span>
        {/* @ts-ignore */}
        {emp.default_site?.name && (
          <span className="text-gray-500">📍 {emp.default_site.name}</span>
        )}
      </div>

      {/* Full-width Edit button — easier to tap on mobile */}
      <button
        type="button"
        onClick={() => onEdit(emp)}
        className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 active:bg-green-100 transition-colors"
      >
        Edit
      </button>
    </div>
  )
}
