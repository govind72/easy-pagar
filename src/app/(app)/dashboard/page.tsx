import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard — EasyPagar' }

/* ── Helpers ──────────────────────────────────────────── */
function todayISO() { return new Date().toISOString().split('T')[0] }
function currentMonthParam() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
}
function fmt(n: number) { return `₹${(n||0).toLocaleString('en-IN')}` }
function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/* ── Safe fetch wrapper — never throws ───────────────── */
async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try { return { data: await fn(), error: null } }
  catch (e) { return { data: null, error: e instanceof Error ? e.message : 'Failed to load' } }
}

/* ── Shared UI atoms ──────────────────────────────────── */
function SectionError({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {msg}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl border ${color} bg-white px-4 py-4 flex-1 min-w-[120px]`}>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────── */
export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sb = createClient(cookieStore)
  const today = todayISO()
  const monthParam = currentMonthParam()

  /* Parallel independent fetches, each wrapped in safe() */
  const [todayAtt, siteActivity, monthlySalary, monthlyPnl, recentAdv] = await Promise.all([
    safe(async () => {
      const { data, error } = await sb.from('attendance').select('status, advance_amount, site_id').eq('date', today)
      if (error) throw error
      return data ?? []
    }),
    safe(async () => {
      const { data, error } = await sb
        .from('attendance')
        .select('site_id, status, advance_amount, site:sites(name)')
        .eq('date', today)
        .neq('status', 'absent')
      if (error) throw error
      return data ?? []
    }),
    safe(async () => {
      const { data, error } = await sb.from('mv_monthly_salary').select('gross_salary, total_advances').eq('month', monthParam)
      if (error) throw error
      return data ?? []
    }),
    safe(async () => {
      const { data, error } = await sb.from('mv_site_monthly_pnl').select('net_profit').eq('month', monthParam)
      if (error) throw error
      return data ?? []
    }),
    safe(async () => {
      const { data, error } = await sb
        .from('attendance')
        .select('date, advance_amount, advance_reason, employee:employees(name), site:sites(name)')
        .gt('advance_amount', 0)
        .order('date', { ascending: false })
        .limit(10)
      if (error) throw error
      return data ?? []
    }),
  ])

  /* Today stats */
  const attRows    = todayAtt.data ?? []
  const present    = attRows.filter(r => r.status === 'present').length
  const half       = attRows.filter(r => r.status === 'half').length
  const absent     = attRows.filter(r => r.status === 'absent').length
  const advToday   = attRows.reduce((s, r) => s + (r.advance_amount || 0), 0)
  const noAttToday = attRows.length === 0

  /* Site activity grouping */
  const siteMap: Record<string, { name: string; workers: number; advance: number }> = {}
  for (const r of (siteActivity.data ?? [])) {
    const sid  = r.site_id
    const name = (r.site as any)?.name ?? 'Unknown'
    if (!siteMap[sid]) siteMap[sid] = { name, workers: 0, advance: 0 }
    siteMap[sid].workers += 1
    siteMap[sid].advance += r.advance_amount || 0
  }
  const siteRows = Object.values(siteMap)

  /* Monthly totals */
  const totGross   = (monthlySalary.data ?? []).reduce((s: number, r: any) => s + (r.gross_salary || 0), 0)
  const totAdv     = (monthlySalary.data ?? []).reduce((s: number, r: any) => s + (r.total_advances || 0), 0)
  const totProfit  = (monthlyPnl.data ?? []).reduce((s: number, r: any) => s + (r.net_profit || 0), 0)

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{greeting()} 👋</h1>
        <p className="text-sm text-gray-400 mt-1">{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
      </div>

      {/* ── Section 1: Today's summary ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Today&rsquo;s Attendance</h2>

        {todayAtt.error
          ? <SectionError msg={todayAtt.error} />
          : <>
              {noAttToday && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm font-medium text-amber-800 flex-1">⚠️ Attendance not marked yet for today</p>
                  <Link href="/attendance" className="text-sm font-semibold text-amber-700 underline whitespace-nowrap">Mark attendance →</Link>
                </div>
              )}
              <div className="flex gap-3 flex-wrap">
                <StatCard label="Present"  value={present}    color="border-green-200" />
                <StatCard label="Half Day" value={half}       color="border-amber-200" />
                <StatCard label="Absent"   value={absent}     color="border-red-200" />
                <StatCard label="Advances" value={fmt(advToday)} color="border-blue-200" />
              </div>
            </>
        }
      </section>

      {/* ── Section 2: Site activity today ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Site Activity Today</h2>
        {siteActivity.error
          ? <SectionError msg={siteActivity.error} />
          : siteRows.length === 0
            ? <p className="text-sm text-gray-400">No site activity recorded for today.</p>
            : (
              <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Workers Present</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Advance Given</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {siteRows.map(s => (
                      <tr key={s.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.workers}</td>
                        <td className="px-4 py-3 text-gray-600">{s.advance ? fmt(s.advance) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      </section>

      {/* ── Section 3: Month at a glance ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">This Month at a Glance</h2>
        {(monthlySalary.error || monthlyPnl.error)
          ? <SectionError msg={monthlySalary.error ?? monthlyPnl.error ?? 'Failed to load'} />
          : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                <MonthCard label="Total Salary to Pay"  value={fmt(totGross)}  sub="Gross wages this month"    color="text-gray-900" />
                <MonthCard label="Total Advances Given" value={fmt(totAdv)}    sub="Across all employees"      color="text-gray-900" />
                <MonthCard label="Net Profit (All Sites)" value={fmt(totProfit)} sub="Revenue − Labour − Expenses" color={totProfit >= 0 ? 'text-green-700' : 'text-red-600'} />
              </div>
              <p className="text-xs text-gray-400">Based on data up to {today}</p>
            </>
          )
        }
      </section>

      {/* ── Section 4: Quick actions ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/attendance"           icon="📋" label="Mark Today's Attendance" />
          <QuickAction href="/expenses?tab=expenses" icon="💸" label="Add Site Expense" />
          <QuickAction href="/expenses?tab=services" icon="⚡" label="Add Extra Service" />
          <QuickAction href="/reports"               icon="📊" label="View Monthly Report" />
        </div>
      </section>

      {/* ── Section 5: Recent advances ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Advances</h2>
        {recentAdv.error
          ? <SectionError msg={recentAdv.error} />
          : (recentAdv.data ?? []).length === 0
            ? <p className="text-sm text-gray-400">No advances recorded yet.</p>
            : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block rounded-xl border border-gray-200 bg-white overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left">
                        {['Date','Employee','Amount','Reason','Site'].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(recentAdv.data ?? []).map((r: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.date}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{r.employee?.name ?? '—'}</td>
                          <td className="px-4 py-3 font-semibold text-blue-700">{fmt(r.advance_amount)}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{r.advance_reason || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{r.site?.name ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {(recentAdv.data ?? []).map((r: any, i: number) => (
                    <div key={i} className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{r.employee?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.date} · {r.site?.name ?? '—'}</p>
                        {r.advance_reason && <p className="text-xs text-gray-500 mt-0.5">{r.advance_reason}</p>}
                      </div>
                      <p className="font-bold text-blue-700 shrink-0">{fmt(r.advance_amount)}</p>
                    </div>
                  ))}
                </div>
              </>
            )
        }
      </section>

    </div>
  )
}

/* ── Local sub-components ─────────────────────────────── */
function MonthCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-5">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function QuickAction({ href, icon, label }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href}
      className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-5 text-center text-sm font-medium text-green-700 hover:bg-green-50 hover:border-green-400 transition">
      <span className="text-2xl">{icon}</span>
      <span className="leading-tight">{label}</span>
    </Link>
  )
}
