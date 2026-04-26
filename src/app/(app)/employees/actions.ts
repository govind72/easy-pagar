'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type EmployeeFormState = {
  error: string | null
  // Timestamp (ms) of the last successful save, 0 = never saved.
  // Using a timestamp instead of boolean ensures each new success
  // is a distinct value, so useEffect([state.successAt]) always fires.
  successAt: number
}

export async function upsertEmployee(
  prevState: EmployeeFormState,
  formData: FormData
): Promise<EmployeeFormState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const id = formData.get('id') as string | null
  const name = (formData.get('name') as string).trim()
  const phone = (formData.get('phone') as string).trim() || null
  const daily_rate = Number(formData.get('daily_rate'))
  const default_site_id = (formData.get('default_site_id') as string) || null
  const joined_date = formData.get('joined_date') as string
  const is_active = formData.get('is_active') === 'true'
  const notes = (formData.get('notes') as string).trim() || null

  if (!name) return { error: 'Name is required', successAt: 0 }
  if (!daily_rate || daily_rate <= 0) return { error: 'Daily rate must be greater than 0', successAt: 0 }

  const payload = {
    name,
    phone,
    daily_rate,
    default_site_id,
    joined_date,
    is_active,
    notes,
  }

  let error

  if (id) {
    // Update existing employee
    const { error: updateError } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', id)
    error = updateError
  } else {
    // Insert new employee
    const { error: insertError } = await supabase
      .from('employees')
      .insert(payload)
    error = insertError
  }

  if (error) {
    return { error: error.message, successAt: 0 }
  }

  revalidatePath('/employees')
  return { error: null, successAt: Date.now() }
}
