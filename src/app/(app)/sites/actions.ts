'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type SiteFormState = {
  error: string | null
  // Timestamp (ms) of the last successful save, 0 = never saved.
  // Using a timestamp instead of boolean ensures each new success
  // is a distinct value, so useEffect([state.successAt]) always fires —
  // even when saving multiple sites back-to-back.
  successAt: number
}

export async function upsertSite(
  prevState: SiteFormState,
  formData: FormData
): Promise<SiteFormState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const id = formData.get('id') as string | null
  const name = (formData.get('name') as string).trim()
  const client_name = (formData.get('client_name') as string).trim() || null
  const client_phone = (formData.get('client_phone') as string).trim() || null
  const address = (formData.get('address') as string).trim() || null
  const monthly_rate = Number(formData.get('monthly_rate'))
  const is_active = formData.get('is_active') === 'true'
  const notes = (formData.get('notes') as string).trim() || null

  if (!name) return { error: 'Site name is required', successAt: 0 }
  if (!monthly_rate || monthly_rate <= 0)
    return { error: 'Monthly rate must be greater than 0', successAt: 0 }

  const payload = { name, client_name, client_phone, address, monthly_rate, is_active, notes }

  let error

  if (id) {
    const { error: updateError } = await supabase
      .from('sites')
      .update(payload)
      .eq('id', id)
    error = updateError
  } else {
    const { error: insertError } = await supabase.from('sites').insert(payload)
    error = insertError
  }

  if (error) return { error: error.message, successAt: 0 }

  revalidatePath('/sites')
  return { error: null, successAt: Date.now() }
}
