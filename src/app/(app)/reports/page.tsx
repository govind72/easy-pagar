import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export const metadata = { title: 'Reports — EasyPagar' }

export default async function ReportsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: employees }, { data: sites }] = await Promise.all([
    supabase.from('employees').select('id, name, daily_rate').eq('is_active', true).order('name'),
    supabase.from('sites').select('id, name, client_name, monthly_rate').eq('is_active', true).order('name'),
  ])

  return <ReportsClient employees={employees ?? []} sites={sites ?? []} />
}
