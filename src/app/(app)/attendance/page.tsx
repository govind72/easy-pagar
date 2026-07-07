import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import AttendanceClient from './AttendanceClient'
import type { Employee, Site, Attendance } from '@/lib/types'

export const metadata = { title: 'Attendance — EasyPagar' }

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { date: rawDate } = await searchParams

  // Validate date: must be yyyy-mm-dd and not in the future
  const todayStr = new Date().toISOString().split('T')[0]
  const dateStr =
    typeof rawDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawDate) &&
    rawDate <= todayStr
      ? rawDate
      : todayStr

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [empRes, siteRes, attRes] = await Promise.all([
    supabase
      .from('employees')
      .select('*, default_site:sites(id, name)')
      .eq('is_active', true)
      // Only employees who had already joined on the viewed date — an employee
      // who joins today must not appear in (or get records saved for) past days.
      .lte('joined_date', dateStr)
      .order('name', { ascending: true }),
    supabase
      .from('sites')
      .select('id, name, is_active, address, client_name, client_phone, monthly_rate, notes, created_at')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase.from('attendance').select('*').eq('date', dateStr),
  ])

  if (empRes.error || siteRes.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-red-500">
          Failed to load data:{' '}
          {empRes.error?.message ?? siteRes.error?.message}
        </p>
        <a
          href="/attendance"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          Retry
        </a>
      </div>
    )
  }

  return (
    // key={dateStr} forces AttendanceClient to remount when date changes,
    // guaranteeing row state is always initialised fresh from the new records.
    <AttendanceClient
      key={dateStr}
      employees={(empRes.data ?? []) as unknown as Employee[]}
      sites={(siteRes.data ?? []) as Site[]}
      initialRecords={(attRes.data ?? []) as Attendance[]}
      initialDate={dateStr}
    />
  )
}
