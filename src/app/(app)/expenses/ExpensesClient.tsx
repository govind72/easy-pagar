'use client'

import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/DatePicker'
import {
  upsertSiteExpense, deleteSiteExpense,
  upsertExtraService, deleteExtraService,
  type ExpenseResult,
} from './actions'
import type { Site } from '@/lib/types'

/* ── Types ────────────────────────────────────────────── */
type SiteExpense = {
  id: string; site_id: string; date: string
  description: string; category: string; amount: number
  site?: { name: string }
}
type ExtraService = {
  id: string; site_id: string; date: string
  description: string; amount: number
  site?: { name: string }
}

const CATEGORIES = ['Materials','Fuel','Tools','Transport','General'] as const

// Category badge colours — explicit static classes (no dynamic interpolation)
function catClass(cat: string) {
  const c = cat.toLowerCase()
  if (c === 'materials') return 'bg-blue-50 text-blue-700 border-blue-200'
  if (c === 'fuel')      return 'bg-amber-50 text-amber-700 border-amber-200'
  if (c === 'tools')     return 'bg-purple-50 text-purple-700 border-purple-200'
  if (c === 'transport') return 'bg-teal-50 text-teal-700 border-teal-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}` }
function todayStr() { return new Date().toISOString().split('T')[0] }
function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/* ── Drawer helper ────────────────────────────────────── */
const initR: ExpenseResult = { error: null, successAt: 0 }

function SiteExpenseDrawer({ open, record, sites, onClose }: {
  open: boolean; record: SiteExpense | null; sites: Site[]; onClose: () => void
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(upsertSiteExpense, initR)
  const [formKey, setFormKey] = useState(0)
  // Controlled date state so DatePicker works inside the form
  const [date, setDate] = useState(todayStr())

  // Remount form + reset date every time drawer opens
  useEffect(() => {
    if (open) {
      setFormKey(k => k + 1)
      setDate(record?.date ?? todayStr())
    }
  }, [open, record?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close drawer on successful save
  // successAt is a timestamp — unique each save, so this fires reliably
  useEffect(() => {
    if (state.successAt > 0) {
      router.refresh()
      onClose()
    }
  }, [state.successAt]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />}
      <aside className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">{record ? 'Edit Expense' : 'Add Expense'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form key={formKey} action={action} className="flex flex-col flex-1 min-h-0">
          {record && <input type="hidden" name="id" value={record.id} />}
          {/* Hidden date synced from DatePicker */}
          <input type="hidden" name="date" value={date} />
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {state.error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>
            )}
            <Field label="Site *" htmlFor="se-site">
              <select id="se-site" name="site_id" defaultValue={record?.site_id ?? ''} required className={SEL}>
                <option value="">— Select site —</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <DatePicker value={date} max={todayStr()} onChange={setDate} />
            </div>
            <Field label="Description *" htmlFor="se-desc">
              <input id="se-desc" name="description" type="text" required
                defaultValue={record?.description ?? ''} placeholder="e.g. Bought fertilizer bags" className={INP} />
            </Field>
            <Field label="Category" htmlFor="se-cat">
              <select id="se-cat" name="category" defaultValue={record?.category ?? 'general'} className={SEL}>
                {CATEGORIES.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
              </select>
            </Field>
            <Field label="Amount (₹) *" htmlFor="se-amt">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₹</span>
                <input id="se-amt" name="amount" type="number" min={1} required
                  defaultValue={record?.amount ?? ''} placeholder="500" className={`${INP} pl-7`} />
              </div>
            </Field>
          </div>
          <div className="flex gap-3 border-t border-gray-100 px-5 py-4 shrink-0 bg-white">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">{pending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </aside>
    </>
  )
}

function ExtraServiceDrawer({ open, record, sites, onClose }: {
  open: boolean; record: ExtraService | null; sites: Site[]; onClose: () => void
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(upsertExtraService, initR)
  const [formKey, setFormKey] = useState(0)
  const [date, setDate] = useState(todayStr())

  useEffect(() => {
    if (open) {
      setFormKey(k => k + 1)
      setDate(record?.date ?? todayStr())
    }
  }, [open, record?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.successAt > 0) {
      router.refresh()
      onClose()
    }
  }, [state.successAt]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30" onClick={onClose} />}
      <aside className={`fixed inset-y-0 right-0 z-40 w-full sm:max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">{record ? 'Edit Service' : 'Add Extra Service'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form key={formKey} action={action} className="flex flex-col flex-1 min-h-0">
          {record && <input type="hidden" name="id" value={record.id} />}
          <input type="hidden" name="date" value={date} />
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {state.error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>
            )}
            <Field label="Site *" htmlFor="es-site">
              <select id="es-site" name="site_id" defaultValue={record?.site_id ?? ''} required className={SEL}>
                <option value="">— Select site —</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <DatePicker value={date} max={todayStr()} onChange={setDate} />
            </div>
            <Field label="Description *" htmlFor="es-desc">
              <input id="es-desc" name="description" type="text" required
                defaultValue={record?.description ?? ''} placeholder="e.g. Event garden setup" className={INP} />
            </Field>
            <Field label="Amount (₹) *" htmlFor="es-amt">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₹</span>
                <input id="es-amt" name="amount" type="number" min={1} required
                  defaultValue={record?.amount ?? ''} placeholder="1500" className={`${INP} pl-7`} />
              </div>
            </Field>
          </div>
          <div className="flex gap-3 border-t border-gray-100 px-5 py-4 shrink-0 bg-white">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition">{pending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </aside>
    </>
  )
}

/* ── Confirm dialog ───────────────────────────────────── */
function ConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <p className="text-sm text-gray-700 mb-6">Are you sure you want to delete this entry? This cannot be undone.</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ───────────────────────────────────── */
export default function ExpensesClient({ siteExpenses, extraServices, sites }: {
  siteExpenses: SiteExpense[]; extraServices: ExtraService[]; sites: Site[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'expenses' | 'services'>('expenses')
  const [filterSite, setFilterSite] = useState('')
  // Default to current month (YYYY-MM) so list isn't blank on load
  const [filterMonth, setFilterMonth] = useState(currentMonth)

  const [seOpen, setSeOpen] = useState(false)
  const [seRecord, setSeRecord] = useState<SiteExpense | null>(null)
  const [esOpen, setEsOpen] = useState(false)
  const [esRecord, setEsRecord] = useState<ExtraService | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'expense' | 'service' } | null>(null)
  const [, startDelete] = useTransition()

  function applyFilters<T extends { site_id: string; date: string }>(rows: T[]) {
    return rows.filter(r => {
      if (filterSite && r.site_id !== filterSite) return false
      if (filterMonth && !r.date.startsWith(filterMonth)) return false
      return true
    })
  }

  const filteredSE = useMemo(() =>
    applyFilters(siteExpenses).sort((a, b) => b.date.localeCompare(a.date)),
    [siteExpenses, filterSite, filterMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredES = useMemo(() =>
    applyFilters(extraServices).sort((a, b) => b.date.localeCompare(a.date)),
    [extraServices, filterSite, filterMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  const seTotal = filteredSE.reduce((s, r) => s + r.amount, 0)
  const esTotal = filteredES.reduce((s, r) => s + r.amount, 0)

  function handleDelete() {
    if (!deleteTarget) return
    startDelete(async () => {
      if (deleteTarget.type === 'expense') await deleteSiteExpense(deleteTarget.id)
      else await deleteExtraService(deleteTarget.id)
      setDeleteTarget(null)
      router.refresh()
    })
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Expenses</h1>
        <button type="button"
          onClick={() => tab === 'expenses' ? (setSeRecord(null), setSeOpen(true)) : (setEsRecord(null), setEsOpen(true))}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          {tab === 'expenses' ? 'Add Expense' : 'Add Service'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {(['expenses', 'services'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'expenses' ? 'Site Expenses' : 'Extra Services'}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className={`${SEL} w-auto min-w-[160px]`}>
          <option value="">All sites</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={`${INP} w-auto`} />
        {(filterSite || filterMonth !== currentMonth()) && (
          <button type="button" onClick={() => { setFilterSite(''); setFilterMonth(currentMonth()) }}
            className="text-sm text-gray-400 hover:text-gray-600 underline">Reset</button>
        )}
      </div>

      {/* Site Expenses tab */}
      {tab === 'expenses' && (
        <>
          <div className="hidden sm:block rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  {['Date','Site','Description','Category','Amount',''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSE.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No expenses this month.</td></tr>}
                {filteredSE.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.site?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.description}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${catClass(r.category)}`}>{r.category}</span></td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(r.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setSeRecord(r); setSeOpen(true) }} className={EDIT_BTN}>Edit</button>
                        <button type="button" onClick={() => setDeleteTarget({ id: r.id, type: 'expense' })} className={DEL_BTN}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3">
            {filteredSE.length === 0 && <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">No expenses this month.</div>}
            {filteredSE.map(r => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{r.site?.name ?? '—'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{r.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{r.date}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800">{fmt(r.amount)}</p>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium mt-1 ${catClass(r.category)}`}>{r.category}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => { setSeRecord(r); setSeOpen(true) }} className={`flex-1 ${EDIT_BTN}`}>Edit</button>
                  <button type="button" onClick={() => setDeleteTarget({ id: r.id, type: 'expense' })} className={`flex-1 ${DEL_BTN}`}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right text-sm font-semibold text-gray-700">Total: {fmt(seTotal)}</div>
        </>
      )}

      {/* Extra Services tab */}
      {tab === 'services' && (
        <>
          <div className="hidden sm:block rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  {['Date','Site','Description','Amount',''].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredES.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">No extra services this month.</td></tr>}
                {filteredES.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.site?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.description}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{fmt(r.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setEsRecord(r); setEsOpen(true) }} className={EDIT_BTN}>Edit</button>
                        <button type="button" onClick={() => setDeleteTarget({ id: r.id, type: 'service' })} className={DEL_BTN}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3">
            {filteredES.length === 0 && <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center text-sm text-gray-400">No extra services this month.</div>}
            {filteredES.map(r => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{r.site?.name ?? '—'}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{r.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{r.date}</p>
                  </div>
                  <p className="font-bold text-gray-800 shrink-0">{fmt(r.amount)}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => { setEsRecord(r); setEsOpen(true) }} className={`flex-1 ${EDIT_BTN}`}>Edit</button>
                  <button type="button" onClick={() => setDeleteTarget({ id: r.id, type: 'service' })} className={`flex-1 ${DEL_BTN}`}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right text-sm font-semibold text-gray-700">Total: {fmt(esTotal)}</div>
        </>
      )}

      <SiteExpenseDrawer open={seOpen} record={seRecord} sites={sites} onClose={() => { setSeOpen(false); setSeRecord(null) }} />
      <ExtraServiceDrawer open={esOpen} record={esRecord} sites={sites} onClose={() => { setEsOpen(false); setEsRecord(null) }} />

      {deleteTarget && <ConfirmDialog onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}

/* ── Shared styles ────────────────────────────────────── */
const INP = 'block w-full rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition'
const SEL = 'rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white transition'
const EDIT_BTN = 'rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition'
const DEL_BTN  = 'rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition'

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
