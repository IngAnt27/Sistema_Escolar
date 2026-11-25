'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CreditCard,
  ShieldCheck,
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  BookOpen,
  Menu,
  X,
} from 'lucide-react'
import { LogoutButton } from '@/components/LogoutButton'

export type Rol = 'director' | 'docente' | 'cajero'

interface SidebarNavProps {
  nombreUsuario: string
  rol: Rol
}

const MENU_ITEMS: {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: Rol[]
}[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['director', 'docente', 'cajero'] },
  { href: '/dashboard/estudiantes', label: 'Estudiantes', icon: Users, roles: ['director', 'docente'] },
  { href: '/dashboard/asistencia', label: 'Asistencia', icon: ClipboardCheck, roles: ['director', 'docente'] },
  { href: '/dashboard/pagos', label: 'Pagos', icon: CreditCard, roles: ['director', 'cajero'] },
  { href: '/dashboard/usuarios', label: 'Usuarios', icon: ShieldCheck, roles: ['director'] },
  { href: '/dashboard/tareas', label: 'Tareas', icon: BookOpenCheck, roles: ['director', 'docente'] },
  { href: '/dashboard/informes', label: 'Informes', icon: BarChart3, roles: ['director', 'docente'] },
  { href: '/dashboard/notas', label: 'Notas', icon: BookOpen, roles: ['director', 'docente'] },
]

export function SidebarNav({ nombreUsuario, rol }: SidebarNavProps) {
  const pathname = usePathname()
  const [abiertoMovil, setAbiertoMovil] = useState(false)

  const itemsPermitidos = MENU_ITEMS.filter((item) => item.roles.includes(rol))

  const contenidoMenu = (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-300">
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-wider text-white">
            KORA
          </span>
        </Link>
        <button
          onClick={() => setAbiertoMovil(false)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {itemsPermitidos.map((item) => {
          const Icon = item.icon
          const activo =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAbiertoMovil(false)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                activo
                  ? 'bg-blue-600/20 text-white ring-1 ring-blue-500/50 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  activo ? 'text-blue-400' : 'text-slate-400'
                }`}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-4">
        <div className="rounded-2xl bg-slate-800/60 p-3.5 ring-1 ring-slate-700/50">
          <p className="truncate text-sm font-semibold text-white">
            {nombreUsuario}
          </p>
          <span className="mt-1 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-300">
            {rol}
          </span>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#0f172a] px-4 text-white shadow-sm md:hidden print:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAbiertoMovil(true)}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-black tracking-wider">KORA</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-300">
            {rol}
          </span>
          <LogoutButton compact />
        </div>
      </header>

      {abiertoMovil && (
        <div className="fixed inset-0 z-50 flex md:hidden print:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setAbiertoMovil(false)}
          />
          <aside className="relative z-10 w-72 max-w-[80vw] shadow-2xl">
            {contenidoMenu}
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 md:flex md:flex-col print:hidden">
        <div className="sticky top-0 h-screen">{contenidoMenu}</div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 py-2 backdrop-blur-sm md:hidden print:hidden">
        {itemsPermitidos.slice(0, 4).map((item) => {
          const Icon = item.icon
          const activo =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition ${
                activo ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}