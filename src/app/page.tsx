import { redirect } from 'next/navigation'

// Next.js picks this file for "/" (over the (app) group).
// We immediately hand off to /dashboard which lives inside (app)/ and gets the sidebar layout.
export default function RootPage() {
  redirect('/dashboard')
}

