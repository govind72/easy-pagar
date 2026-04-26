'use client'

import { useEffect, useRef, useState } from 'react'

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']
const DAY_HDRS = ['Su','Mo','Tu','We','Th','Fr','Sa']
const SHORT_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const WEEK_DAY  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

interface Props {
  value: string   // YYYY-MM-DD
  max: string     // YYYY-MM-DD
  onChange: (date: string) => void
}

function pad(n: number) { return String(n).padStart(2, '0') }

function fmtLabel(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
  const label = `${d} ${SHORT_MON[m - 1]}`
  if (diff === 0) return `Today, ${label}`
  if (diff === -1) return `Yesterday, ${label}`
  return `${WEEK_DAY[dt.getDay()]}, ${label}`
}

function buildCells(year: number, month: number) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays    = new Date(year, month, 0).getDate()
  const cells: Array<{ ds: string; cur: boolean }> = []

  // Leading padding from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const pm = month === 0 ? 11 : month - 1
    const py = month === 0 ? year - 1 : year
    cells.push({ ds: `${py}-${pad(pm+1)}-${pad(prevDays-i)}`, cur: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ ds: `${year}-${pad(month+1)}-${pad(d)}`, cur: true })
  // Trailing padding
  const tail = (7 - (cells.length % 7)) % 7
  for (let d = 1; d <= tail; d++) {
    const nm = month === 11 ? 0  : month + 1
    const ny = month === 11 ? year + 1 : year
    cells.push({ ds: `${ny}-${pad(nm+1)}-${pad(d)}`, cur: false })
  }
  return cells
}

export default function DatePicker({ value, max, onChange }: Props) {
  const [open, setOpen]           = useState(false)
  const [viewYear, setViewYear]   = useState(() => Number(value.split('-')[0]))
  const [viewMonth, setViewMonth] = useState(() => Number(value.split('-')[1]) - 1)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Sync calendar view when value changes via arrow buttons
  useEffect(() => {
    setViewYear(Number(value.split('-')[0]))
    setViewMonth(Number(value.split('-')[1]) - 1)
  }, [value])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const maxYear  = Number(max.split('-')[0])
  const maxMonth = Number(max.split('-')[1]) - 1
  const canNext  = !(viewYear === maxYear && viewMonth >= maxMonth)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (!canNext) return
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const cells    = buildCells(viewYear, viewMonth)
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div ref={wrapRef} className="relative flex flex-1 justify-center">
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-200 hover:bg-gray-100 active:bg-gray-200 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {fmtLabel(value)}
      </button>

      {/* ── Calendar popup ── */}
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-72 rounded-2xl bg-white border border-gray-100 shadow-2xl p-4">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} disabled={!canNext}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HDRS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map(({ ds, cur }) => {
              const future   = ds > max
              const selected = ds === value
              const isToday  = ds === todayStr
              const clickable = cur && !future

              return (
                <button
                  key={ds}
                  type="button"
                  disabled={!clickable}
                  onClick={() => { if (clickable) { onChange(ds); setOpen(false) } }}
                  className={`
                    text-xs py-2 rounded-lg font-medium transition-colors
                    ${selected
                      ? 'bg-green-600 text-white'
                      : isToday && cur
                        ? 'ring-2 ring-inset ring-green-500 text-green-700'
                        : clickable
                          ? 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                          : 'text-gray-300 cursor-default'
                    }
                  `}
                >
                  {Number(ds.split('-')[2])}
                </button>
              )
            })}
          </div>

          {/* Jump-to-today shortcut */}
          {value !== todayStr && (
            <button
              type="button"
              onClick={() => { onChange(todayStr); setOpen(false) }}
              className="mt-3 w-full rounded-lg py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 hover:text-green-700 transition"
            >
              Go to Today
            </button>
          )}
        </div>
      )}
    </div>
  )
}
