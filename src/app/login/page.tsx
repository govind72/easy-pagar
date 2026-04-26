import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign in — EasyPagar',
  description: 'Sign in to the EasyPagar attendance and expense management dashboard.',
}

export default function LoginPage() {
  return <LoginForm />
}
