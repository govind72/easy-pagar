import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import EmployeesClient from './EmployeesClient'
import type { Employee, Site } from '@/lib/types'

export const metadata = { title: 'Employees — EasyPagar' }

export default async function EmployeesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Employees with their default site name joined
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('*, default_site:sites(id, name)')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true })

  // Active sites for the dropdown
  const { data: sites, error: siteError } = await supabase
    .from('sites')
    .select('id, name, address, client_name, client_phone, monthly_rate, is_active, notes, created_at')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (empError || siteError) {
    return (
      <div className="p-8 text-sm text-red-500">
        Failed to load data: {empError?.message ?? siteError?.message}
      </div>
    )
  }

  return (
    <EmployeesClient
      employees={(employees ?? []) as unknown as Employee[]}
      sites={(sites ?? []) as Site[]}
    />
  )
}
