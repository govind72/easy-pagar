// EasyPagar — shared TypeScript types
// These match the Supabase tables exactly

export type AttendanceStatus = 'present' | 'absent' | 'half'

export type ExpenseCategory = 'materials' | 'fuel' | 'tools' | 'transport' | 'general'

export interface Site {
  id: string
  name: string
  address: string | null
  client_name: string | null
  client_phone: string | null
  monthly_rate: number
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface Employee {
  id: string
  name: string
  phone: string | null
  daily_rate: number
  default_site_id: string | null
  is_active: boolean
  joined_date: string
  notes: string | null
  created_at: string
  // joined relation
  default_site?: Site
}

export interface Attendance {
  id: string
  employee_id: string
  site_id: string | null
  date: string
  status: AttendanceStatus
  advance_amount: number
  advance_reason: string | null
  comment: string | null
  created_at: string
  // joined relations
  employee?: Employee
  site?: Site
}

export interface SiteExpense {
  id: string
  site_id: string
  date: string
  description: string
  category: ExpenseCategory
  amount: number
  created_at: string
  site?: Site
}

export interface ExtraService {
  id: string
  site_id: string
  date: string
  description: string
  amount: number
  created_at: string
  site?: Site
}

// View types returned by Supabase views
export interface MonthlySalaryRow {
  employee_id: string
  employee_name: string
  daily_rate: number
  month: string
  present_days: number
  half_days: number
  absent_days: number
  worked_days_raw: number
  effective_days: number
  gross_salary: number
  total_advances: number
  net_payable: number
}

export interface SitePnlRow {
  site_id: string
  site_name: string
  client_name: string | null
  monthly_rate: number
  month: string
  labour_cost: number
  extra_revenue: number
  site_expenses: number
  total_billed: number
  net_profit: number
}

// Helper for the daily attendance page
export interface AttendanceRowState {
  employeeId: string
  status: AttendanceStatus
  siteId: string | null
  advanceAmount: number
  advanceReason: string
  comment: string
}