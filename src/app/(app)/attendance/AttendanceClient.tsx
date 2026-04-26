'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/DatePicker'
import { saveAttendance, type AttendanceRow } from './actions'
import type { Employee, Site, Attendance, AttendanceStatus } from '@/lib/types'

/* ── Types ────────────────────────────────────────────── */
type RowState = {
  status: AttendanceStatus
  siteId: string
  advanceAmount: string
  advanceReason: string
  comment: string
  showExpand: boolean
}

/* ── Pure helpers ─────────────────────────────────────── */
function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, delta: number) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAY = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const label = `${d} ${MON[m - 1]}`
  if (diff === 0) return `Today, ${label}`
  if (diff === -1) return `Yesterday, ${label}`
  return `${DAY[dt.getDay()]}, ${label}`
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function initRows(employees: Employee[], records: Attendance[]): Record<string, RowState> {
  const map = new Map(records.map(r => [r.employee_id, r]))
  return Object.fromEntries(employees.map(emp => {
    const rec = map.get(emp.id)
    return [emp.id, {
      status: rec?.status ?? 'present',
      siteId: rec?.site_id ?? emp.default_site_id ?? '',
      advanceAmount: rec?.advance_amount ? String(rec.advance_amount) : '',
      advanceReason: rec?.advance_reason ?? '',
      comment: rec?.comment ?? '',
      showExpand: !!(rec?.advance_reason),
    }]
  }))
}

/* ── Main component ───────────────────────────────────── */
interface Props {
  employees: Employee[]
  sites: Site[]
  initialRecords: Attendance[]
  initialDate: string
}

export default function AttendanceClient({ employees, sites, initialRecords, initialDate }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<Record<string, RowState>>(() => initRows(employees, initialRecords))
  const [search, setSearch] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [isPending, startTransition] = useTransition()

  const today = todayStr()
  const isToday = initialDate === today

  const stats = useMemo(() => {
    const vals = Object.values(rows)
    return {
      present: vals.filter(r => r.status === 'present').length,
      half: vals.filter(r => r.status === 'half').length,
      absent: vals.filter(r => r.status === 'absent').length,
      advances: vals.reduce((s, r) => s + (Number(r.advanceAmount) || 0), 0),
    }
  }, [rows])

  function updateRow(id: string, patch: Partial<RowState>) {
    setRows(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function markAllPresent() {
    setRows(prev =>
      Object.fromEntries(Object.entries(prev).map(([id, r]) => [id, { ...r, status: 'present' as AttendanceStatus }]))
    )
  }

  function goDate(delta: number) {
    const next = addDays(initialDate, delta)
    if (next > today) return
    router.push(`/attendance?date=${next}`)
  }

  function showToastMsg() {
    setToast(true)
    setTimeout(() => setToast(false), 2500)
  }

  function handleSave() {
    setSaveError(null)
    const payload: AttendanceRow[] = employees.map(emp => ({
      employee_id: emp.id,
      date: initialDate,
      status: rows[emp.id]?.status ?? 'present',
      site_id: rows[emp.id]?.siteId || null,
      advance_amount: Number(rows[emp.id]?.advanceAmount) || 0,
      advance_reason: rows[emp.id]?.advanceReason.trim() || null,
      comment: rows[emp.id]?.comment.trim() || null,
    }))
    startTransition(async () => {
      const result = await saveAttendance(payload)
      if (result.successAt > 0) {
        showToastMsg()
      } else {
        setSaveError(result.error ?? 'Save failed')
      }
    })
  }

  const visible = useMemo(() =>
    search.trim()
      ? employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
      : employees
  , [employees, search])

  return (
    <div className="pb-24">

      {/* ── Header — scrolls with content, not sticky ──── */}
      {/* User can scroll down to hide it, scroll up to see it. */}
      <div className="bg-white border-b border-gray-200 shadow-sm">

        {/* Date navigator */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
          {/* ← Previous day */}
          <button
            type="button"
            onClick={() => goDate(-1)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition"
            aria-label="Previous day"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Custom calendar date picker — handles its own open/close state */}
          <DatePicker
            value={initialDate}
            max={today}
            onChange={date => router.push(`/attendance?date=${date}`)}
          />

          {/* → Next day */}
          <button
            type="button"
            onClick={() => goDate(1)}
            disabled={isToday}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
            aria-label="Next day"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-2 px-4 sm:px-6 pb-3">
          <StatCard label="Present" value={stats.present} colorClass="bg-green-50 text-green-700 border-green-200" />
          <StatCard label="Half" value={stats.half} colorClass="bg-amber-50 text-amber-700 border-amber-200" />
          <StatCard label="Absent" value={stats.absent} colorClass="bg-red-50 text-red-700 border-red-200" />
          <StatCard
            label="Advances"
            value={`₹${stats.advances.toLocaleString('en-IN')}`}
            colorClass="bg-blue-50 text-blue-700 border-blue-200"
          />
        </div>

        {/* Toolbar */}
        <div className="flex gap-2 px-4 sm:px-6 pb-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition"
          />
          <button
            type="button"
            onClick={markAllPresent}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition whitespace-nowrap"
          >
            All Present
          </button>
        </div>
      </div>

      {/* ── Employee rows — pb-24 already on outer div, clears save bar ── */}
      <div className="px-4 sm:px-6 py-3 space-y-2">
        {visible.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">
            {search ? 'No employees match your search.' : 'No active employees found.'}
          </p>
        )}
        {visible.map(emp => (
          <EmployeeRow
            key={emp.id}
            employee={emp}
            sites={sites}
            row={rows[emp.id] ?? { status: 'present', siteId: '', advanceAmount: '', advanceReason: '', comment: '', showExpand: false }}
            onUpdate={patch => updateRow(emp.id, patch)}
          />
        ))}
      </div>

      {/* ── Fixed save bar ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 md:left-60 z-20 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 space-y-2">
        {saveError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {saveError}
          </div>
        )}
        <button
          id="save-attendance-btn"
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition active:bg-green-800"
        >
          {isPending ? 'Saving…' : `Save Attendance — ${fmtDate(initialDate)}`}
        </button>
      </div>

      {/* ── Success toast ──────────────────────────────── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Attendance saved
        </div>
      )}
    </div>
  )
}

/* ── StatCard ─────────────────────────────────────────── */
function StatCard({ label, value, colorClass }: { label: string; value: string | number; colorClass: string }) {
  return (
    <div className={`rounded-lg border px-2 py-2 text-center ${colorClass}`}>
      <p className="text-base font-bold leading-tight">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  )
}

/* ── EmployeeRow ──────────────────────────────────────── */
function EmployeeRow({
  employee,
  sites,
  row,
  onUpdate,
}: {
  employee: Employee
  sites: Site[]
  row: RowState
  onUpdate: (patch: Partial<RowState>) => void
}) {
  const borderColor =
    row.status === 'present' ? 'border-l-green-500'
    : row.status === 'half'  ? 'border-l-amber-400'
    : 'border-l-red-400'

  const muted = row.status === 'absent' ? 'opacity-60' : ''

  return (
    <div className={`relative rounded-xl border border-gray-200 bg-white border-l-4 ${borderColor} overflow-hidden`}>
      <div className={`px-4 py-3 ${muted}`}>

        {/* Top row: avatar + name + rate + P/½/A */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white
            ${row.status === 'present' ? 'bg-green-500'
              : row.status === 'half' ? 'bg-amber-400'
              : 'bg-red-400'}`}
          >
            {initials(employee.name)}
          </div>

          {/* Name + rate */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
            <p className="text-xs text-gray-400">₹{employee.daily_rate.toLocaleString('en-IN')}/day</p>
          </div>

          {/* P / ½ / A toggle */}
          <div className="flex shrink-0 rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
            {([
              { s: 'present', label: 'P', active: 'bg-green-500 text-white border-green-500' },
              { s: 'half',    label: '½', active: 'bg-amber-400 text-white border-amber-400' },
              { s: 'absent',  label: 'A', active: 'bg-red-400 text-white border-red-400'   },
            ] as const).map(({ s, label, active }, i) => (
              <button
                key={s}
                type="button"
                onClick={() => onUpdate({ status: s })}
                className={`px-3 py-2 transition-colors ${i > 0 ? 'border-l border-gray-200' : ''}
                  ${row.status === s ? active : 'text-gray-400 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Second row: site + advance + comment */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Site */}
          <select
            value={row.siteId}
            onChange={e => onUpdate({ siteId: e.target.value })}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 bg-white transition"
          >
            <option value="">— No site —</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Advance amount */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">₹</span>
            <input
              type="number"
              min={0}
              value={row.advanceAmount}
              onChange={e => onUpdate({ advanceAmount: e.target.value })}
              placeholder="Advance"
              className="block w-full rounded-lg border border-gray-200 pl-6 pr-3 py-2 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition"
            />
          </div>

          {/* Comment + expand button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={row.comment}
              onChange={e => onUpdate({ comment: e.target.value })}
              placeholder="Comment"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition"
            />
            <button
              type="button"
              onClick={() => onUpdate({ showExpand: !row.showExpand })}
              title="Advance reason"
              className={`shrink-0 rounded-lg border px-2.5 py-2 text-xs font-bold transition-colors
                ${row.showExpand ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
            >
              +
            </button>
          </div>
        </div>

        {/* Expandable advance reason */}
        {row.showExpand && (
          <div className="mt-2">
            <input
              type="text"
              value={row.advanceReason}
              onChange={e => onUpdate({ advanceReason: e.target.value })}
              placeholder="Advance reason (e.g. medical, festival)"
              className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition"
            />
          </div>
        )}
      </div>
    </div>
  )
}
