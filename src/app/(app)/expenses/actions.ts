'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

type Result = { error: string | null; successAt: number }

/* ── Site Expenses ─────────────────────────────────────── */

export async function upsertSiteExpense(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const id          = formData.get('id') as string | null
    const site_id     = formData.get('site_id') as string
    const date        = formData.get('date') as string
    const description = (formData.get('description') as string).trim()
    const category    = formData.get('category') as string
    const amount      = Number(formData.get('amount'))

    if (!site_id)     return { error: 'Site is required', successAt: 0 }
    if (!description) return { error: 'Description is required', successAt: 0 }
    if (!amount || amount <= 0) return { error: 'Amount must be greater than 0', successAt: 0 }

    const payload = { site_id, date, description, category: category.toLowerCase(), amount }
    const { error } = id
      ? await supabase.from('site_expenses').update(payload).eq('id', id)
      : await supabase.from('site_expenses').insert(payload)

    if (error) return { error: error.message, successAt: 0 }
    revalidatePath('/expenses')
    return { error: null, successAt: Date.now() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error', successAt: 0 }
  }
}

export async function deleteSiteExpense(id: string): Promise<Result> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.from('site_expenses').delete().eq('id', id)
    if (error) return { error: error.message, successAt: 0 }
    revalidatePath('/expenses')
    return { error: null, successAt: Date.now() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error', successAt: 0 }
  }
}

/* ── Extra Services ────────────────────────────────────── */

export async function upsertExtraService(_prev: Result, formData: FormData): Promise<Result> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const id          = formData.get('id') as string | null
    const site_id     = formData.get('site_id') as string
    const date        = formData.get('date') as string
    const description = (formData.get('description') as string).trim()
    const amount      = Number(formData.get('amount'))

    if (!site_id)     return { error: 'Site is required', successAt: 0 }
    if (!description) return { error: 'Description is required', successAt: 0 }
    if (!amount || amount <= 0) return { error: 'Amount must be greater than 0', successAt: 0 }

    const payload = { site_id, date, description, amount }
    const { error } = id
      ? await supabase.from('extra_services').update(payload).eq('id', id)
      : await supabase.from('extra_services').insert(payload)

    if (error) return { error: error.message, successAt: 0 }
    revalidatePath('/expenses')
    return { error: null, successAt: Date.now() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error', successAt: 0 }
  }
}

export async function deleteExtraService(id: string): Promise<Result> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { error } = await supabase.from('extra_services').delete().eq('id', id)
    if (error) return { error: error.message, successAt: 0 }
    revalidatePath('/expenses')
    return { error: null, successAt: Date.now() }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error', successAt: 0 }
  }
}

export type ExpenseResult = Result
