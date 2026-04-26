'use client'
import type { SalaryRow, BillingRow, LedgerRow, SiteDetailAtt, SiteDetailES, SiteDetailSE, Emp, Site } from './ReportsClient'
import { fmt, fmtDays, fmtMonth, netCls } from './ReportsClient'

/* ── Shared micro-components ──────────────────────────── */
export function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition print:hidden">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      Export Excel
    </button>
  )
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-400">{msg}</div>
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{children}</th>
}
function Td({ children, cls }: { children: React.ReactNode; cls?: string }) {
  return <td className={`px-4 py-3 ${cls ?? 'text-gray-600'}`}>{children}</td>
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'present' ? 'bg-green-50 text-green-700'
    : status === 'half' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>{status}</span>
}

/* ── Salary tab ───────────────────────────────────────── */
export function SalaryTab({ data, month, onExport }: { data: SalaryRow[]; month: string; onExport: () => void }) {
  const totGross = data.reduce((s,r)=>s+r.gross_salary,0)
  const totAdv   = data.reduce((s,r)=>s+r.total_advances,0)
  const totNet   = data.reduce((s,r)=>s+r.net_payable,0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h2 className="text-base font-semibold text-gray-700">Salary Report — {fmtMonth(month)}</h2>
        <ExportBtn onClick={onExport} />
      </div>
      {data.length === 0 ? <Empty msg="No attendance data for this month. Mark attendance first." /> : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Employee','Present','Half','Eff. Days','Rate','Gross','Advances','Net Payable'].map(h=><Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(r => {
                const present = Math.max(0, Math.round(((r.effective_days||0) - (r.half_days||0)*0.5) * 10) / 10)
                return (
                  <tr key={r.employee_name} className="hover:bg-gray-50">
                    <Td cls="font-medium text-gray-800">{r.employee_name}</Td>
                    <Td>{present}</Td>
                    <Td>{r.half_days ?? 0}</Td>
                    <Td>{fmtDays(r.effective_days)}</Td>
                    <Td>{fmt(r.daily_rate)}</Td>
                    <Td cls="text-gray-800">{fmt(r.gross_salary)}</Td>
                    <Td>{fmt(r.total_advances)}</Td>
                    <Td cls={netCls(r.net_payable)}>{fmt(r.net_payable)}</Td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="px-4 py-3 text-gray-800">Total</td>
                <td colSpan={4} className="px-4 py-3" />
                <td className="px-4 py-3 text-gray-800">{fmt(totGross)}</td>
                <td className="px-4 py-3 text-gray-800">{fmt(totAdv)}</td>
                <td className={`px-4 py-3 ${netCls(totNet)}`}>{fmt(totNet)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Billing tab ──────────────────────────────────────── */
export function BillingTab({ data, month, onExport }: { data: BillingRow[]; month: string; onExport: () => void }) {
  const totBilled = data.reduce((s,r)=>s+r.total_billed,0)
  const totLabour = data.reduce((s,r)=>s+r.labour_cost,0)
  const totES     = data.reduce((s,r)=>s+r.extra_services,0)
  const totSE     = data.reduce((s,r)=>s+r.site_expenses,0)
  const totProfit = data.reduce((s,r)=>s+r.net_profit,0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h2 className="text-base font-semibold text-gray-700">Site Billing — {fmtMonth(month)}</h2>
        <ExportBtn onClick={onExport} />
      </div>
      {data.length === 0 ? <Empty msg="No active sites found." /> : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Site','Client','Monthly Rate','Extra Services','Site Expenses','Total Billed','Labour','Net Profit'].map(h=><Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <Td cls="font-medium text-gray-800">{r.name}</Td>
                  <Td cls="text-gray-500">{r.client_name || '—'}</Td>
                  <Td>{fmt(r.monthly_rate)}</Td>
                  <Td>{fmt(r.extra_services)}</Td>
                  <Td>{fmt(r.site_expenses)}</Td>
                  <Td cls="font-medium text-gray-800">{fmt(r.total_billed)}</Td>
                  <Td>{fmt(r.labour_cost)}</Td>
                  <Td cls={netCls(r.net_profit)}>{fmt(r.net_profit)}</Td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="px-4 py-3 text-gray-800">Total</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-gray-800">{fmt(totES)}</td>
                <td className="px-4 py-3 text-gray-800">{fmt(totSE)}</td>
                <td className="px-4 py-3 text-gray-800">{fmt(totBilled)}</td>
                <td className="px-4 py-3 text-gray-800">{fmt(totLabour)}</td>
                <td className={`px-4 py-3 ${netCls(totProfit)}`}>{fmt(totProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Employee Ledger tab ──────────────────────────────── */
export function EmpLedgerTab({ data, employees, selectedEmp, month, onSelectEmp, onExport }: {
  data:LedgerRow[]; employees:Emp[]; selectedEmp:string; month:string
  onSelectEmp:(id:string)=>void; onExport:()=>void
}) {
  const emp  = employees.find(e=>e.id===selectedEmp)
  const rate = emp?.daily_rate ?? 0
  function earn(r:LedgerRow){ return r.status==='present'?rate:r.status==='half'?rate/2:0 }
  const totEarned = data.reduce((s,r)=>s+earn(r),0)
  const totAdv    = data.reduce((s,r)=>s+(r.advance_amount||0),0)
  const totNet    = totEarned - totAdv
  const daysWorked = data.filter(r=>r.status!=='absent').length

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4 print:hidden">
        <select value={selectedEmp} onChange={e=>onSelectEmp(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-500 bg-white">
          {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <h2 className="text-base font-semibold text-gray-700 flex-1">{emp?.name} — {fmtMonth(month)}</h2>
        <ExportBtn onClick={onExport} />
      </div>
      {data.length===0 ? <Empty msg="No attendance records for this employee this month." /> : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Date','Status','Site','Earnings','Advance','Comment'].map(h=><Th key={h}>{h}</Th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(r=>(
                <tr key={r.date} className="hover:bg-gray-50">
                  <Td cls="text-gray-500 whitespace-nowrap">{r.date}</Td>
                  <Td><StatusBadge status={r.status}/></Td>
                  <Td>{(r.site as any)?.name ?? '—'}</Td>
                  <Td cls="text-gray-800">{fmt(earn(r))}</Td>
                  <Td>{r.advance_amount ? fmt(r.advance_amount) : '—'}</Td>
                  <Td cls="text-gray-400 text-xs">{r.comment || '—'}</Td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <td className="px-4 py-3 text-gray-800">{daysWorked} days</td>
                <td colSpan={2} className="px-4 py-3" />
                <td className="px-4 py-3 text-gray-800">{fmt(totEarned)}</td>
                <td className="px-4 py-3 text-gray-800">{fmt(totAdv)}</td>
                <td className={`px-4 py-3 ${netCls(totNet)}`}>Net: {fmt(totNet)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Site Ledger tab ──────────────────────────────────── */
export function SiteLedgerTab({ att, es, se, sites, selectedSite, month, onSelectSite, onExport }: {
  att:SiteDetailAtt[]; es:SiteDetailES[]; se:SiteDetailSE[]
  sites:Site[]; selectedSite:string; month:string
  onSelectSite:(id:string)=>void; onExport:()=>void
}) {
  const site = sites.find(s=>s.id===selectedSite)
  function attEarn(r:SiteDetailAtt){ const rate=(r.employee as any)?.daily_rate??0; return r.status==='present'?rate:r.status==='half'?rate/2:0 }
  const totLabour = att.reduce((s,r)=>s+attEarn(r),0)
  const totES     = es.reduce((s,r)=>s+r.amount,0)
  const totSE     = se.reduce((s,r)=>s+r.amount,0)
  const totBilled = (site?.monthly_rate??0) + totES
  const net       = totBilled - totLabour - totSE

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <select value={selectedSite} onChange={e=>onSelectSite(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-green-500 bg-white">
          {sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <h2 className="text-base font-semibold text-gray-700 flex-1">{site?.name} — {fmtMonth(month)}</h2>
        <ExportBtn onClick={onExport} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'Monthly Rate', val:fmt(site?.monthly_rate??0), cls:'text-gray-800'},
          {label:'Labour Cost',  val:fmt(totLabour), cls:'text-gray-800'},
          {label:'Extra Services Billed', val:fmt(totES), cls:'text-blue-700'},
          {label:'Site Expenses', val:fmt(totSE), cls:'text-amber-700'},
        ].map(({label,val,cls})=>(
          <div key={label} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
            <p className={`text-base font-bold ${cls}`}>{val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Billed</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">{fmt(totBilled)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Net Profit</p>
          <p className={`text-xl font-bold mt-0.5 ${netCls(net)}`}>{fmt(net)}</p>
        </div>
      </div>

      {/* Attendance at site */}
      <Section title={`Labour (${att.filter(r=>r.status!=='absent').length} working days)`}>
        {att.length===0 ? <Empty msg="No attendance at this site this month."/> : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead><tr className="border-b border-gray-100 bg-gray-50">{['Date','Employee','Status','Day Earning'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {att.map((r,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <Td cls="text-gray-500 whitespace-nowrap">{r.date}</Td>
                    <Td cls="font-medium text-gray-800">{(r.employee as any)?.name??'—'}</Td>
                    <Td><StatusBadge status={r.status}/></Td>
                    <Td cls="text-gray-800">{fmt(attEarn(r))}</Td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td colSpan={3} className="px-4 py-3 text-gray-800">Total Labour</td>
                  <td className="px-4 py-3 text-gray-800">{fmt(totLabour)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Extra services */}
      <Section title={`Extra Services Billed — ${fmt(totES)}`}>
        {es.length===0 ? <Empty msg="No extra services this month."/> : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[380px]">
              <thead><tr className="border-b border-gray-100 bg-gray-50">{['Date','Description','Amount'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {es.map((r,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <Td cls="text-gray-500 whitespace-nowrap">{r.date}</Td>
                    <Td cls="text-gray-700">{r.description}</Td>
                    <Td cls="font-medium text-blue-700">{fmt(r.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Site expenses */}
      <Section title={`Site Expenses — ${fmt(totSE)}`}>
        {se.length===0 ? <Empty msg="No expenses recorded for this site this month."/> : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead><tr className="border-b border-gray-100 bg-gray-50">{['Date','Description','Category','Amount'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100">
                {se.map((r,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <Td cls="text-gray-500 whitespace-nowrap">{r.date}</Td>
                    <Td cls="text-gray-700">{r.description}</Td>
                    <Td cls="text-gray-500 capitalize">{r.category}</Td>
                    <Td cls="font-medium text-amber-700">{fmt(r.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  )
}
