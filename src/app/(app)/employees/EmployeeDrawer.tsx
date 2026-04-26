'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertEmployee, type EmployeeFormState } from './actions'
import type { Employee, Site } from '@/lib/types'

interface EmployeeDrawerProps {
  open: boolean
  employee: Employee | null  // null = add mode
  sites: Site[]
  onClose: () => void
}

const initialState: EmployeeFormState = { error: null, successAt: 0 }

export default function EmployeeDrawer({ open, employee, sites, onClose }: EmployeeDrawerProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(upsertEmployee, initialState)

  // ── FIX 1: Controlled state for select + status ──────────────────────────
  // defaultValue/defaultChecked only work on first mount. When the drawer
  // reopens for a different employee, these props are stale. Controlled state
  // + syncing in useEffect ensures the form always reflects the current employee.
  const [siteId, setSiteId] = useState<string>(employee?.default_site_id ?? '')
  const [isActive, setIsActive] = useState<boolean>(employee?.is_active ?? true)

  // ── FIX 2: formKey forces full form remount on each open ─────────────────
  // This resets all uncontrolled inputs (name, phone, rate, date, notes)
  // without needing to convert every field to controlled.
  const [formKey, setFormKey] = useState(0)


  // Sync controlled fields and bump formKey each time the drawer opens
  useEffect(() => {
    if (open) {
      setSiteId(employee?.default_site_id ?? '')
      setIsActive(employee?.is_active ?? true)
      setFormKey((k) => k + 1)
    }
  }, [open, employee?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── FIX 3: router.refresh() after success ────────────────────────────────
  // Depend on state.successAt (timestamp), NOT state.success (boolean).
  // If we used boolean: save employee A → success=true, save employee B →
  // success stays true, value doesn't change, effect never re-fires, drawer
  // stays open. With a timestamp every save produces a unique value.
  useEffect(() => {
    if (state.successAt > 0) {
      router.refresh()
      onClose()
    }
  }, [state.successAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={onClose}
        />
      )}

      {/* Drawer panel — full-width on mobile, 448px on desktop */}
      <aside
        className={`
          fixed inset-y-0 right-0 z-40
          w-full sm:max-w-md
          bg-white shadow-2xl
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Form ───────────────────────────────────────────────────── */}
        {/*
          key={formKey}: forces React to unmount+remount the form each time
          the drawer opens, which resets all uncontrolled defaultValue inputs.
        */}
        <form
          key={formKey}
          action={formAction}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Hidden id for edit mode */}
          {employee && <input type="hidden" name="id" value={employee.id} />}

          {/* Scrollable field area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Error banner */}
            {state.error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.error}
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="emp-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="emp-name"
                name="name"
                type="text"
                required
                defaultValue={employee?.name ?? ''}
                placeholder="e.g. Ravi Kumar"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="emp-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone
              </label>
              <input
                id="emp-phone"
                name="phone"
                type="tel"
                defaultValue={employee?.phone ?? ''}
                placeholder="9876543210"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>

            {/* Daily Rate */}
            <div>
              <label htmlFor="emp-rate" className="block text-sm font-medium text-gray-700 mb-1.5">
                Daily Rate (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₹</span>
                <input
                  id="emp-rate"
                  name="daily_rate"
                  type="number"
                  required
                  min={1}
                  step={1}
                  defaultValue={employee?.daily_rate ?? ''}
                  placeholder="450"
                  className="block w-full rounded-lg border border-gray-200 pl-7 pr-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                />
              </div>
            </div>

            {/* Default Site — controlled select */}
            <div>
              <label htmlFor="emp-site" className="block text-sm font-medium text-gray-700 mb-1.5">
                Default Site
              </label>
              <select
                id="emp-site"
                name="default_site_id"
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition bg-white"
              >
                <option value="">— No default site —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Joined Date */}
            <div>
              <label htmlFor="emp-joined" className="block text-sm font-medium text-gray-700 mb-1.5">
                Joined Date
              </label>
              <input
                id="emp-joined"
                name="joined_date"
                type="date"
                defaultValue={employee?.joined_date ?? today}
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>

            {/* Status — controlled toggle buttons ─────────────────────────
                FIX: using explicit static Tailwind classes instead of
                dynamically interpolated strings like `border-${color}-500`
                which Tailwind JIT never sees and therefore never emits.
            */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Status</span>
              {/* Hidden input carries the actual form value */}
              <input type="hidden" name="is_active" value={String(isActive)} />
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(true)}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(false)}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors ${
                    !isActive
                      ? 'border-gray-500 bg-gray-100 text-gray-700'
                      : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${!isActive ? 'bg-gray-500' : 'bg-gray-300'}`} />
                  Inactive
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="emp-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                id="emp-notes"
                name="notes"
                rows={3}
                defaultValue={employee?.notes ?? ''}
                placeholder="Any additional information…"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition resize-none"
              />
            </div>
          </div>

          {/* ── Footer buttons — always visible, never scroll away ─── */}
          <div className="flex gap-3 border-t border-gray-100 px-5 py-4 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition active:bg-gray-100"
            >
              Cancel
            </button>
            <button
              id="employee-save-btn"
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition active:bg-green-800"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}
