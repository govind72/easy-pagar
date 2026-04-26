'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SalaryTab, BillingTab, EmpLedgerTab, SiteLedgerTab } from './ReportTabs'

export type Emp  = { id: string; name: string; daily_rate: number }
export type Site = { id: string; name: string; client_name: string; monthly_rate: number }
export type SalaryRow   = { employee_name:string; days_present:number; half_days:number; effective_days:number; daily_rate:number; gross_salary:number; total_advances:number; net_payable:number }
export type BillingRow  = { id:string; name:string; client_name:string; monthly_rate:number; extra_services:number; site_expenses:number; labour_cost:number; total_billed:number; net_profit:number }
export type LedgerRow   = { date:string; status:string; advance_amount:number; comment:string|null; site:{name:string}|null }
export type SiteDetailAtt = { date:string; status:string; employee:{name:string; daily_rate:number}|null }
export type SiteDetailES  = { date:string; description:string; amount:number }
export type SiteDetailSE  = { date:string; description:string; category:string; amount:number }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
export function currentMonth() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
export function addMonths(m:string,delta:number){ const [y,mo]=m.split('-').map(Number); const d=new Date(y,mo-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
export function fmtMonth(m:string){ const [y,mo]=m.split('-').map(Number); return `${MONTHS[mo-1]} ${y}` }
export function monthStart(m:string){ return `${m}-01` }
export function monthEnd(m:string){ const [y,mo]=m.split('-').map(Number); return new Date(y,mo,0).toISOString().split('T')[0] }
export function fmt(n:number){ return `₹${(n||0).toLocaleString('en-IN')}` }
export function fmtDays(n:number){ return Number((n||0).toFixed(1)).toString() }
export function netCls(n:number){ return n>=0?'text-green-700 font-semibold':'text-red-600 font-semibold' }

type Tab = 'salary'|'billing'|'ledger'|'site'

export default function ReportsClient({ employees, sites }: { employees:Emp[]; sites:Site[] }) {
  const [month, setMonth] = useState(currentMonth)
  const [tab, setTab]     = useState<Tab>('salary')
  const [salaryData, setSalaryData]   = useState<SalaryRow[]>([])
  const [billingData, setBillingData] = useState<BillingRow[]>([])
  const [ledgerEmp, setLedgerEmp]   = useState(employees[0]?.id ?? '')
  const [ledgerData, setLedgerData] = useState<LedgerRow[]>([])
  const [siteId, setSiteId]         = useState(sites[0]?.id ?? '')
  const [siteAtt, setSiteAtt]       = useState<SiteDetailAtt[]>([])
  const [siteES,  setSiteES]        = useState<SiteDetailES[]>([])
  const [siteSE,  setSiteSE]        = useState<SiteDetailSE[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string|null>(null)
  const [exportErr, setExportErr] = useState(false)
  const sb = createClient()

  const fetchSalary = useCallback(async (m:string) => {
    const {data,error} = await sb.from('mv_monthly_salary').select('*').eq('month',monthStart(m)).order('employee_name')
    if (error) throw error
    setSalaryData((data??[]) as SalaryRow[])
  },[]) // eslint-disable-line

  const fetchBilling = useCallback(async (m:string) => {
    const ms = monthStart(m), me = monthEnd(m)
    const [attRes, esRes, seRes] = await Promise.all([
      sb.from('attendance').select('site_id, status, employee:employees(daily_rate)').gte('date',ms).lte('date',me).neq('status','absent'),
      sb.from('extra_services').select('site_id, amount').gte('date',ms).lte('date',me),
      sb.from('site_expenses').select('site_id, amount').gte('date',ms).lte('date',me),
    ])
    if (attRes.error) throw attRes.error
    const labour:Record<string,number>={}, es:Record<string,number>={}, se:Record<string,number>={}
    for (const r of (attRes.data??[])) {
      const rate = (r.employee as any)?.daily_rate??0
      labour[r.site_id] = (labour[r.site_id]??0) + rate*(r.status==='present'?1:0.5)
    }
    for (const r of (esRes.data??[])) es[r.site_id] = (es[r.site_id]??0) + r.amount
    for (const r of (seRes.data??[])) se[r.site_id] = (se[r.site_id]??0) + r.amount
    setBillingData(sites.map(s => ({
      id: s.id, name: s.name, client_name: s.client_name, monthly_rate: s.monthly_rate,
      extra_services: es[s.id]??0, site_expenses: se[s.id]??0,
      labour_cost: labour[s.id]??0,
      total_billed: s.monthly_rate + (es[s.id]??0),
      net_profit: s.monthly_rate + (es[s.id]??0) - (labour[s.id]??0) - (se[s.id]??0),
    })))
  },[sites]) // eslint-disable-line

  const fetchLedger = useCallback(async (eid:string, m:string) => {
    if (!eid) return
    const {data,error} = await sb.from('attendance').select('date,status,advance_amount,comment,site:sites(name)').eq('employee_id',eid).gte('date',monthStart(m)).lte('date',monthEnd(m)).order('date')
    if (error) throw error
    setLedgerData((data??[]) as LedgerRow[])
  },[]) // eslint-disable-line

  const fetchSiteDetail = useCallback(async (sid:string, m:string) => {
    if (!sid) return
    const ms=monthStart(m), me=monthEnd(m)
    const [a,e,s] = await Promise.all([
      sb.from('attendance').select('date,status,employee:employees(name,daily_rate)').eq('site_id',sid).gte('date',ms).lte('date',me).order('date'),
      sb.from('extra_services').select('date,description,amount').eq('site_id',sid).gte('date',ms).lte('date',me).order('date'),
      sb.from('site_expenses').select('date,description,category,amount').eq('site_id',sid).gte('date',ms).lte('date',me).order('date'),
    ])
    if (a.error) throw a.error
    setSiteAtt((a.data??[]) as SiteDetailAtt[])
    setSiteES((e.data??[]) as SiteDetailES[])
    setSiteSE((s.data??[]) as SiteDetailSE[])
  },[]) // eslint-disable-line

  useEffect(() => {
    setError(null); setLoading(true)
    const p = tab==='salary' ? fetchSalary(month)
            : tab==='billing' ? fetchBilling(month)
            : tab==='ledger' ? fetchLedger(ledgerEmp,month)
            : fetchSiteDetail(siteId,month)
    p.catch(e=>setError(e.message??'Failed to load')).finally(()=>setLoading(false))
  },[month,tab,ledgerEmp,siteId]) // eslint-disable-line

  async function doExport(rows:object[], sheet:string, file:string) {
    try { const X=await import('xlsx'); const ws=X.utils.json_to_sheet(rows); const wb=X.utils.book_new(); X.utils.book_append_sheet(wb,ws,sheet); X.writeFile(wb,file) }
    catch { setExportErr(true); setTimeout(()=>setExportErr(false),3000) }
  }

  async function doExportAOA(aoa: unknown[][], sheet:string, file:string) {
    try { const X=await import('xlsx'); const ws=X.utils.aoa_to_sheet(aoa); const wb=X.utils.book_new(); X.utils.book_append_sheet(wb,ws,sheet); X.writeFile(wb,file) }
    catch { setExportErr(true); setTimeout(()=>setExportErr(false),3000) }
  }

  function exportEmpLedger() {
    const emp = employees.find(e=>e.id===ledgerEmp)
    const rate = emp?.daily_rate ?? 0
    const earn = (r:LedgerRow) => r.status==='present'?rate : r.status==='half'?rate/2 : 0
    const totEarned  = ledgerData.reduce((s,r)=>s+earn(r),0)
    const totAdv     = ledgerData.reduce((s,r)=>s+(r.advance_amount||0),0)
    const daysWorked = ledgerData.filter(r=>r.status!=='absent').length
    const net        = totEarned - totAdv
    const monthLabel = fmtMonth(month)
    const aoa: unknown[][] = [
      [`Employee Ledger — ${emp?.name ?? ''} — ${monthLabel}`],
      [],
      ['SUMMARY'],
      ['Daily Rate',            `₹${rate}`],
      ['Days Worked',           daysWorked],
      ['Total Earned',          `₹${totEarned.toLocaleString('en-IN')}`],
      ['Total Advances',        `₹${totAdv.toLocaleString('en-IN')}`],
      ['Net Payable',           `₹${net.toLocaleString('en-IN')}`],
      [],
      ['DAILY DETAIL'],
      ['Date','Status','Site','Day Earnings (₹)','Advance (₹)','Comment'],
      ...ledgerData.map(r => [
        r.date,
        r.status,
        (r.site as any)?.name ?? '—',
        earn(r),
        r.advance_amount || 0,
        r.comment ?? '',
      ]),
      [],
      ['','','','Total Earned','Total Advances','Net Payable'],
      ['','','',totEarned, totAdv, net],
    ]
    const empSlug = (emp?.name??'employee').toLowerCase().replace(/\s+/g,'-')
    doExportAOA(aoa, 'Ledger', `${empSlug}-ledger-${slug}.xlsx`)
  }

  function exportSiteLedger() {
    const site    = sites.find(s=>s.id===siteId)
    const attEarn = (r:SiteDetailAtt) => { const rt=(r.employee as any)?.daily_rate??0; return r.status==='present'?rt:r.status==='half'?rt/2:0 }
    const totLabour = siteAtt.reduce((s,r)=>s+attEarn(r),0)
    const totES     = siteES.reduce((s,r)=>s+r.amount,0)
    const totSE     = siteSE.reduce((s,r)=>s+r.amount,0)
    const totBilled = (site?.monthly_rate??0) + totES
    const net       = totBilled - totLabour - totSE
    const C = (n:number) => `₹${n.toLocaleString('en-IN')}`
    const aoa: unknown[][] = [
      [`Site Ledger — ${site?.name ?? ''} — ${fmtMonth(month)}`],
      [],
      ['SUMMARY'],
      ['Client',                site?.client_name ?? ''],
      ['Monthly Rate',          C(site?.monthly_rate??0)],
      ['Extra Services Billed', C(totES)],
      ['Total Billed to Client',C(totBilled)],
      [],
      ['Labour Cost',           C(totLabour)],
      ['Site Expenses',         C(totSE)],
      ['Net Profit',            C(net)],
      [],
      ['LABOUR DETAIL'],
      ['Date','Employee','Status','Day Earning (₹)'],
      ...siteAtt.map(r=>[ r.date, (r.employee as any)?.name??'—', r.status, attEarn(r) ]),
      ['','','Total Labour', totLabour],
      [],
      ['EXTRA SERVICES'],
      ['Date','Description','Amount (₹)'],
      ...siteES.map(r=>[ r.date, r.description, r.amount ]),
      ['','Total', totES],
      [],
      ['SITE EXPENSES'],
      ['Date','Description','Category','Amount (₹)'],
      ...siteSE.map(r=>[ r.date, r.description, r.category, r.amount ]),
      ['','','Total', totSE],
    ]
    const siteSlug = (site?.name??'site').toLowerCase().replace(/\s+/g,'-')
    doExportAOA(aoa, 'Site Ledger', `${siteSlug}-ledger-${slug}.xlsx`)
  }

  function exportSalary() {
    const totGross = salaryData.reduce((s,r)=>s+r.gross_salary,0)
    const totAdv   = salaryData.reduce((s,r)=>s+r.total_advances,0)
    const totNet   = salaryData.reduce((s,r)=>s+r.net_payable,0)
    const C = (n:number) => `₹${n.toLocaleString('en-IN')}`
    const aoa: unknown[][] = [
      [`Salary Report — ${fmtMonth(month)}`],
      [],
      ['SUMMARY'],
      ['Total Employees',    salaryData.length],
      ['Total Gross Salary', C(totGross)],
      ['Total Advances',     C(totAdv)],
      ['Net Payable',        C(totNet)],
      [],
      ['EMPLOYEE BREAKDOWN'],
      ['Employee','Present Days','Half Days','Eff. Days','Daily Rate (₹)','Gross Salary (₹)','Advances (₹)','Net Payable (₹)'],
      ...salaryData.map(r => {
        const present = Math.max(0, Math.round(((r.effective_days||0) - (r.half_days||0)*0.5)*10)/10)
        return [r.employee_name, present, r.half_days||0, Number((r.effective_days||0).toFixed(1)), r.daily_rate, r.gross_salary, r.total_advances, r.net_payable]
      }),
      ['TOTAL','','','','', totGross, totAdv, totNet],
    ]
    doExportAOA(aoa, `Salary ${fmtMonth(month)}`, `salary-report-${slug}.xlsx`)
  }

  function exportBilling() {
    const totBilled = billingData.reduce((s,r)=>s+r.total_billed,0)
    const totLabour = billingData.reduce((s,r)=>s+r.labour_cost,0)
    const totES     = billingData.reduce((s,r)=>s+r.extra_services,0)
    const totSE     = billingData.reduce((s,r)=>s+r.site_expenses,0)
    const totProfit = billingData.reduce((s,r)=>s+r.net_profit,0)
    const C = (n:number) => `₹${n.toLocaleString('en-IN')}`
    const aoa: unknown[][] = [
      [`Site Billing Report — ${fmtMonth(month)}`],
      [],
      ['SUMMARY'],
      ['Total Sites',           billingData.length],
      ['Total Billed to Clients', C(totBilled)],
      ['Total Extra Services',  C(totES)],
      ['Total Labour Cost',     C(totLabour)],
      ['Total Site Expenses',   C(totSE)],
      ['Net Profit',            C(totProfit)],
      [],
      ['SITE BREAKDOWN'],
      ['Site','Client','Monthly Rate (₹)','Extra Services (₹)','Site Expenses (₹)','Total Billed (₹)','Labour Cost (₹)','Net Profit (₹)'],
      ...billingData.map(r => [r.name, r.client_name||'', r.monthly_rate, r.extra_services, r.site_expenses, r.total_billed, r.labour_cost, r.net_profit]),
      ['TOTAL','','', totES, totSE, totBilled, totLabour, totProfit],
    ]
    doExportAOA(aoa, `Billing ${fmtMonth(month)}`, `billing-report-${slug}.xlsx`)
  }

  const slug = fmtMonth(month).toLowerCase().replace(' ','-')
  const isFuture = month >= addMonths(currentMonth(),1)
  const TABS: {key:Tab; label:string}[] = [{key:'salary',label:'Salary'},{key:'billing',label:'Site Billing'},{key:'ledger',label:'Employee Ledger'},{key:'site',label:'Site Ledger'}]

  return (
    <div className="p-4 sm:p-6 md:p-8 print:p-0">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>setMonth(m=>addMonths(m,-1))} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition print:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800 min-w-[160px] text-center">{fmtMonth(month)}</h1>
        <button onClick={()=>setMonth(m=>addMonths(m,1))} disabled={isFuture} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition print:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit flex-wrap print:hidden">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab===t.key?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex justify-between items-center">{error}<button onClick={()=>{setError(null);setTab(tab)}} className="underline ml-4">Retry</button></div>}
      {exportErr && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">Export failed, please try again.</div>}
      {loading && <div className="py-12 text-center text-sm text-gray-400">Loading…</div>}

      {!loading && !error && (
        <>
          {tab==='salary'  && <SalaryTab  data={salaryData}  month={month} onExport={exportSalary} />}
          {tab==='billing' && <BillingTab data={billingData} month={month} onExport={exportBilling} />}
          {tab==='ledger'  && <EmpLedgerTab data={ledgerData} employees={employees} selectedEmp={ledgerEmp} month={month} onSelectEmp={setLedgerEmp} onExport={exportEmpLedger} />}
          {tab==='site'    && <SiteLedgerTab att={siteAtt} es={siteES} se={siteSE} sites={sites} selectedSite={siteId} month={month} onSelectSite={setSiteId} onExport={exportSiteLedger} />}
        </>
      )}
    </div>
  )
}
