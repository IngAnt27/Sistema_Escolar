import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  ShieldCheck,
  GraduationCap,
  BookOpenCheck,
  BarChart3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/LogoutButton'

type Rol = 'director' | 'docente' | 'cajero'

const MENU_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['director', 'docente', 'cajero'] },
  { href: '/dashboard/estudiantes', label: 'Estudiantes', icon: Users, roles: ['director', 'docente'] },
  { href: '/dashboard/asistencia', label: 'Asistencia', icon: ClipboardCheck, roles: ['director', 'docente'] },
  { href: '/dashboard/pagos', label: 'Pagos', icon: CreditCard, roles: ['director', 'cajero'] },
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: ShieldCheck, roles: ['director'] },
  { href: '/dashboard/tareas', label: 'Tareas', icon: BookOpenCheck, roles: ['director', 'docente'] },  
  {href: '/dashboard/informes', label: 'Informes', icon: BarChart3, roles: ['director', 'docente']},
  {href: '/dashboard/notas', label: 'Notas', icon: BookOpenCheck, roles: ['director', 'docente']},
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await connection()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombres, apellidos, rol')
    .eq('id', user.id)
    .single()

  const rol = (perfil?.rol ?? 'docente') as Rol
  const itemsPermitidos = MENU_ITEMS.filter((item) => item.roles.includes(rol))

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] print:block print:bg-white">
      {/* Sidebar de Escritorio */}
      <aside className="hidden w-64 flex-col border-r border-[#E2E8F0] bg-white md:flex print:hidden" >
        <div className="flex h-16 items-center gap-2.5 border-b border-[#E2E8F0] px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Sistema Escolar
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {itemsPermitidos.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-[#2563EB]"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Tarjeta de usuario */}
        <div className="border-t border-[#E2E8F0] p-4">
          <div className="rounded-xl bg-[#F8FAFC] p-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {perfil?.nombres || 'Usuario'} {perfil?.apellidos || ''}
            </p>
            <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-800">
              {rol}
            </span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        {/* Header móvil */}
        <header className="flex h-14 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#2563EB]" />
            <span className="font-bold text-slate-900">Sistema Escolar</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-800">
            {rol}
          </span>
          <LogoutButton compact />
        </header>

        <main className="flex-1 p-4 sm:p-8 print:p-0 print:m-0 print:w-full" >
          {children}
        </main>
      </div>

      {/* Navegación Inferior Móvil (Mobile-First) */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-[#E2E8F0] bg-white py-2 md:hidden">
        {itemsPermitidos.slice(0, 4).map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium text-slate-600 hover:text-[#2563EB]"
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}