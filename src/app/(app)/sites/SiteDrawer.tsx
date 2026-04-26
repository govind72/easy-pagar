'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertSite, type SiteFormState } from './actions'
import type { Site } from '@/lib/types'

interface SiteDrawerProps {
  open: boolean
  site: Site | null  // null = add mode
  onClose: () => void
}

const initialState: SiteFormState = { error: null, successAt: 0 }

export default function SiteDrawer({ open, site, onClose }: SiteDrawerProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(upsertSite, initialState)

  // Controlled state for is_active — radio/toggle buttons need immediate
  // visual feedback and defaultChecked doesn't update on re-open.
  const [isActive, setIsActive] = useState<boolean>(site?.is_active ?? true)

  // formKey: bump on each open to force full form DOM remount, which
  // resets all uncontrolled defaultValue inputs to the current site's data.
  const [formKey, setFormKey] = useState(0)

  // Sync controlled fields + remount form whenever the drawer opens
  useEffect(() => {
    if (open) {
      setIsActive(site?.is_active ?? true)
      setFormKey((k) => k + 1)
    }
  }, [open, site?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close + refresh on success.
  // successAt is a timestamp — every save returns a unique value,
  // so this effect fires reliably even for consecutive saves.
  useEffect(() => {
    if (state.successAt > 0) {
      router.refresh()
      onClose()
    }
  }, [state.successAt]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />
      )}

      {/* Drawer — full-width on mobile, 448 px on sm+ */}
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            {site ? 'Edit Site' : 'Add Site'}
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

        {/* Form — key forces remount on each open */}
        <form key={formKey} action={formAction} className="flex flex-col flex-1 min-h-0">
          {site && <input type="hidden" name="id" value={site.id} />}

          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Error banner */}
            {state.error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {state.error}
              </div>
            )}

            {/* Site Name */}
            <div>
              <label htmlFor="site-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input
                id="site-name"
                name="name"
                type="text"
                required
                defaultValue={site?.name ?? ''}
                placeholder="e.g. Indiranagar Apt"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>

            {/* Client Name */}
            <div>
              <label htmlFor="site-client-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Client Name
              </label>
              <input
                id="site-client-name"
                name="client_name"
                type="text"
                defaultValue={site?.client_name ?? ''}
                placeholder="e.g. Rajesh Sharma"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>

            {/* Client Phone */}
            <div>
              <label htmlFor="site-client-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Client Phone
              </label>
              <input
                id="site-client-phone"
                name="client_phone"
                type="tel"
                defaultValue={site?.client_phone ?? ''}
                placeholder="9876543210"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="site-address" className="block text-sm font-medium text-gray-700 mb-1.5">
                Address
              </label>
              <textarea
                id="site-address"
                name="address"
                rows={2}
                defaultValue={site?.address ?? ''}
                placeholder="Full address of the site"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition resize-none"
              />
            </div>

            {/* Monthly Rate */}
            <div>
              <label htmlFor="site-rate" className="block text-sm font-medium text-gray-700 mb-1.5">
                Monthly Rate (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₹</span>
                <input
                  id="site-rate"
                  name="monthly_rate"
                  type="number"
                  required
                  min={1}
                  step={1}
                  defaultValue={site?.monthly_rate ?? ''}
                  placeholder="8000"
                  className="block w-full rounded-lg border border-gray-200 pl-7 pr-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
                />
              </div>
            </div>

            {/* Status — controlled toggle buttons with explicit static Tailwind classes */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1.5">Status</span>
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
              <label htmlFor="site-notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes
              </label>
              <textarea
                id="site-notes"
                name="notes"
                rows={3}
                defaultValue={site?.notes ?? ''}
                placeholder="Any additional information…"
                className="block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition resize-none"
              />
            </div>
          </div>

          {/* Footer — always visible, never scrolls away */}
          <div className="flex gap-3 border-t border-gray-100 px-5 py-4 shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition active:bg-gray-100"
            >
              Cancel
            </button>
            <button
              id="site-save-btn"
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
