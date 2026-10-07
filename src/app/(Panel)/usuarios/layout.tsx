import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'

export default async function layout({ children }: { children: React.ReactNode }) {
  const autorizacion = await requireRole('ADMIN')

  if (!autorizacion.ok) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
