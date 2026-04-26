import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import ExpensesClient from './ExpensesClient'
import type { Site } from '@/lib/types'

export const metadata = { title: 'Expenses — EasyPagar' }

export default async function ExpensesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [seRes, esRes, siteRes] = await Promise.all([
    supabase.from('site_expenses').select('*, site:sites(name)').order('date', { ascending: false }),
    supabase.from('extra_services').select('*, site:sites(name)').order('date', { ascending: false }),
    supabase.from('sites').select('id, name, is_active, address, client_name, client_phone, monthly_rate, notes, created_at').eq('is_active', true).order('name'),
  ])

  if (seRes.error || esRes.error || siteRes.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-red-500">
          Failed to load data: {seRes.error?.message ?? esRes.error?.message ?? siteRes.error?.message}
        </p>
        <a href="/expenses" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition">
          Retry
        </a>
      </div>
    )
  }

  return (
    <ExpensesClient
      siteExpenses={(seRes.data ?? []) as any}
      extraServices={(esRes.data ?? []) as any}
      sites={(siteRes.data ?? []) as Site[]}
    />
  )
}
