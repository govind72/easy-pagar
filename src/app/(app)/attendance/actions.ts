'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { AttendanceStatus } from '@/lib/types'

export type AttendanceRow = {
  employee_id: string
  date: string
  status: AttendanceStatus
  site_id: string | null
  advance_amount: number
  advance_reason: string | null
  comment: string | null
}

export type SaveResult = {
  error: string | null
  // Timestamp ensures useEffect fires on every save, even consecutive ones
  successAt: number
}

export async function saveAttendance(rows: AttendanceRow[]): Promise<SaveResult> {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'employee_id,date' })

    if (error) return { error: error.message, successAt: 0 }

    revalidatePath('/attendance')
    return { error: null, successAt: Date.now() }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error', successAt: 0 }
  }
}
