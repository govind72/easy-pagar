import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import SitesClient from './SitesClient'
import type { Site } from '@/lib/types'

export const metadata = { title: 'Sites — EasyPagar' }

export default async function SitesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: sites, error } = await supabase
    .from('sites')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="p-8 text-sm text-red-500">
        Failed to load sites: {error.message}
      </div>
    )
  }

  return <SitesClient sites={(sites ?? []) as Site[]} />
}
