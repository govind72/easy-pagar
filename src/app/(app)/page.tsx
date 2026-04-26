import { redirect } from 'next/navigation'

// app/page.tsx takes precedence for "/" and redirects to /dashboard.
// This file is kept as a safety redirect in case routing behavior changes.
export default function AppRootPage() {
  redirect('/dashboard')
}

